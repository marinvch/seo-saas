import { prisma } from '@/lib/db/prisma-client';
import { CrawlerService } from '@/lib/crawler/crawler-service';
import { AuditStatus } from '@prisma/client';
import { createJobHandler, JOB_TYPES, memoryQueue } from './memory-queue';

/**
 * Initialize job handlers for audit-related tasks
 */
export function initAuditHandlers() {
  // Handler for running audit jobs
  createJobHandler(JOB_TYPES.RUN_AUDIT, async (job) => {
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

    try {
      // Log the start of the audit
      console.log(`Starting audit for site ${siteUrl} (Audit ID: ${auditId})`);

      // Update audit status to IN_PROGRESS and set initial progress
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          status: AuditStatus.IN_PROGRESS,
          progressPercentage: 10,
        },
      });

      // Create an instance of the crawler service
      const crawlerService = new CrawlerService();

      // Update progress before crawling
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          progressPercentage: 20,
        },
      });

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
        onProgress: async (progress) => {
          // Update progress in the database as crawling progresses
          await prisma.siteAudit.update({
            where: { id: auditId },
            data: {
              progressPercentage: Math.min(20 + Math.floor(progress * 0.75), 95),
            },
          });
        },
      });

      // Set final progress and completed status
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          status: AuditStatus.COMPLETED,
          progressPercentage: 100,
        },
      });

      console.log(`Audit completed for site ${siteUrl} (Audit ID: ${auditId})`);
      return { success: true, auditId };
    } catch (error) {
      console.error(`Audit failed for site ${siteUrl} (Audit ID: ${auditId}):`, error);

      // Update audit status to failed
      try {
        await prisma.siteAudit.update({
          where: { id: auditId },
          data: {
            status: AuditStatus.FAILED,
            progressPercentage: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        });
      } catch (dbError) {
        console.error(`Failed to update audit status for audit ${auditId}:`, dbError);
      }

      throw error;
    }
  });

  // Handler for scheduled audit jobs
  createJobHandler(JOB_TYPES.SCHEDULE_AUDIT, async (job) => {
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
        return { success: false, reason: 'Schedule not found or not active' };
      }
      
      // Create a new audit record
      const audit = await prisma.siteAudit.create({
        data: {
          projectId: projectId,
          siteUrl: schedule.project.url,
          status: AuditStatus.PENDING,
          options: schedule.options as any,
          totalPages: 0,
          issuesSummary: { critical: 0, error: 0, warning: 0, info: 0 },
        },
      });
      
      // Get audit options from schedule
      const options = JSON.parse(JSON.stringify(schedule.options));
      
      // Add the audit to the queue
      await memoryQueue.add(JOB_TYPES.RUN_AUDIT, {
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
      return { success: true, auditId: audit.id };
    } catch (error) {
      console.error(`Error processing scheduled audit for project ${projectId}:`, error);
      throw error;
    }
  });

  // Handler for generating reports
  createJobHandler(JOB_TYPES.GENERATE_REPORT, async (job) => {
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
      
      // Generate the report in the requested format
      console.log(`Generating ${format} report for audit ${auditId}`);
      
      // In a real implementation, you would:
      // 1. Get the audit data from the database
      // 2. Generate a report using a template library
      // 3. Save the report to a storage service or local filesystem
      
      // For now, just simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportUrl = `/reports/audit-${auditId}.${format}`;
      
      console.log(`Report generated for audit ${auditId}: ${reportUrl}`);
      return { success: true, reportUrl };
    } catch (error) {
      console.error(`Error generating report for audit ${auditId}:`, error);
      throw error;
    }
  });

  console.log('Audit job handlers initialized');
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
 * Setup a periodic task to check for scheduled audits
 */
export async function setupAuditScheduleChecker() {
  async function checkSchedules() {
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
        await memoryQueue.add(JOB_TYPES.SCHEDULE_AUDIT, {
          projectId: schedule.projectId,
          scheduleId: schedule.id,
        });
        
        console.log(`Queued scheduled audit for project ${schedule.projectId}`);
      }
    } catch (error) {
      console.error('Error checking for scheduled audits:', error);
    }
  }

  // Run once at startup
  await checkSchedules();
  
  // Then set up interval (every hour)
  setInterval(checkSchedules, 60 * 60 * 1000);
  
  console.log('Audit schedule checker set up');
}