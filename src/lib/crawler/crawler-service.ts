import { PlaywrightCrawler, CheerioCrawler, Dataset, KeyValueStore, RequestList, log, LogLevel } from 'crawlee';
import { UrlPattern } from '@/types/audit-types';
import { prisma } from '@/lib/db/prisma-client';
import { AuditStatus } from '@prisma/client';

// Configure crawler logging
log.setLevel(LogLevel.DEBUG);

interface CrawlerOptions {
  auditId: string;
  projectId: string; 
  siteUrl: string;
  maxPages: number;
  maxDepth: number;
  includeSitemap: boolean;
  includeRobots: boolean;
  crawlSingleUrl?: boolean;
  followPatterns?: UrlPattern[];
  ignorePatterns?: UrlPattern[];
  userAgent?: string;
  useJavascript: boolean; // Choose between CheerioCrawler and PlaywrightCrawler
}

interface PageStats {
  url: string;
  title: string;
  h1: string | null;
  metaDescription: string | null;
  statusCode: number;
  contentType: string | null;
  loadTime: number;
  wordCount: number;
  links: {
    internal: number;
    external: number;
    broken: number;
  };
  images: {
    total: number;
    missing_alt: number;
    large_images: number;
  };
  issues: {
    critical: any[];
    error: any[];
    warning: any[];
    info: any[];
  };
}

export class CrawlerService {
  /**
   * Start a web crawl using either CheerioCrawler or PlaywrightCrawler
   */
  public async startCrawl(options: CrawlerOptions): Promise<void> {
    try {
      // Update audit status to IN_PROGRESS
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: { status: AuditStatus.IN_PROGRESS }
      });

      // Create a request list from the provided site URL
      const startUrls = [options.siteUrl];

      // If crawling a single URL, don't follow links
      const pseudoUrls = options.crawlSingleUrl ? [] : [/.*/];

      // Prepare request list
      const requestList = await RequestList.open('start-urls', startUrls);

      // Initialize dataset to store results
      const datasetName = `audit-${options.auditId}`;
      const dataset = await Dataset.open(datasetName);

      // Track issues summary
      const issuesSummary = {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0
      };

      // Common request handler functionality
      const processPage = async (url: string, title: string, content: string, loadTime: number, extractMetadata: Function) => {
        // Extract page metadata (different for Cheerio vs Playwright)
        const metadata = await extractMetadata();

        // Calculate word count from content
        const wordCount = content.split(/\\s+/).filter(w => w.length > 0).length;

        // Initialize page stats
        const pageStats: PageStats = {
          url,
          title: title || '',
          h1: metadata.h1 || null,
          metaDescription: metadata.metaDescription || null,
          statusCode: metadata.statusCode || 200,
          contentType: metadata.contentType || null,
          loadTime,
          wordCount,
          links: {
            internal: metadata.internalLinks || 0,
            external: metadata.externalLinks || 0,
            broken: 0, // Will be updated later when checking links
          },
          images: {
            total: metadata.images?.length || 0,
            missing_alt: metadata.images?.filter(img => !img.alt).length || 0,
            large_images: metadata.images?.filter(img => img.size && img.size > 100000).length || 0,
          },
          issues: {
            critical: [],
            error: [],
            warning: [],
            info: [],
          }
        };

        // Perform SEO checks and identify issues
        this.runSeoChecks(pageStats, metadata);

        // Update issues summary
        issuesSummary.critical += pageStats.issues.critical.length;
        issuesSummary.error += pageStats.issues.error.length;
        issuesSummary.warning += pageStats.issues.warning.length;
        issuesSummary.info += pageStats.issues.info.length;

        // Save the page results to the dataset
        await dataset.pushData(pageStats);

        // Log progress
        log.info(`Processed ${url} - Found ${pageStats.issues.critical.length} critical, ${pageStats.issues.error.length} errors`);
      };

