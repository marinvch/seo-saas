import { PlaywrightCrawler, PlaywrightCrawlingContext, log } from 'crawlee';
import { getSitemapUrls } from './sitemap-parser';
import { AuditIssue, AuditOptions, PageAuditResult, UrlPattern } from '@/types/audit-types';

/**
 * Creates and configures a web crawler for site auditing
 */
export class SiteCrawler {
  private baseUrl: string;
  private options: AuditOptions;
  private results: Map<string, PageAuditResult> = new Map();
  private visitedUrls: Set<string> = new Set();
  private totalPages: number = 0;

  constructor(options: AuditOptions) {
    this.options = options;
    this.baseUrl = options.siteUrl;
  }

  /**
   * Creates a new PlaywrightCrawler instance configured for SEO auditing
   */
  private createCrawler() {
    const maxPages = this.options.maxPages || 100;
    const maxDepth = this.options.maxDepth || 3;
    
    return new PlaywrightCrawler({
      maxRequestsPerCrawl: maxPages,
      maxConcurrency: 5,
      requestHandlerTimeoutSecs: 60,
      playwright: {
        launchOptions: {
          headless: true,
        }
      },
      async requestHandler({ request, page, crawler, enqueueLinks }: PlaywrightCrawlingContext) {
        const url = request.url;
        const pageTitle = await page.title();
        
        log.info(`Crawling: ${url} (${this.results.size + 1}/${maxPages})`);
        
        // Skip if we've already visited this URL
        if (this.visitedUrls.has(url)) {
          log.debug(`Skipping already visited URL: ${url}`);
          return;
        }
        
        this.visitedUrls.add(url);
        
        // Perform page analysis
        const startTime = Date.now();
        
        // Get page metadata
        const metaDescription = await page.evaluate(() => {
          const metaDesc = document.querySelector('meta[name="description"]');
          return metaDesc ? metaDesc.getAttribute('content') : '';
        });
        
        // Get canonical URL
        const canonicalUrl = await page.evaluate(() => {
          const link = document.querySelector('link[rel="canonical"]');
          return link ? link.getAttribute('href') : null;
        });
        
        // Check meta robots
        const metaRobots = await page.evaluate(() => {
          const robots = document.querySelector('meta[name="robots"]');
          return robots ? robots.getAttribute('content') : null;
        });
        
        // Get response status
        const response = request.response;
        const status = response?.statusCode || 0;
        
        // Get load time
        const loadTime = Date.now() - startTime;
        
        // Get content length
        const content = await page.content();
        const contentLength = content.length;
        
        // Extract headings
        const h1Elements = await page.evaluate(() => {
          const elements = document.querySelectorAll('h1');
          return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
        });
        
        const h2Elements = await page.evaluate(() => {
          const elements = document.querySelectorAll('h2');
          return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
        });
        
        const h3Elements = await page.evaluate(() => {
          const elements = document.querySelectorAll('h3');
          return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
        });
        
        // Get links
        const { internalLinks, externalLinks } = await page.evaluate((baseUrl) => {
          const base = new URL(baseUrl).hostname;
          const links = document.querySelectorAll('a[href]');
          const internal: string[] = [];
          const external: string[] = [];
          
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            try {
              const url = new URL(href, window.location.href);
              if (url.hostname === base) {
                internal.push(url.href);
              } else {
                external.push(url.href);
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          });
          
          return { 
            internalLinks: internal, 
            externalLinks: external 
          };
        }, this.baseUrl);
        
        // Get images
        const images = await page.evaluate(() => {
          const imgElements = document.querySelectorAll('img');
          return Array.from(imgElements).map(img => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
          })).filter(img => img.src);
        });
        
        // Identify issues
        const issues: AuditIssue[] = await this.analyzePageIssues(page, {
          url,
          title: pageTitle,
          description: metaDescription || '',
          h1: h1Elements as string[],
        });
        
        // Create page result
        const pageResult: PageAuditResult = {
          url,
          title: pageTitle,
          description: metaDescription || '',
          status,
          loadTime,
          contentLength,
          h1: h1Elements as string[],
          h2: h2Elements as string[],
          h3: h3Elements as string[],
          internalLinks,
          externalLinks,
          images,
          canonicalUrl: canonicalUrl || undefined,
          metaRobots: metaRobots || undefined,
          issues,
        };
        
        this.results.set(url, pageResult);
        this.totalPages = this.results.size;
        
        // Only enqueue links if we're not at max depth and not in single URL mode
        if (!this.options.crawlSingleUrl && request.userData.depth < maxDepth) {
          await enqueueLinks({
            globs: this.transformFollowPatterns(this.options.followPatterns || []),
            exclude: this.transformIgnorePatterns(this.options.ignorePatterns || []),
            userData: {
              depth: request.userData.depth + 1
            },
          });
        }
      },
    });
  }

  /**
   * Analyzes a page for common SEO issues
   */
  private async analyzePageIssues(page: any, pageData: { 
    url: string; 
    title: string; 
    description: string;
    h1: string[];
  }): Promise<AuditIssue[]> {
    const issues: AuditIssue[] = [];

    // Check title length
    if (!pageData.title) {
      issues.push({
        type: 'missing_title',
        severity: 'critical',
        description: 'Page is missing a title tag.',
        recommendation: 'Add a descriptive title tag with target keywords.',
      });
    } else if (pageData.title.length < 10) {
      issues.push({
        type: 'title_too_short',
        severity: 'error',
        description: `Page title is too short (${pageData.title.length} characters).`,
        recommendation: 'Expand title to 50-60 characters with target keywords.',
      });
    } else if (pageData.title.length > 70) {
      issues.push({
        type: 'title_too_long',
        severity: 'warning',
        description: `Page title is too long (${pageData.title.length} characters).`,
        recommendation: 'Shorten title to 50-60 characters to prevent truncation in search results.',
      });
    }

    // Check meta description
    if (!pageData.description) {
      issues.push({
        type: 'missing_meta_description',
        severity: 'error',
        description: 'Page is missing a meta description.',
        recommendation: 'Add a descriptive meta description with target keywords.',
      });
    } else if (pageData.description.length < 50) {
      issues.push({
        type: 'meta_description_too_short',
        severity: 'warning',
        description: `Meta description is too short (${pageData.description.length} characters).`,
        recommendation: 'Expand meta description to 150-160 characters with target keywords.',
      });
    } else if (pageData.description.length > 160) {
      issues.push({
        type: 'meta_description_too_long',
        severity: 'warning',
        description: `Meta description is too long (${pageData.description.length} characters).`,
        recommendation: 'Shorten meta description to 150-160 characters to prevent truncation in search results.',
      });
    }

    // Check H1 usage
    if (pageData.h1.length === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'error',
        description: 'Page is missing an H1 heading.',
        recommendation: 'Add a descriptive H1 heading with target keywords.',
      });
    } else if (pageData.h1.length > 1) {
      issues.push({
        type: 'multiple_h1',
        severity: 'warning',
        description: `Page has multiple H1 headings (${pageData.h1.length}).`,
        recommendation: 'Use a single H1 heading that describes the main topic of the page.',
      });
    }

    // Check for images missing alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
      return images.length;
    });

    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'images_missing_alt',
        severity: 'warning',
        description: `Found ${imagesWithoutAlt} images without alt text.`,
        recommendation: 'Add descriptive alt text to all images for better accessibility and SEO.',
      });
    }

    // Check for broken links
    const brokenLinks = await page.evaluate(() => {
      // This is simplified - in reality we'd need to check each link
      return 0; // Placeholder for actual implementation
    });

    if (brokenLinks > 0) {
      issues.push({
        type: 'broken_links',
        severity: 'error',
        description: `Found ${brokenLinks} broken links.`,
        recommendation: 'Fix or remove broken links to improve user experience and SEO.',
      });
    }

    return issues;
  }

  /**
   * Transforms URL patterns to the format expected by Crawlee
   */
  private transformFollowPatterns(patterns: UrlPattern[]): string[] {
    if (!patterns || patterns.length === 0) {
      // Default pattern to follow URLs from the same domain
      const baseUrlObj = new URL(this.baseUrl);
      return [`${baseUrlObj.protocol}//${baseUrlObj.hostname}/**`];
    }
    
    return patterns.map(p => p.pattern);
  }

  /**
   * Transforms ignore patterns to the format expected by Crawlee
   */
  private transformIgnorePatterns(patterns: UrlPattern[]): string[] {
    if (!patterns || patterns.length === 0) {
      return [
        // Default patterns to exclude
        '**/*.{png,jpg,jpeg,gif,webp,svg,ico}',
        '**/*.{css,js,json,xml}',
        '**/*.{pdf,doc,docx,xls,xlsx,ppt,pptx}',
        '**/wp-admin/**',
        '**/wp-login.php',
        '**/feed/**',
      ];
    }
    
    const defaultPatterns = [
      '**/*.{png,jpg,jpeg,gif,webp,svg,ico}',
      '**/*.{css,js,json,xml}',
    ];
    
    return [...defaultPatterns, ...patterns.map(p => p.pattern)];
  }

  /**
   * Gets all start URLs including the base URL and optionally sitemap URLs
   */
  private async getStartUrls(): Promise<string[]> {
    const startUrls: string[] = [this.baseUrl];
    
    // If we're crawling a single URL, just return that URL
    if (this.options.crawlSingleUrl) {
      return startUrls;
    }
    
    // Add sitemap URLs if enabled
    if (this.options.includeSitemap) {
      try {
        const sitemapUrls = await getSitemapUrls(`${this.baseUrl}/sitemap.xml`);
        startUrls.push(...sitemapUrls);
      } catch (error) {
        log.error(`Error fetching sitemap: ${error.message}`);
      }
    }
    
    // Deduplicate URLs
    return Array.from(new Set(startUrls));
  }

  /**
   * Starts the crawling process
   * @returns Results of the crawl
   */
  public async crawl(): Promise<{ results: PageAuditResult[]; totalPages: number }> {
    const crawler = this.createCrawler();
    const startUrls = await this.getStartUrls();
    
    await crawler.run(startUrls.map(url => ({
      url,
      userData: {
        depth: 0, // Start at depth 0
      }
    })));
    
    return {
      results: Array.from(this.results.values()),
      totalPages: this.totalPages,
    };
  }
}