import { prisma } from '../db/prisma-client';
import { AuditStatus } from '@prisma/client';
import { SiteCrawler } from './site-crawler';
import { log } from 'crawlee';

/**
 * Options for configuring a crawl
 */
interface CrawlerOptions {
  auditId: string;
  projectId: string;
  siteUrl: string;
  maxPages?: number;
  maxDepth?: number;
  includeSitemap?: boolean;
  includeRobots?: boolean;
  crawlSingleUrl?: boolean;
  followPatterns?: any[];
  ignorePatterns?: any[];
  userAgent?: string;
  useJavascript?: boolean;
  checkBrokenLinks?: boolean;
  checkMobileFriendliness?: boolean;
  checkPerformance?: boolean;
  onProgress?: (progress: number) => Promise<void>;
}

/**
 * Service responsible for crawling websites and storing audit results
 */
export class CrawlerService {
  /**
   * Start a web crawl using Crawlee's PlaywrightCrawler
   * @param options Configuration options for the crawl
   */
  public async startCrawl(options: CrawlerOptions): Promise<void> {
    try {
      log.info(`Starting crawl for audit ${options.auditId} (${options.siteUrl})`);
      
      // Update audit status to IN_PROGRESS
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: {
          status: AuditStatus.IN_PROGRESS,
          progressPercentage: 10, // Indicate that crawl is starting
        },
      });

      // Create and configure the crawler with advanced options
      const crawler = new SiteCrawler({
        projectId: options.projectId, // Ensure projectId is passed correctly
        siteUrl: options.siteUrl,
        maxPages: options.maxPages || 100,
        maxDepth: options.maxDepth || 3,
        includeSitemap: options.includeSitemap,
        includeRobots: options.includeRobots,
        crawlSingleUrl: options.crawlSingleUrl,
        followPatterns: options.followPatterns || [],
        ignorePatterns: options.ignorePatterns || [],
        userAgent: options.userAgent || 'Mozilla/5.0 (compatible; SEOSaaS/1.0; +https://example.com)',
        useJavascript: options.useJavascript, // Pass the useJavascript option
        checkBrokenLinks: options.checkBrokenLinks,
        checkMobileFriendliness: options.checkMobileFriendliness,
        checkPerformance: options.checkPerformance,
      });

      // Track progress with throttled database updates
      let lastProgress = 10;
      let lastUpdateTime = Date.now();
      
      // Start crawling with progress tracking
      await crawler.crawl(async (crawledPages, totalPages) => {
        // Calculate progress as a percentage
        const currentTime = Date.now();
        const progress = Math.min(10 + Math.floor((crawledPages / Math.max(totalPages, 1)) * 80), 90);
        
        // Only update if progress has changed significantly (every 5%) or it's been more than 5 seconds
        if (progress >= lastProgress + 5 || currentTime - lastUpdateTime > 5000) {
          lastProgress = progress;
          lastUpdateTime = currentTime;
          
          log.info(`Crawl progress: ${progress}% (${crawledPages}/${totalPages} pages)`);
          
          // Update the audit record with progress
          await prisma.siteAudit.update({
            where: { id: options.auditId },
            data: {
              progressPercentage: progress,
              totalPages: totalPages,
            },
          });
          
          // Call the progress callback if provided
          if (options.onProgress) {
            await options.onProgress(progress);
          }
        }
      });

      // Get the crawl results
      const { results, totalPages } = await crawler.getResults();
      const metrics = crawler.getCrawlMetrics();
      
      log.info(`Crawl completed: ${totalPages} pages crawled in ${metrics.elapsedTime}`);
      
      // Generate summary statistics
      const summary = crawler.getIssueSummary();
      const pageResultsArray = Object.values(results);
      
