import { PlaywrightCrawler, Dataset, RequestQueue, log, KeyValueStore, Request as CrawleeRequest } from "crawlee";
import { playwrightUtils } from "@crawlee/playwright";
import { Request, Response, Browser, BrowserContext } from "playwright";
import { extractSEOData } from "./extractors/seo-data";
import { extractPerformanceData } from "./extractors/performance-data";
import { extractAccessibilityData } from "./extractors/accessibility-data";
import { SiteAuditConfig, AuditResult, PageAuditData } from "@/types/audit";
import { parseSitemap } from "./parsers/sitemap-parser";
import { parseRobotsTxt } from "./parsers/robots-parser";
import { detectDuplicateContent } from "./analyzers/duplicate-content";

/**
 * SiteAuditor: Advanced web crawler for comprehensive SEO and performance audits
 * 
 * Features:
 * - Recursive crawling with configurable depth
 * - SPA support with smart waiting strategies
 * - Sitemap and robots.txt parsing
 * - Detailed SEO, performance and accessibility analysis
 * - Duplicate content detection
 * - Progress reporting
 * - Crawler politeness with configurable rate limiting
 */
export class SiteAuditor {
  private crawler: PlaywrightCrawler;
  private results: Map<string, PageAuditData> = new Map();
  private config: SiteAuditConfig;
  private startTime: number;
  private requestQueue?: RequestQueue;
  private datasetName: string;
  private totalPagesDiscovered = 0;
  private totalPagesProcessed = 0;
  private allowedUrls: string[] = [];
  private disallowedUrls: string[] = [];
  private progressCallback?: (progress: number, discovered: number, processed: number) => void;
  private duplicateContentMap: Map<string, string[]> = new Map(); // URL to list of duplicate URLs

