/**
 * Types for SEO audit functionality
 */

/**
 * URL pattern used for including or excluding URLs during crawling
 */
export interface UrlPattern {
  id: string;
  pattern: string; // Glob pattern, e.g. "/blog/*"
  description?: string;
}

/**
 * Options for configuring a site audit
 */
export interface AuditOptions {
  projectId: string;
  siteUrl: string;
  maxPages?: number;
  maxDepth?: number;
  includeSitemap?: boolean;
  includeRobots?: boolean;
  crawlSingleUrl?: boolean;
  followPatterns?: UrlPattern[];
  ignorePatterns?: UrlPattern[];
  userAgent?: string;
  checkBrokenLinks?: boolean;
  checkMobileFriendliness?: boolean;
  checkPerformance?: boolean;
  useJavascript?: boolean;
}

/**
 * SEO issue found during an audit
 */
export interface AuditIssue {
  type: string;
  severity: 'critical' | 'error_severity' | 'warning' | 'info';
  description: string;
  recommendation?: string;
  selector?: string;
  code?: string;
}

/**
 * Results for a single page in the audit
 */
export interface PageAuditResult {
  url: string;
  title: string;
  description: string;
  status: number | string;
  loadTime: number;
  contentLength: number;
  pageSizeKB?: number;
  h1: string[];
  h2: string[];
  h3: string[];
  internalLinks: string[];
  externalLinks: string[];
  images: {
    src: string;
    alt: string;
    size?: { width: number; height: number };
  }[];
  canonicalUrl?: string;
  metaRobots?: string;
  structured?: Record<string, any>;
  hasStructuredData?: boolean;
  isMobileFriendly?: boolean;
  hasProperHeadingStructure?: boolean;
  error?: string;
  issues: AuditIssue[];
}

/**
 * Summary of issues found in an audit
 */
export interface IssueSummary {
  critical: number;
  error_severity: number;
  warning: number;
  info: number;
}

/**
 * SEO issue found during an audit
 */
export interface SeoIssue {
  id: string;
  url: string;
  type: 'critical' | 'error_severity' | 'warning' | 'info';
  category: 'content' | 'meta' | 'performance' | 'security' | 'technical' | 'other';
  title: string;
  description: string;
  impact: number; // 0-100 scale for how severe the issue is
  recommendations?: string[];
  element?: string; // HTML element related to the issue, if applicable
  screenshot?: string; // Base64 encoded screenshot
}

/**
 * Overall audit result
 */
export interface AuditResult {
  id: string;
  projectId: string;
  siteUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  totalPages: number;
  options: AuditOptions;
  pageResults?: PageAuditResult[];
  issuesSummary: IssueSummary;
  errorMessage?: string;
  htmlReport?: string;
  progressPercentage?: number;
}

/**
 * Audit schedule configuration
 */
export interface AuditSchedule {
  id: string;
  projectId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
  options: AuditOptions;
  createdAt: Date;
  updatedAt: Date;
}