      // Update audit with results
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: {
          status: AuditStatus.COMPLETED,
          completedAt: new Date(),
          totalPages,
          progressPercentage: 100,
          pageResults: pageResultsArray,
          issuesSummary: {
            critical: summary.critical || 0,
            error: summary.error || 0,
            warning: summary.warning || 0,
            info: summary.info || 0,
            totalIssues: (summary.critical || 0) + (summary.error || 0) + 
                         (summary.warning || 0) + (summary.info || 0),
            crawlMetrics: {
              totalPages: metrics.totalPages,
              crawlTime: metrics.elapsedTime,
              pagesPerSecond: Math.round(metrics.pagesPerSecond * 100) / 100,
            }
          },
          htmlReport: `audit-${options.auditId}-report.html`,
        }
      });

      // Record audit history for tracking changes over time
      await prisma.auditHistory.create({
        data: {
          projectId: options.projectId,
          auditId: options.auditId,
          totalPages,
          issuesSummary: {
            critical: summary.critical || 0,
            error: summary.error || 0,
            warning: summary.warning || 0,
            info: summary.info || 0,
            totalIssues: (summary.critical || 0) + (summary.error || 0) + 
                         (summary.warning || 0) + (summary.info || 0),
          }
        }
      });

    } catch (error) {
      log.error("Crawl error:", error);
      
      // Update audit with failed status
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: {
          status: AuditStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error during crawl',
        }
      });

      throw error;
    }
  }

  /**
   * Generate an HTML report for an audit
   * @param auditId ID of the audit to generate a report for
   */
  public async generateReport(auditId: string): Promise<string> {
    try {
      // Get the audit data
      const audit = await prisma.siteAudit.findUnique({
        where: { id: auditId },
        include: {
          project: true,
        },
      });

      if (!audit) {
        throw new Error('Audit not found');
      }

      // Generate a basic HTML report
      const reportHtml = this.createHtmlReport(audit);
      
      // Save the report
      const reportPath = `audit-${auditId}-report.html`;
      
      // In a production environment, you'd save this to a file or storage service
      // For now, we'll just return the HTML string
      
      return reportHtml;
    } catch (error) {
      log.error(`Error generating report for audit ${auditId}:`, error);
      throw error;
    }
  }

  /**
   * Create an HTML report from audit data
   * @param audit The audit data to generate a report from
   * @returns HTML string of the report
   */
  private createHtmlReport(audit: any): string {
    const issuesSummary = audit.issuesSummary || {};
    const pageResults = audit.pageResults || [];
    
    // Create a simple HTML report
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SEO Audit Report - ${audit.project?.name || 'Website'}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
          header { text-align: center; margin-bottom: 40px; }
          h1, h2, h3 { color: #2c3e50; }
          .summary-box { background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .issue-count { display: flex; justify-content: space-between; flex-wrap: wrap; }
          .issue-badge { padding: 10px; border-radius: 4px; margin: 5px; flex: 1; min-width: 100px; text-align: center; }
          .critical { background-color: #ff5252; color: white; }
          .error { background-color: #ff9800; color: white; }
          .warning { background-color: #ffeb3b; color: #333; }
          .info { background-color: #2196f3; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          tr:hover { background-color: #f5f5f5; }
          .page-url { word-break: break-all; }
          .issue-pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
          footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <header>
          <h1>SEO Audit Report</h1>
          <p>${audit.project?.name || 'Website'} - ${audit.siteUrl}</p>
          <p>Generated on ${new Date(audit.completedAt || audit.startedAt).toLocaleString()}</p>
        </header>
        
        <section class="summary-box">
          <h2>Audit Summary</h2>
          <p><strong>Total Pages Crawled:</strong> ${audit.totalPages}</p>
          <p><strong>Audit Status:</strong> ${audit.status}</p>
          
          <div class="issue-count">
            <div class="issue-badge critical">
              <strong>${issuesSummary.critical || 0}</strong><br>Critical Issues
            </div>
            <div class="issue-badge error">
              <strong>${issuesSummary.error || 0}</strong><br>Errors
            </div>
            <div class="issue-badge warning">
              <strong>${issuesSummary.warning || 0}</strong><br>Warnings
            </div>
            <div class="issue-badge info">
              <strong>${issuesSummary.info || 0}</strong><br>Info
            </div>
          </div>
        </section>
        
        <section>
          <h2>Page Issues</h2>
          <table>
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Title</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              ${pageResults.map((page: any) => `
                <tr>
                  <td class="page-url">${page.url}</td>
                  <td>${page.title || 'No Title'}</td>
                  <td>${this.renderIssues(page.issues || [])}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
        
        <footer>
          <p>Generated by SEO SaaS Platform</p>
        </footer>
      </body>
      </html>
    `;
  }

  /**
   * Render issue badges for the HTML report
   * @param issues Array of issues to render
   * @returns HTML string of issue badges
   */
  private renderIssues(issues: any[]): string {
    if (!issues || issues.length === 0) {
      return '<span class="issue-pill" style="background-color: #4caf50; color: white;">No Issues</span>';
    }
    
    return issues.map(issue => {
      let color = '';
      switch (issue.severity) {
        case 'critical':
          color = '#ff5252';
          break;
        case 'error':
          color = '#ff9800';
          break;
        case 'warning':
          color = '#ffeb3b';
          break;
        case 'info':
          color = '#2196f3';
          break;
        default:
          color = '#7f8c8d';
      }
      
      return `<span class="issue-pill" style="background-color: ${color}; color: ${['warning'].includes(issue.severity) ? '#333' : 'white'};">${issue.type}</span>`;
    }).join(' ');
  }
}