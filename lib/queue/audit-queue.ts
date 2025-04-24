import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import { CrawlerService } from '../crawler/crawler-service';
import { prisma } from '../db/prisma-client';
import { AuditStatus } from '@prisma/client';

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Queue names
export const QUEUE_NAMES = {
  AUDIT: 'audit-queue',
  KEYWORD: 'keyword-queue',
  REPORT: 'report-queue',
};

// Job types
export const JOB_TYPES = {
  RUN_AUDIT: 'run-audit',
  SCHEDULE_AUDIT: 'schedule-audit',
  GENERATE_REPORT: 'generate-report',
};

// Create the queue instance
export const auditQueue = new Queue(QUEUE_NAMES.AUDIT, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,  // Keep the last 100 completed jobs
    removeOnFail: 200,      // Keep the last 200 failed jobs
  },
});

// Create a scheduler for handling delayed jobs (like scheduled audits)
export const auditScheduler = new QueueScheduler(QUEUE_NAMES.AUDIT, { connection });

/**
 * Start the worker process that consumes jobs from the queue
 */
export function startAuditWorker() {
  const worker = new Worker(
    QUEUE_NAMES.AUDIT,
    async (job: Job) => {
      console.log(`Processing job ${job.id} of type ${job.name}`);
      
      try {
        switch (job.name) {
          case JOB_TYPES.RUN_AUDIT:
            await processAuditJob(job);
            break;
          case JOB_TYPES.SCHEDULE_AUDIT:
            await processScheduledAuditJob(job);
            break;
          case JOB_TYPES.GENERATE_REPORT:
            await processGenerateReportJob(job);
            break;
          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error; // Re-throw to let BullMQ handle the retry
      }
    },
    { connection }
  );

  // Handle worker events
  worker.on('completed', job => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed with error:`, error);
    
    // If audit job failed, update the audit status in the database
    if (job?.name === JOB_TYPES.RUN_AUDIT) {
      const { auditId } = job.data;
      prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          status: AuditStatus.FAILED,
          errorMessage: error.message || 'Unknown error occurred',
        },
      }).catch(err => {
        console.error(`Failed to update audit status for audit ${auditId}:`, err);
      });
    }
  });

  console.log('Audit worker started');
  return worker;
}

/**
 * Handle the RUN_AUDIT job type
 */
async function processAuditJob(job: Job) {
  const { 
    auditId, 
    projectId, 
    siteUrl, 
    maxPages = 100, 
    maxDepth = 3,
    includeSitemap = true,
    includeRobots = true,
    crawlSingleUrl = false,
    followPatterns = [],
    ignorePatterns = [],
    userAgent,
    useJavascript = true,
  } = job.data;

  // Log the start of the audit
  console.log(`Starting audit for site ${siteUrl} (Audit ID: ${auditId})`);

  // Update the progress as we go
  await job.updateProgress(10);

  // Create an instance of the crawler service
  const crawlerService = new CrawlerService();

  // Update progress before crawling
  await job.updateProgress(20);

  // Start the crawl
  await crawlerService.startCrawl({
    auditId,
    projectId,
    siteUrl,
    maxPages,
    maxDepth,
    includeSitemap,
    includeRobots,
    crawlSingleUrl,
    followPatterns,
    ignorePatterns,
    userAgent,
    useJavascript,
  });

  // Update progress after crawling completes
  await job.updateProgress(100);
  console.log(`Audit completed for site ${siteUrl} (Audit ID: ${auditId})`);
}

/**
 * Handle the SCHEDULE_AUDIT job type - creates recurrent audit jobs based on the frequency
 */
async function processScheduledAuditJob(job: Job) {
  const { projectId, scheduleId } = job.data;
  
  try {
    // Get the schedule details
    const schedule = await prisma.auditSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: true,
      },
    });
    
    if (!schedule || !schedule.isActive) {
      console.log(`Schedule ${scheduleId} not found or not active, skipping`);
      return;
    }
    
    // Create a new audit record
    const audit = await prisma.siteAudit.create({
      data: {
        projectId: projectId,
        siteUrl: schedule.project.url,
        status: AuditStatus.PENDING,
        options: schedule.options,
        totalPages: 0,
        issuesSummary: { critical: 0, error_severity: 0, warning: 0, info: 0 },
      },
    });
    
    // Get audit options from schedule
    const options = JSON.parse(JSON.stringify(schedule.options));
    
    // Add the audit to the queue
    await auditQueue.add(JOB_TYPES.RUN_AUDIT, {
      auditId: audit.id,
      projectId,
      siteUrl: schedule.project.url,
      ...options,
    });
    
    // Update the schedule's lastRunAt timestamp
    await prisma.auditSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: new Date(),
      },
    });
    
    // Calculate next run date based on frequency
    const nextRunAt = calculateNextRunDate(schedule.frequency);
    
    // Schedule the next run
    await prisma.auditSchedule.update({
      where: { id: scheduleId },
      data: {
        nextRunAt,
      },
    });
    
    console.log(`Scheduled audit created for project ${projectId}, next run at ${nextRunAt}`);
  } catch (error) {
    console.error(`Error processing scheduled audit for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Handle the GENERATE_REPORT job type - creates PDF/HTML reports from audit data
 */
async function processGenerateReportJob(job: Job) {
  const { auditId, format = 'html' } = job.data;
  
  try {
    // Get the audit details
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
      },
    });
    
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }
    
    if (audit.status !== AuditStatus.COMPLETED) {
      throw new Error(`Audit ${auditId} is not completed, status: ${audit.status}`);
    }
    
    // TODO: Generate the report in the requested format
    console.log(`Generating ${format} report for audit ${auditId}`);
    
    // In a real implementation, you would:
    // 1. Get the full audit data from the KeyValueStore
    // 2. Use a report generation library to create the report
    // 3. Save the report to a storage service (S3, local file system, etc.)
    // 4. Update the audit record with the report URL
    
    console.log(`Report generated for audit ${auditId}`);
  } catch (error) {
    console.error(`Error generating report for audit ${auditId}:`, error);
    throw error;
  }
}

