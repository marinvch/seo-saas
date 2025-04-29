import { PrismaClient } from '@prisma/client';
import { AuditScheduleConfig } from '@/types/audit';

/**
 * Service for scheduling and managing automated SEO audits
 */
export class AuditScheduler {
  private static instance: AuditScheduler;
  private prisma: PrismaClient;
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 60000; // Check every minute in production
  private isInitialized = false;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get the singleton instance of the AuditScheduler
   */
  public static getInstance(): AuditScheduler {
    if (!AuditScheduler.instance) {
      AuditScheduler.instance = new AuditScheduler();
    }
    return AuditScheduler.instance;
  }

  /**
   * Initialize the scheduler and start checking for scheduled audits
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Audit scheduler already initialized');
      return;
    }

    try {
      // Start the scheduler interval
      this.intervalId = setInterval(() => this.checkScheduledAudits(), this.checkIntervalMs);
      this.isInitialized = true;
      console.log('Audit scheduler started successfully');
      
      // Run an immediate check
      this.checkScheduledAudits();
    } catch (error) {
      console.error('Failed to initialize audit scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isInitialized = false;
      console.log('Audit scheduler stopped');
    }
  }

  /**
   * Check for audits that need to be run
   */
  private async checkScheduledAudits(): Promise<void> {
    try {
      // Find all active audit schedules where nextRunAt is in the past
      const schedulesToRun = await this.prisma.auditSchedule.findMany({
        where: {
          isActive: true,
          nextRunAt: {
            lte: new Date()
          }
        },
        include: {
          project: true
        }
      });

      // Process each schedule
      for (const schedule of schedulesToRun) {
        try {
          console.log(`Running scheduled audit for project: ${schedule.projectId}`);
          
          // Start the audit
          await this.startAudit(schedule);

          // Update the schedule's lastRunAt and calculate the next run date
          await this.updateScheduleAfterRun(schedule);
        } catch (scheduleError) {
          console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
          // Continue with other schedules even if one fails
        }
      }
    } catch (error) {
      console.error('Error checking scheduled audits:', error);
    }
  }

  /**
   * Start an audit for a scheduled job
   */
  private async startAudit(schedule: any): Promise<void> {
    try {
      // Create a new audit entry
      const auditOptions = schedule.options || {};
      
      // Create the audit in the database
      const audit = await this.prisma.siteAudit.create({
        data: {
          projectId: schedule.projectId,
          siteUrl: schedule.project.url,
          status: 'PENDING',
          options: auditOptions,
          issuesSummary: {
            critical: 0,
            warning: 0,
            info: 0,
            total: 0
          }
        }
      });

      // Queue the actual crawl job (this would typically be done through a job queue)
      // For now, we'll simulate this with a direct API call
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auditId: audit.id }),
      }).catch((error) => {
        console.error(`Failed to queue audit job for ${audit.id}:`, error);
      });

      console.log(`Scheduled audit created: ${audit.id}`);
    } catch (error) {
      console.error('Failed to start scheduled audit:', error);
      throw error;
    }
  }

  /**
   * Update the schedule after running an audit
   */
  private async updateScheduleAfterRun(schedule: any): Promise<void> {
    try {
      const now = new Date();
      const nextRunAt = this.calculateNextRunDate(now, schedule.frequency);

      await this.prisma.auditSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt
        }
      });
      
      console.log(`Updated schedule ${schedule.id}, next run at: ${nextRunAt}`);
    } catch (error) {
      console.error(`Failed to update schedule ${schedule.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate the next run date based on frequency
   */
  private calculateNextRunDate(fromDate: Date, frequency: string): Date {
    const nextRun = new Date(fromDate);
    
    switch (frequency.toLowerCase()) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        // Default to weekly if frequency is unknown
        nextRun.setDate(nextRun.getDate() + 7);
    }
    
    return nextRun;
  }

  /**
   * Create or update an audit schedule
   */
  public async createOrUpdateSchedule(config: AuditScheduleConfig): Promise<any> {
    try {
      if (config.id) {
        // Update existing schedule
        return await this.prisma.auditSchedule.update({
          where: { id: config.id },
          data: {
            frequency: config.frequency,
            isActive: config.isActive,
            options: config.options,
            nextRunAt: new Date(config.nextRunAt)
          }
        });
      } else {
        // Create new schedule
        return await this.prisma.auditSchedule.create({
          data: {
            projectId: config.projectId,
            frequency: config.frequency,
            isActive: config.isActive,
            options: config.options,
            nextRunAt: new Date(config.nextRunAt)
          }
        });
      }
    } catch (error) {
      console.error('Failed to create/update audit schedule:', error);
      throw error;
    }
  }

  /**
   * Delete an audit schedule
   */
  public async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await this.prisma.auditSchedule.delete({
        where: { id: scheduleId }
      });
    } catch (error) {
      console.error(`Failed to delete audit schedule ${scheduleId}:`, error);
      throw error;
    }
  }
}