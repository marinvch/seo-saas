import { prisma } from "@/lib/db/prisma-client";
import { AuditOptions, UrlPattern } from "@/types/audit-types";
import { MockAuditService } from "./mock-audit-service";
import { AuditStatus } from "@prisma/client";
import { memoryQueue, JOB_TYPES } from "@/lib/queue/memory-queue";

interface StartAuditOptions extends AuditOptions {
  projectId: string;
}

interface UpdateAuditOptions {
  siteUrl?: string;
  status?: AuditStatus;
  maxPages?: number;
  maxDepth?: number;
  includeSitemap?: boolean;
  includeRobots?: boolean;
  crawlSingleUrl?: boolean;
  followPatterns?: UrlPattern[];
  ignorePatterns?: UrlPattern[];
  userAgent?: string;
  useJavascript?: boolean;
}

export class AuditService {
  /**
   * Starts a new site audit for a project
   */
  public async startAudit(options: StartAuditOptions): Promise<string> {
    // Determine if we should use JavaScript rendering based on site type
    // This can be expanded with more sophisticated logic
    const useJavascript = true; // Default to using JavaScript rendering

    // 1. Create a new audit record
    const audit = await prisma.siteAudit.create({
      data: {
        siteUrl: options.siteUrl,
        status: AuditStatus.PENDING,
        startedAt: new Date(),
        project: {
          connect: { id: options.projectId }
        },
        options: {
          maxPages: options.maxPages || 100,
          maxDepth: options.maxDepth || 3,
          includeSitemap: options.includeSitemap ?? true,
          includeRobots: options.includeRobots ?? true,
          crawlSingleUrl: options.crawlSingleUrl ?? false,
          followPatterns: options.followPatterns || [],
          ignorePatterns: options.ignorePatterns || [],
          userAgent: options.userAgent || "SEO SaaS Auditor/1.0",
          useJavascript: options.useJavascript ?? useJavascript,
        },
        totalPages: 0,
        issuesSummary: { critical: 0, error: 0, warning: 0, info: 0 },
      }
    });

    // 2. Add the audit job to the queue
    try {
      await memoryQueue.add(JOB_TYPES.RUN_AUDIT, {
        auditId: audit.id,
        projectId: options.projectId,
        siteUrl: options.siteUrl,
        maxPages: options.maxPages || 100,
        maxDepth: options.maxDepth || 3,
        includeSitemap: options.includeSitemap ?? true,
        includeRobots: options.includeRobots ?? true,
        crawlSingleUrl: options.crawlSingleUrl ?? false,
        followPatterns: options.followPatterns || [],
        ignorePatterns: options.ignorePatterns || [],
        userAgent: options.userAgent || "SEO SaaS Auditor/1.0",
        useJavascript: options.useJavascript ?? useJavascript,
      });
    } catch (error) {
      // If queueing fails, update the audit status
      console.error("Failed to queue audit job:", error);
      await prisma.siteAudit.update({
        where: { id: audit.id },
        data: {
          status: AuditStatus.FAILED,
          errorMessage: "Failed to queue audit job",
        }
      });
      throw new Error("Failed to queue audit job: " + (error instanceof Error ? error.message : String(error)));
    }

    return audit.id;
  }

  /**
   * Gets all audits for a project
   */
  public async getAuditsForProject(projectId: string) {
    return prisma.siteAudit.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' }
    });
  }

  /**
   * Gets a specific audit by ID
   */
  public async getAudit(auditId: string) {
    return prisma.siteAudit.findUnique({
      where: { id: auditId }
    });
  }

  /**
   * Updates an existing audit
   */
  public async updateAudit(auditId: string, options: UpdateAuditOptions) {
    // Get the current audit to update
    const currentAudit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
    });

    if (!currentAudit) {
      throw new Error(`Audit with ID ${auditId} not found`);
    }

    // Only allow updates for audits that are not in progress
    if (currentAudit.status === AuditStatus.IN_PROGRESS) {
      throw new Error("Cannot update an audit that is currently in progress");
    }

    // Prepare the update data
    const updateData: any = {};
    
    // Update main audit fields
    if (options.siteUrl !== undefined) updateData.siteUrl = options.siteUrl;
    if (options.status !== undefined) updateData.status = options.status;

    // Update options
    const currentOptions = currentAudit.options as Record<string, any>;
    const updatedOptions = { ...currentOptions };
    
    if (options.maxPages !== undefined) updatedOptions.maxPages = options.maxPages;
    if (options.maxDepth !== undefined) updatedOptions.maxDepth = options.maxDepth;
    if (options.includeSitemap !== undefined) updatedOptions.includeSitemap = options.includeSitemap;
    if (options.includeRobots !== undefined) updatedOptions.includeRobots = options.includeRobots;
    if (options.crawlSingleUrl !== undefined) updatedOptions.crawlSingleUrl = options.crawlSingleUrl;
    if (options.userAgent !== undefined) updatedOptions.userAgent = options.userAgent;
    if (options.useJavascript !== undefined) updatedOptions.useJavascript = options.useJavascript;
    
    if (options.followPatterns !== undefined) {
      updatedOptions.followPatterns = options.followPatterns;
    }
    
    if (options.ignorePatterns !== undefined) {
      updatedOptions.ignorePatterns = options.ignorePatterns;
    }
    
    updateData.options = updatedOptions;

    // Update the audit record
    return prisma.siteAudit.update({
      where: { id: auditId },
      data: updateData
    });
  }

  /**
   * Deletes an audit
   */
  public async deleteAudit(auditId: string) {
    // Get the audit to check if it exists
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new Error(`Audit with ID ${auditId} not found`);
    }

    // Delete the audit and its related data
    return prisma.siteAudit.delete({
      where: { id: auditId }
    });
  }

  /**
   * Restarts an existing audit
   */
  public async restartAudit(auditId: string) {
    // Get the current audit
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new Error(`Audit with ID ${auditId} not found`);
    }

    // Update the audit status and reset timestamps
    const updatedAudit = await prisma.siteAudit.update({
      where: { id: auditId },
      data: {
        status: AuditStatus.PENDING,
        startedAt: new Date(),
        completedAt: null,
      }
    });

    // Queue a new audit job with the same options
    const options = audit.options as Record<string, any>;
    
    try {
      await memoryQueue.add(JOB_TYPES.RUN_AUDIT, {
        auditId,
        projectId: audit.projectId,
        siteUrl: audit.siteUrl,
        ...options
      });
    } catch (error) {
      // If queueing fails, update the audit status
      console.error("Failed to queue restart audit job:", error);
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          status: AuditStatus.FAILED,
          errorMessage: "Failed to restart audit",
        }
      });
      throw new Error("Failed to queue restart audit job: " + (error instanceof Error ? error.message : String(error)));
    }

    return updatedAudit;
  }
  
  /**
   * Generate a report from an audit
   */
  public async generateReport(auditId: string, format: 'pdf' | 'html' = 'html') {
    // Check if the audit exists and is completed
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new Error(`Audit with ID ${auditId} not found`);
    }

    if (audit.status !== AuditStatus.COMPLETED) {
      throw new Error(`Audit with ID ${auditId} is not completed`);
    }

    // Queue a report generation job
    try {
      await memoryQueue.add(JOB_TYPES.GENERATE_REPORT, {
        auditId,
        format,
      });
      
      return { success: true, message: `Report generation queued in ${format} format` };
    } catch (error) {
      console.error("Failed to queue report generation job:", error);
      throw new Error("Failed to generate report: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}