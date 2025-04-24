import { PlaywrightCrawler, PlaywrightCrawlingContext, log, ProxyConfiguration } from 'crawlee';
import { getSitemapUrls, discoverSitemapsForDomain } from './sitemap-parser';
import { AuditIssue, AuditOptions, PageAuditResult, UrlPattern } from '../../types/audit-types';
import * as cheerio from 'cheerio';

/**
 * Creates and configures a web crawler for site auditing with advanced SEO analysis
 */
export class SiteCrawler {
  private baseUrl: string;
  private options: AuditOptions;
  private results: Map<string, PageAuditResult> = new Map();
  private visitedUrls: Set<string> = new Set();
  private totalPages: number = 0;
  private onProgress?: (crawledPages: number, totalPages: number) => Promise<void>;
  private startTime: number = Date.now();

  constructor(options: AuditOptions) {
    this.options = options;
    
    // Normalize the base URL
    try {
      const url = new URL(options.siteUrl);
      this.baseUrl = `${url.protocol}//${url.hostname}`;
    } catch (error) {
      log.error(`Invalid URL provided: ${options.siteUrl}`);
      this.baseUrl = options.siteUrl;
    }
  }

  /**
   * Starts the crawling process
   * @param onProgress Callback function to track crawling progress
   */
  public async crawl(onProgress?: (crawledPages: number, totalPages: number) => Promise<void>): Promise<void> {
    this.onProgress = onProgress;
    this.startTime = Date.now();
    const crawler = this.createCrawler();
    const startUrls = await this.getStartUrls();

    // Log the start of the crawl
    log.info(`Starting crawl of ${this.baseUrl} with ${startUrls.length} initial URLs`);
    
    // Set initial total pages based on start URLs (can be adjusted during crawl)
    this.totalPages = Math.min(startUrls.length, this.options.maxPages || 100);

    try {
      await crawler.run(startUrls.map(url => ({
        url,
        userData: {
          depth: 0, // Start at depth 0
        }
      })));
      
      log.info(`Crawl completed successfully. Crawled ${this.visitedUrls.size} pages in ${this.getElapsedTime()}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Crawl failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get the results of the crawl
   */
  public async getResults(): Promise<{ results: PageAuditResult[]; totalPages: number }> {
    return {
      results: Array.from(this.results.values()),
      totalPages: this.visitedUrls.size,
    };
  }

  /**
   * Get a summary of all issues found
   */
  public getIssueSummary() {
    const summary = {
      critical: 0,
      error_severity: 0,
      warning: 0,
      info: 0,
    };

    for (const result of this.results.values()) {
      if (!result.issues) continue;

      for (const issue of result.issues) {
        if (issue.severity === 'critical' || 
            issue.severity === 'error_severity' || 
            issue.severity === 'warning' || 
            issue.severity === 'info') {
          summary[issue.severity]++;
        }
      }
    }

    return summary;
  }

  /**
   * Get crawl performance metrics
   */
  public getCrawlMetrics() {
    return {
      totalPages: this.visitedUrls.size,
      elapsedTime: this.getElapsedTime(),
      pagesPerSecond: this.visitedUrls.size / ((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Creates a new PlaywrightCrawler instance configured for SEO auditing
   */
  private createCrawler() {
    const maxPages = this.options.maxPages || 100;
    const maxDepth = this.options.maxDepth || 3;
    const siteCrawler = this; // Store a reference to access from within callbacks

    return new PlaywrightCrawler({
      // Limit the number of requests
      maxRequestsPerCrawl: maxPages,
      
      // Optimize concurrency based on complexity of site
      maxConcurrency: 5,
      minConcurrency: 2,
      
      // Improve performance with proper timeouts
      requestHandlerTimeoutSecs: 90,
      navigationTimeoutSecs: 60,
      
      // Fine-tune autoscaling behavior for better performance
      autoscaledPoolOptions: {
        desiredConcurrency: 5,
        desiredConcurrencyRatio: 0.9,
        scaleUpStepRatio: 0.05,
        scaleDownStepRatio: 0.05,
        maybeRunIntervalSecs: 1,
        loggingIntervalSecs: 60,
        autoscaleIntervalSecs: 10,
        maxTasksPerMinute: 60, // Rate limit to be respectful
      },
      
      // Configure browser options
      launchContext: {
        launchOptions: {
          headless: true,
          args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
        }
      },
      
      // Optimize resource usage by skipping unnecessary resource types
      preNavigationHooks: [
        async ({ page }) => {
          // Skip loading images, fonts, and other resources to speed up crawling
          // Only skip resources if useJavascript is false or undefined
          if (!siteCrawler.options.useJavascript) {
            await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());
          }
        },
      ],
      
      // Main handler for processing pages
      async requestHandler({ request, page, enqueueLinks }: PlaywrightCrawlingContext) {
        const url = request.url;
        const pageTitle = await page.title();

        log.info(`Crawling: ${url} (${siteCrawler.visitedUrls.size + 1}/${maxPages})`);

        // Skip if we've already visited this URL
        if (siteCrawler.visitedUrls.has(url)) {
          log.debug(`Skipping already visited URL: ${url}`);
          return;
        }

        siteCrawler.visitedUrls.add(url);
        
        try {
          // Perform page analysis
          const startTime = Date.now();

          // Get HTML for both browser and Cheerio analysis
          const html = await page.content();
          const $ = cheerio.load(html);
          
          // Get page metadata
          const metaDescription = $('meta[name="description"]').attr('content') || '';
          const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
          const metaRobots = $('meta[name="robots"]').attr('content') || null;
          
          // Check for mobile friendliness
          const viewport = $('meta[name="viewport"]').attr('content') || null;
          const isMobileFriendly = viewport && viewport.includes('width=device-width') ? true : false;

          // Get response status
          const status = request.loadedUrl ? 200 : 0; // Fallback if response not available

          // Get load time
          const loadTime = Date.now() - startTime;

          // Check page speed metrics
          const pageSizeKB = Math.round(html.length / 1024);

          // Extract headings
          const h1Elements = $('h1').map((_, el) => $(el).text().trim()).get();
          const h2Elements = $('h2').map((_, el) => $(el).text().trim()).get();
          const h3Elements = $('h3').map((_, el) => $(el).text().trim()).get();
          
          // Check heading structure
          const hasProperHeadingStructure = siteCrawler.checkHeadingStructure($);

          // Get links
          const links = $('a[href]');
          const internalLinks: string[] = [];
          const externalLinks: string[] = [];
          const brokenLinks: string[] = [];
          
          links.each((_, link) => {
            try {
              const href = $(link).attr('href') || '';
              if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
              
              const url = new URL(href, siteCrawler.baseUrl);
              if (url.hostname === new URL(siteCrawler.baseUrl).hostname) {
                internalLinks.push(url.href);
              } else {
                externalLinks.push(url.href);
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          });

          // Get images and check for alt text
          const images = $('img').map((_, img) => ({
            src: $(img).attr('src') || '',
            alt: $(img).attr('alt') || '',
            hasAlt: !!$(img).attr('alt'),
          })).get().filter(img => img.src);
          
          // Check structured data
          const structuredData = $('script[type="application/ld+json"]').map((_, script) => {
            try {
              return JSON.parse($(script).html() || '{}');
            } catch (e) {
              return null;
            }
          }).get().filter(Boolean);
          
          // Analyze page performance - only if specified in options
          const performanceIssues = siteCrawler.options.checkPerformance 
            ? await siteCrawler.analyzePagePerformance(page) 
            : [];

          // Check broken links if specified in options
          let brokenLinksIssues: AuditIssue[] = [];
          if (siteCrawler.options.checkBrokenLinks) {
            brokenLinksIssues = await siteCrawler.checkBrokenLinks(page, internalLinks);
          }

          // Identify all SEO issues
          const issues: AuditIssue[] = [
            ...await siteCrawler.analyzePageIssues(page, {
              url,
              title: pageTitle,
              description: metaDescription,
              h1: h1Elements,
            }),
            ...performanceIssues,
            ...brokenLinksIssues
          ];

          // Create comprehensive page result
          const pageResult: PageAuditResult = {
            url,
            title: pageTitle,
            description: metaDescription,
            status,
            loadTime,
            contentLength: html.length,
            pageSizeKB,
            h1: h1Elements,
            h2: h2Elements,
            h3: h3Elements,
            internalLinks,
            externalLinks,
            images,
            canonicalUrl: canonicalUrl || undefined,
            metaRobots: metaRobots || undefined,
            hasStructuredData: structuredData.length > 0,
            isMobileFriendly,
            hasProperHeadingStructure,
            issues,
          };

          siteCrawler.results.set(url, pageResult);
          siteCrawler.totalPages = Math.max(siteCrawler.totalPages, siteCrawler.results.size);

          // Report progress if callback is provided
          if (siteCrawler.onProgress) {
            await siteCrawler.onProgress(siteCrawler.visitedUrls.size, siteCrawler.totalPages);
          }

          // Only enqueue links if we're not at max depth and not in single URL mode
          if (!siteCrawler.options.crawlSingleUrl && request.userData?.depth < maxDepth) {
            await enqueueLinks({
              globs: siteCrawler.transformFollowPatterns(siteCrawler.options.followPatterns || []),
              exclude: siteCrawler.transformIgnorePatterns(siteCrawler.options.ignorePatterns || []),
              transformRequestFunction: (req) => {
                // Skip non-HTML resources
                if (req.url.match(/\.(jpg|jpeg|png|gif|webp|css|js|woff|pdf|zip)$/i)) {
                  return false;
                }
                
                // Custom URL processing logic
                if (siteCrawler.shouldSkipUrl(req.url)) {
                  return false;
                }
                
                // Add depth to userData
                if (!req.userData) req.userData = {};
                req.userData.depth = (request.userData?.depth || 0) + 1;
                return req;
              }
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error(`Error processing ${url}: ${errorMessage}`);
          siteCrawler.results.set(url, {
            url,
            title: pageTitle || '',
            description: '',
            status: 0,
            loadTime: 0,
            contentLength: 0,
            h1: [],
            h2: [],
            h3: [],
            internalLinks: [],
            externalLinks: [],
            images: [],
            issues: [{
              type: 'processing_error',
              severity: 'error_severity',
              description: `Failed to process page: ${errorMessage}`,
              recommendation: 'Check the page manually to identify issues',
            }]
          });
        }
      }
    });
  }

  /**
   * Check for broken links on the page
   */
  private async checkBrokenLinks(page: any, links: string[]): Promise<AuditIssue[]> {
    // This is a simplified implementation
    // In a real implementation, you would check each link by sending a request
    if (!this.options.checkBrokenLinks || links.length === 0) {
      return [];
    }

    const issues: AuditIssue[] = [];
    
    // For demonstration purposes, we'll just assume no broken links
    // A real implementation would check each link
    
    return issues;
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
        severity: 'error_severity',
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

    // Check for duplicate titles
    if (this.hasDuplicateTitle(pageData.title)) {
      issues.push({
        type: 'duplicate_title',
        severity: 'error_severity',
        description: 'This page has the same title as other pages on the site.',
        recommendation: 'Create unique titles for each page on the site.',
      });
    }

    // Check meta description
    if (!pageData.description) {
      issues.push({
        type: 'missing_meta_description',
        severity: 'error_severity',
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
        severity: 'error_severity',
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

    // Check for canonical tag
    const canonicalUrl = await page.evaluate(() => {
      const link = document.querySelector('link[rel="canonical"]');
      return link ? link.getAttribute('href') : null;
    });

    if (!canonicalUrl) {
      issues.push({
        type: 'missing_canonical',
        severity: 'warning',
        description: 'Page is missing a canonical tag.',
        recommendation: 'Add a canonical tag to prevent duplicate content issues.',
      });
    }

    // Check for noindex tag
    const hasNoindex = await page.evaluate(() => {
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (!metaRobots) return false;
      const content = metaRobots.getAttribute('content');
      return content ? content.includes('noindex') : false;
    });

    if (hasNoindex) {
      issues.push({
        type: 'has_noindex',
        severity: 'warning',
        description: 'Page has a noindex directive.',
        recommendation: 'Confirm this page should be excluded from search engines.',
      });
    }

    // Check for structured data
    const hasStructuredData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return scripts.length > 0;
    });

    if (!hasStructuredData) {
      issues.push({
        type: 'missing_structured_data',
        severity: 'info',
        description: 'Page does not contain structured data markup.',
        recommendation: 'Add relevant structured data to enhance search result appearance.',
      });
    }

    // Check for broken links - placeholder implementation
    // Note: Full implementation would require checking each link
    const brokenLinks = await page.evaluate(() => {
      // This is simplified - in reality we'd need to check each link
      return 0; // Placeholder for actual implementation
    });

    if (brokenLinks > 0) {
      issues.push({
        type: 'broken_links',
        severity: 'error_severity',
        description: `Found ${brokenLinks} broken links.`,
        recommendation: 'Fix or remove broken links to improve user experience and SEO.',
      });
    }

    // Check for mobile friendliness
    const hasMobileViewport = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport && viewport.getAttribute('content')?.includes('width=device-width');
    });

    if (!hasMobileViewport) {
      issues.push({
        type: 'not_mobile_friendly',
        severity: 'error_severity',
        description: 'Page is not mobile-friendly (missing proper viewport meta tag).',
        recommendation: 'Add a proper viewport meta tag for mobile devices.',
      });
    }

    return issues;
  }

  /**
   * Analyze page performance metrics
   */
  private async analyzePagePerformance(page: any): Promise<AuditIssue[]> {
    const issues: AuditIssue[] = [];
    
    try {
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        // Use performance API if available
        if (!window.performance) return null;
        
        const timing = window.performance.timing;
        if (!timing) return null;
        
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: timing.responseStart - timing.navigationStart,
        };
      });
      
      if (performanceMetrics && performanceMetrics.loadTime > 3000) {
        issues.push({
          type: 'slow_page_load',
          severity: 'warning',
          description: `Page load time is slow (${Math.round(performanceMetrics.loadTime / 1000)}s).`,
          recommendation: 'Optimize page speed by reducing resource size, enabling compression, and leveraging browser caching.',
        });
      }
      
      // Check for render-blocking resources
      const renderBlockingResources = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script:not([async]):not([defer])');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        return {
          scripts: scripts.length,
          stylesheets: stylesheets.length,
        };
      });
      
      if (renderBlockingResources.scripts > 5 || renderBlockingResources.stylesheets > 3) {
        issues.push({
          type: 'render_blocking_resources',
          severity: 'warning',
          description: `Page has too many render-blocking resources (${renderBlockingResources.scripts} scripts, ${renderBlockingResources.stylesheets} stylesheets).`,
          recommendation: 'Use async/defer for scripts and optimize CSS delivery.',
        });
      }
    } catch (error) {
      console.error('Error analyzing page performance:', error);
    }
    
    return issues;
  }

  /**
   * Check if the page has proper heading structure (H1 → H2 → H3)
   */
  private checkHeadingStructure($: cheerio.CheerioAPI): boolean {
    const h1Count = $('h1').length;
    
    // Must have exactly one H1
    if (h1Count !== 1) return false;
    
    // Check if H3 is used without H2
    const hasH3WithoutH2 = $('h3').length > 0 && $('h2').length === 0;
    if (hasH3WithoutH2) return false;
    
    return true;
  }

  /**
   * Check if title is duplicated across pages
   */
  private hasDuplicateTitle(title: string): boolean {
    if (!title) return false;
    
    // Count occurrences of this title
    let count = 0;
    for (const result of this.results.values()) {
      if (result.title === title) count++;
    }
    
    return count > 1;
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
        '**/cart/**',
        '**/checkout/**',
        '**/my-account/**',
        '**/wp-json/**',
      ];
    }

    const defaultPatterns = [
      '**/*.{png,jpg,jpeg,gif,webp,svg,ico}',
      '**/*.{css,js,json,xml}',
    ];

    return [...defaultPatterns, ...patterns.map(p => p.pattern)];
  }

  /**
   * Check if a URL should be skipped based on custom rules
   */
  private shouldSkipUrl(url: string): boolean {
    // Skip URLs with query parameters (often duplicate content)
    if (url.includes('?') && !this.isAllowedQueryParam(url)) {
      return true;
    }
    
    // Skip URLs with hash fragments
    if (url.includes('#')) {
      return true;
    }
    
    // Skip login, admin, and other non-public pages
    const lowerUrl = url.toLowerCase();
    const skipPatterns = [
      '/admin', '/login', '/logout', '/cart', '/checkout', 
      '/my-account', '/wp-admin', '/wp-json', '/feed', 
      '/rss', '/xmlrpc.php', '/cdn-cgi/'
    ];
    
    return skipPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  /**
   * Check if a URL with query parameters is allowed
   */
  private isAllowedQueryParam(url: string): boolean {
    const allowedParams = ['page', 'id', 'category', 'product'];
    
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.keys());
      
      // Allow if all params are in the allowed list
      return params.every(param => allowedParams.includes(param));
    } catch (e) {
      return false;
    }
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
        // Try multiple sitemap discovery methods
        let sitemapUrls: string[] = [];
        
        // First try the standard sitemap.xml
        sitemapUrls = await getSitemapUrls(`${this.baseUrl}/sitemap.xml`);
        
        // If no URLs found, try to discover sitemaps
        if (sitemapUrls.length === 0) {
          sitemapUrls = await discoverSitemapsForDomain(this.baseUrl);
        }
        
        // Add discovered URLs to our start list
        if (sitemapUrls.length > 0) {
          log.info(`Found ${sitemapUrls.length} URLs in sitemap`);
          startUrls.push(...sitemapUrls);
        } else {
          log.warning('No URLs found in sitemap');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Error fetching sitemap: ${errorMessage}`);
      }
    }