  /**
   * Creates a new SiteAuditor instance
   * 
   * @param config - Configuration options for the site audit
   */
  constructor(config: SiteAuditConfig) {
    this.config = {
      ...{
        maxDepth: 3,
        emulateDevice: 'desktop',
        respectRobotsTxt: true,
        includeScreenshots: false,
        skipExternal: true,
        maxRequestsPerCrawl: 100, // Default limit to prevent infinite crawls
        maxConcurrency: 5,        // Default concurrency
        maxRequestRetries: 3,     // Default retries
        navigationTimeout: 30000, // Default timeout (30 seconds)
      },
      ...config
    };
    
    this.startTime = Date.now();
    this.datasetName = `audit-${this.startTime}`;
    
    // Initialize logger
    log.setLevel(log.LEVELS.DEBUG);
    
    // Create the crawler instance with enhanced configurations
    this.crawler = new PlaywrightCrawler({
      // Use Playwright browser with specific configuration
      browserPoolOptions: {
        useIncognitoPages: true,
        launchOptions: {
          headless: true,
        },
      },
      
      // Improved concurrency and rate limiting settings
      maxConcurrency: this.config.maxConcurrency,
      maxRequestRetries: this.config.maxRequestRetries,
      maxRequestsPerCrawl: this.config.maxRequestsPerCrawl,
      navigationTimeoutSecs: this.config.navigationTimeout ? this.config.navigationTimeout / 1000 : 30,
      
      // Enhanced pre-navigation hook for headers and device emulation
      preNavigationHooks: [
        async ({ page, request }) => {
          // Set custom headers if specified
          if (this.config.customHeaders) {
            await page.setExtraHTTPHeaders(this.config.customHeaders);
          }
          
          // Emulate device if specified
          if (this.config.emulateDevice === 'mobile') {
            await page.emulate(playwrightUtils.devices['iPhone 12']);
          }
          
          // Set cookies if available in the request
          if (request.userData.cookies) {
            await page.context().addCookies(request.userData.cookies);
          }
          
          // Log navigation start
          log.debug(`Navigating to ${request.url} (depth: ${request.userData.depth || 0})`);
        }
      ],
      
      // Smart request handler with enhanced SPA support
      requestHandler: async ({ request, page, enqueueLinks, crawler }) => {
        try {
          // Increment counter
          this.totalPagesDiscovered++;
          
          // Improved SPA support with smart waiting strategies
          await this.waitForPageLoad(page);
          
          // Extract all relevant data from the page
          const pageData = await this.auditPage(page, request);
          this.results.set(request.url, pageData);
          
          // Save to dataset for persistence
          await Dataset.pushData({
            url: request.url,
            ...pageData,
            depth: request.userData.depth || 0,
          });
          
          // Increment processed counter and update progress
          this.totalPagesProcessed++;
          this.updateProgress();
          
          // Follow links if within same domain and respect robots.txt
          if (this.shouldCrawlLinks(request)) {
            const enqueueOptions = {
              globs: [`${new URL(request.url).origin}/**`],
              exclude: [
                "*.pdf", "*.jpg", "*.png", "*.gif", "*.svg", "*.webp", "*.mp4", "*.webm", "*.mp3",
                "*.zip", "*.rar", "*.exe", "*.dmg", "*.doc", "*.docx", "*.xls", "*.xlsx",
                "*?*", // Skip URLs with query parameters unless configured otherwise
                "*#*", // Skip anchor URLs
              ],
              transformRequestFunction: (req: CrawleeRequest) => {
                // Add depth information
                req.userData.depth = (request.userData.depth || 0) + 1;
                return req;
              },
            };
            
            // Don't exclude query params if configured
            if (this.config.includeQueryParams) {
              enqueueOptions.exclude = enqueueOptions.exclude.filter(item => item !== "*?*");
            }
            
            // Enqueue links respecting robots.txt if configured
            await enqueueLinks(enqueueOptions);
          }
        } catch (error) {
          log.error(`Error crawling ${request.url}:`, error);
          this.results.set(request.url, {
            url: request.url,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });
          
          // Save error to dataset
          await Dataset.pushData({
            url: request.url,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });
          
          // Update processed counter and progress
          this.totalPagesProcessed++;
          this.updateProgress();
        }
      },
      
      // Enhanced failed request handler
      failedRequestHandler: async ({ request, errorMessages }) => {
        log.error(`Failed to load ${request.url}: ${errorMessages.join(', ')}`);
        
        this.results.set(request.url, {
          url: request.url,
          error: `Failed to load page: ${errorMessages.join(', ')}`,
          timestamp: new Date().toISOString(),
          statusCode: request.userData.statusCode,
        });
        
        // Save to dataset
        await Dataset.pushData({
          url: request.url,
          error: `Failed to load page: ${errorMessages.join(', ')}`,
          timestamp: new Date().toISOString(),
          statusCode: request.userData.statusCode,
        });
        
        // Update processed counter and progress
        this.totalPagesProcessed++;
        this.updateProgress();
      },
    });
  }

  /**
   * Smart waiting strategy for SPAs and dynamic content
   */
  private async waitForPageLoad(page: any): Promise<void> {
    // Wait for network to be idle (no requests for 500ms)
    await page.waitForLoadState('networkidle', { timeout: this.config.navigationTimeout || 30000 });
    
    // Check for specific SPA frameworks and adjust accordingly
    const isSPA = await page.evaluate(() => {
      return !!(
        window.angular || 
        window.React || 
        window.Vue || 
        document.querySelector('#__next') || // Next.js
        document.querySelector('#app') ||    // Vue/React common root
        document.querySelector('script[src*="runtime~main"]') // CRA
      );
    });
    
    if (isSPA) {
      // Give extra time for SPA framework to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Wait for main content to be available
      await page.waitForFunction(() => {
        const mainContent = document.querySelector('main') || 
                          document.querySelector('#main') || 
                          document.querySelector('.main') ||
                          document.querySelector('#content') ||
                          document.querySelector('.content');
                          
        return !!mainContent && mainContent.childElementCount > 0;
      }, { timeout: this.config.navigationTimeout || 30000 }).catch(() => {
        // Continue even if this times out - some SPAs may not have these elements
      });
    }
  }