      // Choose and configure crawler based on useJavascript option
      if (options.useJavascript) {
        // Use PlaywrightCrawler for JavaScript-heavy sites
        const crawler = new PlaywrightCrawler({
          requestList,
          maxRequestsPerCrawl: options.maxPages,
          maxRequestRetries: 1,
          requestHandler: async ({ request, page, enqueueLinks, log }) => {
            const url = request.loadedUrl || request.url;
            log.info(`Processing ${url}...`);
            
            // Record start time 
            const startTime = Date.now();
            
            // Get page title
            const title = await page.title();
            
            // Get page content
            const content = await page.content();
            
            // Calculate load time
            const loadTime = Date.now() - startTime;

            // Extract metadata function for Playwright
            const extractMetadata = async () => {
              const metadata = await page.evaluate(() => {
                // Get meta description
                const metaDescEl = document.querySelector('meta[name="description"]');
                const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') : null;
                
                // Get H1
                const h1El = document.querySelector('h1');
                const h1 = h1El ? h1El.textContent : null;
                
                // Get all links
                const links = Array.from(document.querySelectorAll('a[href]'));
                const baseUrl = window.location.origin;
                const internalLinks = links.filter(link => {
                  const href = link.getAttribute('href') || '';
                  return !href.startsWith('http') || href.startsWith(baseUrl);
                }).length;
                const externalLinks = links.length - internalLinks;
                
                // Get all images
                const images = Array.from(document.querySelectorAll('img')).map(img => {
                  return {
                    src: img.getAttribute('src'),
                    alt: img.getAttribute('alt'),
                    size: 0, // Can't get image size from DOM
                  };
                });
                
                return {
                  metaDescription,
                  h1,
                  internalLinks,
                  externalLinks,
                  images,
                  statusCode: 200, // Playwright successfully loaded the page
                  contentType: document.contentType,
                };
              });
              
              return metadata;
            };

            await processPage(url, title, content, loadTime, extractMetadata);
            
            // Don't enqueue links if crawling a single URL or reached max depth
            if (!options.crawlSingleUrl) {
              // Calculate current depth based on URL segments
              const urlObj = new URL(url);
              const currentDepth = urlObj.pathname.split('/').filter(Boolean).length;
              
              if (currentDepth < options.maxDepth) {
                // Enqueue discovered links, respecting patterns
                await enqueueLinks({
                  pseudoUrls,
                  transformRequestFunction: (req) => {
                    // Apply follow/ignore patterns
                    const requestUrl = req.url;
                    
                    // Check ignore patterns first
                    if (options.ignorePatterns && options.ignorePatterns.length > 0) {
                      for (const pattern of options.ignorePatterns) {
                        if (new RegExp(pattern.pattern).test(requestUrl)) {
                          return false; // Skip this URL
                        }
                      }
                    }
                    
                    // If follow patterns exist, URL must match at least one
                    if (options.followPatterns && options.followPatterns.length > 0) {
                      let matchesAny = false;
                      for (const pattern of options.followPatterns) {
                        if (new RegExp(pattern.pattern).test(requestUrl)) {
                          matchesAny = true;
                          break;
                        }
                      }
                      if (!matchesAny) return false;
                    }
                    
                    return req;
                  }
                });
              }
            }
          },
          // Use headless mode in production
          headless: process.env.NODE_ENV === "production",
          // Configure user agent if provided
          userAgent: options.userAgent || 'SEOMaster Audit Bot 1.0',
        });

        // Start the crawler
        await crawler.run();
      } else {
        // Use CheerioCrawler for static sites (faster)
        const crawler = new CheerioCrawler({
          requestList,
          maxRequestsPerCrawl: options.maxPages,
          maxRequestRetries: 1,
          requestHandler: async ({ request, $ , enqueueLinks, log }) => {
            const url = request.loadedUrl || request.url;
            log.info(`Processing ${url}...`);
            
            // Record timing
            const startTime = Date.now();
            
            // Get the title
            const title = $('title').text().trim();
            
            // Get page content
            const content = $('body').text();
            
            // Calculate load time
            const loadTime = Date.now() - startTime;

            // Extract metadata function for Cheerio
            const extractMetadata = async () => {
              // Get meta description
              const metaDescription = $('meta[name="description"]').attr('content') || null;
              
              // Get H1
              const h1 = $('h1').first().text().trim() || null;
              
              // Get all links
              const allLinks = $('a[href]');
              const internalLinks = allLinks.filter((_, el) => {
                const href = $(el).attr('href') || '';
                return !href.startsWith('http') || href.startsWith(options.siteUrl);
              }).length;
              const externalLinks = allLinks.length - internalLinks;
              
              // Get all images
              const images = $('img').map((_, el) => {
                return {
                  src: $(el).attr('src'),
                  alt: $(el).attr('alt'),
                  size: 0, // Can't get image size from HTML
                };
              }).get();
              
              return {
                metaDescription,
                h1,
                internalLinks,
                externalLinks,
                images,
                statusCode: request.statusCode || 200,
                contentType: request.headersList?.['content-type'] || null,
              };
            };

            await processPage(url, title, content, loadTime, extractMetadata);
            
            // Don't enqueue links if crawling a single URL or reached max depth
            if (!options.crawlSingleUrl) {
              // Calculate current depth based on URL segments
              const urlObj = new URL(url);
              const currentDepth = urlObj.pathname.split('/').filter(Boolean).length;
              
              if (currentDepth < options.maxDepth) {
                // Enqueue discovered links, respecting patterns
                await enqueueLinks({
                  pseudoUrls,
                  transformRequestFunction: (req) => {
                    // Apply follow/ignore patterns
                    const requestUrl = req.url;
                    
                    // Check ignore patterns first
                    if (options.ignorePatterns && options.ignorePatterns.length > 0) {
                      for (const pattern of options.ignorePatterns) {
                        if (new RegExp(pattern.pattern).test(requestUrl)) {
                          return false; // Skip this URL
                        }
                      }
                    }
                    
                    // If follow patterns exist, URL must match at least one
                    if (options.followPatterns && options.followPatterns.length > 0) {
                      let matchesAny = false;
                      for (const pattern of options.followPatterns) {
                        if (new RegExp(pattern.pattern).test(requestUrl)) {
                          matchesAny = true;
                          break;
                        }
                      }
                      if (!matchesAny) return false;
                    }
                    
                    return req;
                  }
                });
              }
            }
          },
          // Configure user agent if provided
          userAgent: options.userAgent || 'SEOMaster Audit Bot 1.0',
        });
        
        // Start the crawler
        await crawler.run();
      }