    // Include robots.txt parsing if enabled
    if (this.options.includeRobots) {
      try {
        const robotsUrls = await this.parseRobotsTxt(`${this.baseUrl}/robots.txt`);
        if (robotsUrls.length > 0) {
          log.info(`Found ${robotsUrls.length} URLs in robots.txt`);
          startUrls.push(...robotsUrls);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.warning(`Error parsing robots.txt: ${errorMessage}`);
      }
    }

    // Deduplicate URLs and limit to max pages
    const uniqueUrls = Array.from(new Set(startUrls));
    return uniqueUrls.slice(0, this.options.maxPages || 100);
  }

  /**
   * Parse robots.txt to find sitemaps and potentially other useful URLs
   */
  private async parseRobotsTxt(robotsUrl: string): Promise<string[]> {
    try {
      const response = await fetch(robotsUrl);
      if (!response.ok) return [];
      
      const text = await response.text();
      const sitemapUrls: string[] = [];
      
      // Extract sitemap URLs from robots.txt
      const sitemapMatches = text.match(/Sitemap:\s*(.*?)(\s|$)/ig);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const url = match.split(/:\s+/)[1]?.trim();
          if (url) {
            try {
              // Try to get URLs from this sitemap
              const urls = await getSitemapUrls(url);
              sitemapUrls.push(...urls);
            } catch (e) {
              // If this fails, at least include the sitemap URL itself
              sitemapUrls.push(url);
            }
          }
        }
      }
      
      return sitemapUrls;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.warning(`Error parsing robots.txt: ${errorMessage}`);
      return [];
    }
  }
  
  /**
   * Get elapsed crawl time in human-readable format
   */
  private getElapsedTime(): string {
    const elapsedMs = Date.now() - this.startTime;
    const seconds = Math.floor(elapsedMs / 1000) % 60;
    const minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    
    return hours > 0 
      ? `${hours}h ${minutes}m ${seconds}s` 
      : minutes > 0 
        ? `${minutes}m ${seconds}s` 
        : `${seconds}s`;
  }
}