  /**
   * Processes and audits a single page
   */
  private async auditPage(page: any, request: any): Promise<PageAuditData> {
    const startProcessingTime = Date.now();
    
    // Capture network and console activity
    const networkRequests: Request[] = [];
    const responses: Response[] = [];
    const consoleMessages: string[] = [];

    page.on("request", (req: Request) => networkRequests.push(req));
    page.on("response", (res: Response) => {
      responses.push(res);
      
      // Store HTTP status code
      if (res.url() === request.url) {
        request.userData.statusCode = res.status();
      }
    });
    page.on("console", (msg: any) => consoleMessages.push(msg.text()));

    // Take screenshot if configured
    let screenshot = null;
    if (this.config.includeScreenshots) {
      try {
        screenshot = await page.screenshot({ 
          type: 'jpeg', 
          quality: 80,
          fullPage: true
        });
        // Store screenshot in KeyValueStore
        const screenshotUrl = await KeyValueStore.setValue(
          `screenshot-${request.uniqueKey || Date.now()}`, 
          screenshot, 
          { contentType: 'image/jpeg' }
        );
      } catch (error) {
        log.warning(`Failed to take screenshot of ${request.url}: ${error}`);
      }
    }
    
    // Collect response headers for later analysis
    const responseHeaders = {};
    const mainResponse = responses.find(r => r.url() === request.url);
    if (mainResponse) {
      const headers = mainResponse.headers();
      Object.keys(headers).forEach(key => {
        responseHeaders[key] = headers[key];
      });
    }

    // Extract SEO data
    const seoData = await extractSEOData(page);

    // Extract performance metrics
    const performanceData = await extractPerformanceData(page);

    // Extract accessibility data
    const accessibilityData = await extractAccessibilityData(page);
    
    // Extract the HTML content for duplicate detection
    const htmlContent = await page.content();
    const textContent = await page.evaluate(() => document.body.innerText);
    
    // Check if the content is duplicated elsewhere
    const duplicateOf = await this.checkForDuplicateContent(request.url, textContent);
    
    return {
      url: request.url,
      timestamp: new Date().toISOString(),
      statusCode: request.userData.statusCode,
      seo: seoData,
      performance: performanceData,
      accessibility: accessibilityData,
      htmlSize: htmlContent.length,
      textSize: textContent.length,
      requests: networkRequests.length,
      responses: responses.map((r) => ({
        url: r.url(),
        status: r.status(),
        headers: r.headers(),
      })),
      responseHeaders,
      consoleMessages,
      processingTimeMs: Date.now() - startProcessingTime,
      screenshotPath: screenshot ? `screenshot-${request.uniqueKey || Date.now()}` : null,
      duplicateOf,
    };
  }

