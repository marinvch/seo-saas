import { AuditStatus } from '@prisma/client';

/**
 * Represents an issue found during an SEO site audit
 */
export type AuditIssue = {
  id?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  details?: string;
  fix?: string;
  affectedUrls?: string[];
  category?: string;
};

/**
 * Represents progress data for an ongoing audit
 */
export type AuditProgressData = {
  auditId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  pagesDiscovered: number;
  pagesProcessed: number;
  error?: string;
};

/**
 * Represents the final result of a completed audit
 */
export type AuditResult = {
  id: string;
  projectId: string;
  siteUrl: string;
  startedAt: string;
  completedAt: string;
  pagesAnalyzed: number;
  issues: AuditIssue[];
  issuesSummary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  htmlReport?: string;
};

/**
 * Represents audit history entry data
 */
export type AuditHistoryEntry = {
  id: string;
  projectId: string;
  date: string; // ISO string
  totalPages: number;
  issuesSummary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  trend?: 'improved' | 'worse' | 'neutral';
};

/**
 * Audit schedule configuration
 */
export type AuditScheduleConfig = {
  id?: string;
  projectId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRunAt?: string;
  nextRunAt: string;
  isActive: boolean;
  options: Record<string, any>;
};

export type SiteAuditConfig = {
  startUrl: string;
  maxDepth: number;
  emulateDevice: 'desktop' | 'mobile';
  respectRobotsTxt: boolean;
  includeScreenshots: boolean;
  skipExternal: boolean;
  maxRequestsPerCrawl: number;
  maxConcurrency: number;
  includeSitemap: boolean;
  projectId?: string;
};

export type SiteAuditResult = {
  id: string;
  projectId: string;
  siteUrl: string;
  status: AuditStatus;
  startedAt: Date;
  completedAt?: Date | null;
  totalPages: number;
  progressPercentage?: number;
  options: Record<string, any>;
  pageResults?: Record<string, any>;
  issuesSummary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  errorMessage?: string;
  htmlReport?: string;
};

export type SEOIssue = {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string;
  url?: string;
  affectedUrls?: string[];
  suggestions?: string[];
};