/**
 * Calculate the next run date based on frequency
 */
function calculateNextRunDate(frequency: string): Date {
  const now = new Date();
  const nextRun = new Date();
  
  // Set to a reasonable time for running audits (e.g., 2 AM)
  nextRun.setHours(2, 0, 0, 0);
  
  switch (frequency) {
    case 'daily':
      // Start tomorrow
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      // Start next week
      nextRun.setDate(now.getDate() + (now.getHours() >= 2 ? 7 : 1));
      break;
    case 'monthly':
      // Start next month, same day
      nextRun.setMonth(now.getMonth() + 1);
      break;
    default:
      // Default to weekly
      nextRun.setDate(now.getDate() + 7);
  }
  
  return nextRun;
}

/**
 * Add a scheduled audit check job that runs periodically
 * This should be called when the server starts
 */
export async function setupAuditScheduleChecker() {
  // Remove any existing schedule checker jobs
  const existingJobs = await auditQueue.getJobs(['delayed', 'waiting']);
  for (const job of existingJobs) {
    if (job.name === 'check-audit-schedules') {
      await job.remove();
    }
  }
  
  // Add a repeatable job to check for schedules that need to run
  await auditQueue.add(
    'check-audit-schedules',
    { timestamp: Date.now() },
    {
      repeat: {
        pattern: '0 */1 * * *', // Run every hour
      },
      jobId: 'audit-schedule-checker', // Unique ID to prevent duplicates
    }
  );
  
  // Set up the handler for this repeatable job
  const worker = new Worker(
    QUEUE_NAMES.AUDIT,
    async (job: Job) => {
      if (job.name === 'check-audit-schedules') {
        await checkAndQueueScheduledAudits();
      }
    },
    { connection }
  );
  
  console.log('Audit schedule checker set up');
  return worker;
}

/**
 * Check for scheduled audits that are due to run and queue them
 */
async function checkAndQueueScheduledAudits() {
  try {
    const now = new Date();
    
    // Find all active schedules that are due to run
    const dueSchedules = await prisma.auditSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now, // Less than or equal to now
        },
      },
      include: {
        project: true,
      },
    });
    
    console.log(`Found ${dueSchedules.length} audit schedules due to run`);
    
    // Queue a job for each due schedule
    for (const schedule of dueSchedules) {
      await auditQueue.add(JOB_TYPES.SCHEDULE_AUDIT, {
        projectId: schedule.projectId,
        scheduleId: schedule.id,
      });
      
      console.log(`Queued scheduled audit for project ${schedule.projectId}`);
    }
  } catch (error) {
    console.error('Error checking for scheduled audits:', error);
    // Don't re-throw, we don't want this periodic job to fail
  }
}