  /**
   * Checks if the current URL should be crawled deeper
   */
  private shouldCrawlLinks(request: any): boolean {
    // Skip external links if configured
    if (this.config.skipExternal) {
      if (this.isExternalUrl(request.url, this.config.startUrl)) {
        return false;
      }
    }
    
    // Check depth constraints
    const depth = request.userData.depth || 0;
    if (depth >= (this.config.maxDepth || 3)) {
      return false;
    }
    
    // Check robots.txt rules if enabled
    if (this.config.respectRobotsTxt && this.disallowedUrls.length > 0) {
      if (this.isDisallowed(request.url)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Checks if a URL is external to the starting domain
   */
  private isExternalUrl(url: string, baseUrl: string): boolean {
    try {
      const urlOrigin = new URL(url).origin;
      const baseOrigin = new URL(baseUrl).origin;
      return urlOrigin !== baseOrigin;
    } catch (error) {
      return true; // Treat invalid URLs as external
    }
  }
  
  /**
   * Checks if a URL is disallowed by robots.txt
   */
  private isDisallowed(url: string): boolean {
    for (const pattern of this.disallowedUrls) {
      if (url.includes(pattern)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Updates progress information and fires callback if provided
   */
  private updateProgress(): void {
    if (this.progressCallback) {
      const progress = this.totalPagesDiscovered > 0 
        ? Math.round((this.totalPagesProcessed / this.totalPagesDiscovered) * 100) 
        : 0;
      
      this.progressCallback(
        progress, 
        this.totalPagesDiscovered,
        this.totalPagesProcessed
      );
    }
  }
  
  /**
   * Checks for duplicate content across pages
   */
  private async checkForDuplicateContent(url: string, content: string): Promise<string | null> {
    return await detectDuplicateContent(url, content, this.duplicateContentMap);
  }

  /**
   * Sets a callback function for progress updates
   */
  public onProgress(callback: (progress: number, discovered: number, processed: number) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Parses robots.txt to respect crawler directives
   */
  private async parseRobotsTxt(): Promise<void> {
    try {
      const baseUrl = new URL(this.config.startUrl);
      const robotsTxtUrl = `${baseUrl.origin}/robots.txt`;
      
      log.info(`Parsing robots.txt at ${robotsTxtUrl}`);
      const { allowed, disallowed } = await parseRobotsTxt(robotsTxtUrl);
      
      this.allowedUrls = allowed;
      this.disallowedUrls = disallowed;
      
      log.info(`Parsed robots.txt: ${disallowed.length} disallowed patterns`);
    } catch (error) {
      log.warning(`Failed to parse robots.txt: ${error}`);
    }
  }
  
  /**
   * Parses sitemap.xml to discover URLs
   */
  private async parseSitemap(): Promise<string[]> {
    try {
      const baseUrl = new URL(this.config.startUrl);
      const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;
      
      log.info(`Parsing sitemap at ${sitemapUrl}`);
      const urls = await parseSitemap(sitemapUrl);
      
      log.info(`Found ${urls.length} URLs in sitemap`);
      return urls;
    } catch (error) {
      log.warning(`Failed to parse sitemap: ${error}`);
      return [];
    }
  }
  
  /**
   * Sets up authentication for crawling protected areas
   */
  public async setupAuthentication(credentials: { username?: string; password?: string; cookies?: any[] }): Promise<void> {
    if (!credentials) return;
    
    // We'll need to use a shared context for authentication
    this.crawler.browserPoolOptions.useFingerprints = true;
    
    // Setup pre-navigation hook for authentication
    this.crawler.preNavigationHooks.push(async ({ page, request }) => {
      if (credentials.cookies) {
        await page.context().addCookies(credentials.cookies);
      }
      
      if (credentials.username && credentials.password && request.userData.requiresAuth) {
        // This is a simple example - real implementation would depend on the site's login form
        await page.fill('input[name="username"]', credentials.username);
        await page.fill('input[name="password"]', credentials.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        
        // Store cookies for future requests
        const cookies = await page.context().cookies();
        request.userData.cookies = cookies;
      }
    });
  }

  /**
   * Starts the site audit process
   */
  public async start(): Promise<AuditResult> {
    log.info(`Starting audit of ${this.config.startUrl}`);
    this.startTime = Date.now();
    
    try {
      // Reset counters
      this.totalPagesDiscovered = 0;
      this.totalPagesProcessed = 0;
      
      // Create request queue
      this.requestQueue = await RequestQueue.open();
      
      // Parse robots.txt if configured
      if (this.config.respectRobotsTxt) {
        await this.parseRobotsTxt();
      }
      
      // Find URLs from sitemap
      let initialUrls = [this.config.startUrl];
      if (this.config.includeSitemap) {
        const sitemapUrls = await this.parseSitemap();
        if (sitemapUrls.length > 0) {
          initialUrls = [...initialUrls, ...sitemapUrls];
        }
      }
      
      // Add initial URLs to the queue
      for (const url of initialUrls) {
        await this.requestQueue.addRequest({
          url,
          userData: {
            depth: 0,
            label: url === this.config.startUrl ? 'START_URL' : 'SITEMAP_URL',
          }
        });
      }
      
      // Run the crawler
      await this.crawler.run(this.requestQueue);
      
      // Process and analyze results
      log.info(`Audit completed. Analyzed ${this.results.size} pages.`);
      const issues = this.analyzeResults();
      
      return {
        startUrl: this.config.startUrl,
        pagesAnalyzed: this.results.size,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        issues,
        pages: Array.from(this.results.values()),
      };
    } catch (error) {
      log.error(`Audit failed: ${error}`);
      throw error;
    }
  }

  /**
   * Analyzes the crawl results to identify issues
   */
  private analyzeResults(): any[] {
    log.info("Analyzing audit results...");
    const issues: any[] = [];

    // Meta Information Issues
    this.detectMetaIssues(issues);

    // Content Issues
    this.detectContentIssues(issues);

    // Technical Issues
    this.detectTechnicalIssues(issues);

    // Performance Issues
    this.detectPerformanceIssues(issues);

    // Accessibility Issues
    this.detectAccessibilityIssues(issues);
    
    // Duplicate Content Issues
    this.detectDuplicateContentIssues(issues);

    log.info(`Analysis completed: found ${issues.length} issues`);
    return issues;
  }

  private detectMetaIssues(issues: any[]): void {
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const seo = page.seo;

      if (!seo) return;

      // Title issues
      if (!seo.title) {
        issues.push({
          severity: "critical",
          message: "Missing page title",
          details: "Page titles are crucial for SEO and user experience.",
          affectedUrls: [url],
        });
      } else if (seo.title.length < 30 || seo.title.length > 60) {
        issues.push({
          severity: "warning",
          message: "Page title length is not optimal",
          details: `Title should be between 30-60 characters. Current length: ${seo.title.length}`,
          affectedUrls: [url],
        });
      }

      // Meta description issues
      if (!seo.metaDescription) {
        issues.push({
          severity: "warning",
          message: "Missing meta description",
          details:
            "Meta descriptions help improve click-through rates from search results.",
          affectedUrls: [url],
        });
      } else if (
        seo.metaDescription.length < 120 ||
        seo.metaDescription.length > 155
      ) {
        issues.push({
          severity: "info",
          message: "Meta description length is not optimal",
          details: `Description should be between 120-155 characters. Current length: ${seo.metaDescription.length}`,
          affectedUrls: [url],
        });
      }
    });
  }

  private detectContentIssues(issues: any[]): void {
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const seo = page.seo;

      if (!seo) return;

      // Heading hierarchy issues
      if (seo.headings.h1.length === 0) {
        issues.push({
          severity: "critical",
          message: "Missing H1 heading",
          details: "Each page should have exactly one H1 heading.",
          affectedUrls: [url],
        });
      } else if (seo.headings.h1.length > 1) {
        issues.push({
          severity: "warning",
          message: "Multiple H1 headings",
          details: "A page should typically have only one H1 heading.",
          affectedUrls: [url],
        });
      }

      // Image issues
      const imagesWithoutAlt = seo.images.filter((img) => !img.alt);
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          severity: "warning",
          message: "Images missing alt text",
          details: `${imagesWithoutAlt.length} images are missing alt text, which is important for accessibility and SEO.`,
          affectedUrls: [url],
        });
      }
      
      // Low content issues
      if (page.textSize < 300) {
        issues.push({
          severity: "warning",
          message: "Thin content",
          details: "This page has very little content, which may result in poor search rankings.",
          affectedUrls: [url],
        });
      }
    });
  }

  private detectTechnicalIssues(issues: any[]): void {
    const urls = new Set<string>();
    const internalLinks = new Map<string, string[]>();

    // First pass: collect all internal links
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const seo = page.seo;
      urls.add(url);

      if (!seo) return;

      const pageInternalLinks = seo.links
        .filter((link) => link.isInternal)
        .map((link) => link.url);
      internalLinks.set(url, pageInternalLinks);
    });