      // After crawl is complete, save results to the database
      const datasetContent = await dataset.getItems();
      
      // Generate summary report
      const summary = {
        pageCount: datasetContent.length,
        issuesSummary,
        completedAt: new Date(),
      };

      // Create HTML report (just a basic version here, you'd typically use a template)
      const htmlReport = this.generateHtmlReport(datasetContent, summary);

      // Save the most important data to store in the database
      // Store full results in KeyValueStore for larger datasets
      const store = await KeyValueStore.open(`audit-${options.auditId}-store`);
      await store.setValue('fullResults', datasetContent);
      
      // Update the audit with completed status and results
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: {
          status: AuditStatus.COMPLETED,
          completedAt: summary.completedAt,
          totalPages: summary.pageCount,
          issuesSummary: summary.issuesSummary,
          pageResults: { summary: summary }, // Store only summary in database
          htmlReport: `audit-${options.auditId}-report.html`,
        }
      });

      // Record audit history
      await prisma.auditHistory.create({
        data: {
          projectId: options.projectId,
          auditId: options.auditId,
          totalPages: summary.pageCount,
          issuesSummary: summary.issuesSummary,
        }
      });

    } catch (error) {
      console.error("Crawl error:", error);
      
      // Update audit with failed status
      await prisma.siteAudit.update({
        where: { id: options.auditId },
        data: {
          status: AuditStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error during crawl',
        }
      });
    }
  }

  /**
   * Perform SEO checks on the page and identify issues
   */
  private runSeoChecks(pageStats: PageStats, metadata: any): void {
    const { title, metaDescription, h1 } = pageStats;

    // Check title
    if (!title) {
      pageStats.issues.critical.push({
        code: 'MISSING_TITLE',
        message: 'Page is missing a title tag',
      });
    } else if (title.length < 10) {
      pageStats.issues.warning.push({
        code: 'TITLE_TOO_SHORT',
        message: 'Page title is too short (less than 10 characters)',
        value: title,
      });
    } else if (title.length > 60) {
      pageStats.issues.warning.push({
        code: 'TITLE_TOO_LONG',
        message: 'Page title is too long (more than 60 characters)',
        value: title,
      });
    }

    // Check meta description
    if (!metaDescription) {
      pageStats.issues.error.push({
        code: 'MISSING_META_DESCRIPTION',
        message: 'Page is missing a meta description',
      });
    } else if (metaDescription.length < 50) {
      pageStats.issues.warning.push({
        code: 'META_DESCRIPTION_TOO_SHORT',
        message: 'Meta description is too short (less than 50 characters)',
        value: metaDescription,
      });
    } else if (metaDescription.length > 160) {
      pageStats.issues.warning.push({
        code: 'META_DESCRIPTION_TOO_LONG',
        message: 'Meta description is too long (more than 160 characters)',
        value: metaDescription,
      });
    }

    // Check H1
    if (!h1) {
      pageStats.issues.error.push({
        code: 'MISSING_H1',
        message: 'Page is missing an H1 heading',
      });
    } else if (h1.length < 10) {
      pageStats.issues.info.push({
        code: 'H1_TOO_SHORT',
        message: 'H1 heading is too short (less than 10 characters)',
        value: h1,
      });
    }

    // Check for images with missing alt text
    if (pageStats.images.missing_alt > 0) {
      pageStats.issues.error.push({
        code: 'IMAGES_MISSING_ALT',
        message: `${pageStats.images.missing_alt} images are missing alt text`,
        value: pageStats.images.missing_alt,
      });
    }

    // Check word count (content length)
    if (pageStats.wordCount < 300) {
      pageStats.issues.warning.push({
        code: 'LOW_WORD_COUNT',
        message: 'Page has low word count (less than 300 words)',
        value: pageStats.wordCount,
      });
    }

    // More checks can be added here for comprehensive SEO analysis
  }

  /**
   * Generate a basic HTML report from the crawl results
   */
  private generateHtmlReport(results: any[], summary: any): string {
    // In a real implementation, you'd use a templating engine
    // This is just a minimal example
    const htmlReport = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SEO Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          h1 { color: #333; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .issues { margin-bottom: 30px; }
          .issue-critical { color: #d9534f; }
          .issue-error { color: #f0ad4e; }
          .issue-warning { color: #5bc0de; }
          .pages { border-top: 1px solid #ddd; }
          .page { border-bottom: 1px solid #ddd; padding: 10px 0; }
        </style>
      </head>
      <body>
        <h1>SEO Audit Report</h1>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>Pages crawled: ${summary.pageCount}</p>
          <p>Issues found:</p>
          <ul>
            <li class="issue-critical">Critical: ${summary.issuesSummary.critical}</li>
            <li class="issue-error">Errors: ${summary.issuesSummary.error}</li>
            <li class="issue-warning">Warnings: ${summary.issuesSummary.warning}</li>
            <li>Info: ${summary.issuesSummary.info}</li>
          </ul>
          <p>Completed at: ${summary.completedAt.toLocaleString()}</p>
        </div>
        
        <div class="pages">
          <h2>Pages</h2>
          ${results.map(page => `
            <div class="page">
              <h3><a href="${page.url}" target="_blank">${page.title || page.url}</a></h3>
              <p>URL: ${page.url}</p>
              <p>Issues: ${
                page.issues.critical.length + 
                page.issues.error.length + 
                page.issues.warning.length + 
                page.issues.info.length
              }</p>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
    
    return htmlReport;
  }
}