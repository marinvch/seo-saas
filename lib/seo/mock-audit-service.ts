import { AuditStatus } from "@prisma/client";

// Mock service to create test audit data
export class MockAuditService {
  /**
   * Creates a mock audit with realistic test data
   * @param projectId The project ID to associate the audit with
   * @param siteUrl The URL of the site being audited
   */
  public static createMockAudit(projectId: string, siteUrl: string) {
    const now = new Date();
    
    // For completed audits, set a completion date 5 minutes ago
    const completedAt = new Date(now.getTime() - 5 * 60 * 1000);
    
    return {
      id: `mock-audit-${Date.now()}`,
      projectId,
      siteUrl,
      status: AuditStatus.COMPLETED,
      startedAt: completedAt,
      completedAt,
      totalPages: Math.floor(Math.random() * 50) + 10, // 10-60 pages
      issuesSummary: {
        critical: Math.floor(Math.random() * 5), // 0-4 critical issues
        error: Math.floor(Math.random() * 10) + 2, // 2-11 errors
        warning: Math.floor(Math.random() * 20) + 5, // 5-24 warnings
        info: Math.floor(Math.random() * 30) + 10, // 10-39 notices
      },
      htmlReport: "<html><body><h1>Mock Audit Report</h1></body></html>",
    };
  }
  
  /**
   * Creates an in-progress mock audit
   * @param projectId The project ID to associate the audit with
   * @param siteUrl The URL of the site being audited
   */
  public static createInProgressAudit(projectId: string, siteUrl: string) {
    const now = new Date();
    
    return {
      id: `inprogress-audit-${Date.now()}`,
      projectId,
      siteUrl,
      status: AuditStatus.IN_PROGRESS,
      startedAt: now,
      completedAt: null,
      totalPages: Math.floor(Math.random() * 10) + 1, // 1-10 pages crawled so far
      issuesSummary: {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0,
      },
      htmlReport: null,
    };
  }
  
  /**
   * Creates a pending mock audit that hasn't started yet
   * @param projectId The project ID to associate the audit with
   * @param siteUrl The URL of the site being audited
   */
  public static createPendingAudit(projectId: string, siteUrl: string) {
    const now = new Date();
    
    return {
      id: `pending-audit-${Date.now()}`,
      projectId,
      siteUrl,
      status: AuditStatus.PENDING,
      startedAt: now,
      completedAt: null,
      totalPages: 0,
      issuesSummary: {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0,
      },
      htmlReport: null,
    };
  }
}