    // Check for broken internal links
    internalLinks.forEach((links, sourceUrl) => {
      const brokenLinks = links.filter((link) => !urls.has(link));
      if (brokenLinks.length > 0) {
        issues.push({
          severity: "critical",
          message: "Broken internal links detected",
          details: `Found ${brokenLinks.length} broken internal links on this page.`,
          affectedUrls: [sourceUrl],
        });
      }
    });

    // Check canonical issues
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const seo = page.seo;

      if (!seo) return;

      if (!seo.canonicalUrl) {
        issues.push({
          severity: "warning",
          message: "Missing canonical URL",
          details: "Canonical URLs help prevent duplicate content issues.",
          affectedUrls: [url],
        });
      } else if (seo.canonicalUrl !== url) {
        issues.push({
          severity: "info",
          message: "Page uses different canonical URL",
          details: `This page points to a different canonical URL: ${seo.canonicalUrl}`,
          affectedUrls: [url],
        });
      }
      
      // Check HTTP status code issues
      if (page.statusCode && (page.statusCode < 200 || page.statusCode >= 400)) {
        issues.push({
          severity: "critical",
          message: `HTTP error status ${page.statusCode}`,
          details: `This page returned a non-successful HTTP status code: ${page.statusCode}`,
          affectedUrls: [url],
        });
      }
    });
  }

  private detectPerformanceIssues(issues: any[]): void {
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const performance = page.performance;

      if (!performance) return;

      // LCP issues
      if (performance.lcp > 4000) {
        issues.push({
          severity: "critical",
          message: "Poor Largest Contentful Paint (LCP)",
          details: `LCP of ${Math.round(
            performance.lcp
          )}ms is above the recommended 4000ms threshold.`,
          affectedUrls: [url],
        });
      }

      // CLS issues
      if (performance.cls > 0.25) {
        issues.push({
          severity: "warning",
          message: "High Cumulative Layout Shift (CLS)",
          details: `CLS of ${performance.cls.toFixed(
            3
          )} is above the recommended 0.25 threshold.`,
          affectedUrls: [url],
        });
      }

      // TTFB issues
      if (performance.ttfb > 600) {
        issues.push({
          severity: "warning",
          message: "Slow Time to First Byte (TTFB)",
          details: `TTFB of ${Math.round(
            performance.ttfb
          )}ms is above the recommended 600ms threshold.`,
          affectedUrls: [url],
        });
      }
      
      // Resource count issues
      if (page.requests > 100) {
        issues.push({
          severity: "warning",
          message: "High number of requests",
          details: `This page makes ${page.requests} HTTP requests, which might slow down page loading.`,
          affectedUrls: [url],
        });
      }
    });
  }

  private detectAccessibilityIssues(issues: any[]): void {
    Array.from(this.results.values()).forEach((page) => {
      const { url } = page;
      const accessibility = page.accessibility;

      if (!accessibility) return;

      // Add critical accessibility violations
      const criticalViolations = accessibility.violations.filter(
        (v) => v.impact === "critical"
      );
      if (criticalViolations.length > 0) {
        issues.push({
          severity: "critical",
          message: "Critical accessibility violations detected",
          details: `Found ${criticalViolations.length} critical accessibility issues that need immediate attention.`,
          affectedUrls: [url],
        });
      }

      // Add other accessibility violations
      const otherViolations = accessibility.violations.filter(
        (v) => v.impact !== "critical"
      );
      if (otherViolations.length > 0) {
        issues.push({
          severity: "warning",
          message: "Accessibility issues detected",
          details: `Found ${otherViolations.length} accessibility issues that should be addressed.`,
          affectedUrls: [url],
        });
      }
    });
  }
  
  /**
   * Detects duplicate content issues
   */
  private detectDuplicateContentIssues(issues: any[]): void {
    const duplicates: Record<string, string[]> = {};
    
    // Collect duplicate pages
    Array.from(this.results.values()).forEach((page) => {
      if (page.duplicateOf) {
        if (!duplicates[page.duplicateOf]) {
          duplicates[page.duplicateOf] = [];
        }
        duplicates[page.duplicateOf].push(page.url);
      }
    });
    
    // Create issues for duplicate content
    Object.entries(duplicates).forEach(([originalUrl, duplicateUrls]) => {
      if (duplicateUrls.length > 0) {
        issues.push({
          severity: "warning",
          message: "Duplicate content detected",
          details: `Found ${duplicateUrls.length} pages with content similar to ${originalUrl}. Consider using canonical URLs.`,
          affectedUrls: [...duplicateUrls, originalUrl],
        });
      }
    });
  }
}
