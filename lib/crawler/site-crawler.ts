import { PlaywrightCrawler, Dataset, EnqueueStrategy, Request as CrawleeRequest, PlaywrightCrawlingContext, RequestOptions } from 'crawlee';
import { crawlerConfig, defaultHeaders, SEOPageData } from './config';
import { prisma } from '../db/prisma-client';
import type { AuditStatus } from '@prisma/client';
import type { Page } from 'playwright';

interface CrawlerOptions {
    projectId: string;
    auditId: string;
    maxPages?: number;
    ignoreRobotsTxt?: boolean;
    customHeaders?: Record<string, string>;
}

export class SiteCrawler {
    private crawler: PlaywrightCrawler;
    private baseUrl: string;
    private projectId: string;
    private auditId: string;
    private pagesProcessed: number = 0;
    private startTime: number;

    constructor(startUrl: string, options: CrawlerOptions) {
        this.baseUrl = new URL(startUrl).origin;
        this.projectId = options.projectId;
        this.auditId = options.auditId;
        this.startTime = Date.now();
        const maxRequestsPerCrawl = options.maxPages || 1000;

        this.crawler = new PlaywrightCrawler({
            ...crawlerConfig,
            maxRequestsPerCrawl,
            preNavigationHooks: [
                async ({ page }: PlaywrightCrawlingContext) => {
                    await page.setExtraHTTPHeaders({ ...defaultHeaders, ...options.customHeaders });
                },
            ],
            requestHandler: async ({ request, page, enqueueLinks }: PlaywrightCrawlingContext) => {
                const startTime = Date.now();
                const pageData = await this.analyzePage(page);
                pageData.loadTime = Date.now() - startTime;

                await this.savePageData(pageData);
                this.pagesProcessed++;
                
                await this.updateProgress();

                // Only enqueue links from HTML pages
                const contentType = request.headers?.['content-type'] || '';
                if (contentType.includes('text/html')) {
                    await enqueueLinks({
                        strategy: EnqueueStrategy.SameDomain,
                        transformRequestFunction: (request: RequestOptions) => {
                            // Exclude common non-content URLs
                            const url = new URL(request.url);
                            if (url.pathname.match(/\.(jpg|jpeg|png|gif|css|js|woff|woff2|ttf|svg)$/i)) {
                                return false;
                            }
                            return request;
                        },
                    });
                }
            },
        });
        
        // Store maxRequestsPerCrawl for progress calculations
        this.maxPages = maxRequestsPerCrawl;
    }

    // Add maxPages property to store the max pages to crawl
    private maxPages: number;

    private async analyzePage(page: Page): Promise<SEOPageData> {
        const url = page.url();
        const response = await page.goto(url);
        const statusCode = response?.status() ?? 0;

        const data: SEOPageData = {
            url,
            title: await page.title(),
            metaDescription: await page.$eval('meta[name="description"]', (el: HTMLMetaElement) => el.content).catch(() => null),
            h1: await page.$eval('h1', (el: HTMLHeadingElement) => el.textContent?.trim() ?? null).catch(() => null),
            h2Count: await page.$$eval('h2', (elements: HTMLHeadingElement[]) => elements.length),
            wordCount: await page.$eval('body', (el: HTMLBodyElement) => el.innerText.trim().split(/\s+/).length),
            imageCount: await page.$$eval('img', (elements: HTMLImageElement[]) => elements.length),
            imagesWithoutAlt: await page.$$eval('img:not([alt])', (elements: HTMLImageElement[]) => elements.length),
            internalLinks: await page.$$eval('a[href^="/"], a[href^="' + this.baseUrl + '"]', 
                (elements: HTMLAnchorElement[]) => elements.length),
            externalLinks: await page.$$eval('a[href^="http"]:not([href^="' + this.baseUrl + '"])', 
                (elements: HTMLAnchorElement[]) => elements.length),
            statusCode,
            loadTime: 0, // Will be set later
            canonical: await page.$eval('link[rel="canonical"]', (el: HTMLLinkElement) => el.href).catch(() => null),
            structured_data: await this.extractStructuredData(page),
            headers: response?.headers() ?? {},
            seoIssues: []
        };

        // Analyze SEO issues
        data.seoIssues = await this.analyzeSEOIssues(data, page);

        return data;
    }

    private async extractStructuredData(page: Page): Promise<any[]> {
        return page.$$eval('script[type="application/ld+json"]', (elements: HTMLScriptElement[]) => {
            return elements.map(el => {
                try {
                    return JSON.parse(el.textContent || '{}');
                } catch {
                    return null;
                }
            }).filter(Boolean);
        });
    }

    private async analyzeSEOIssues(data: SEOPageData, page: Page): Promise<string[]> {
        const issues: string[] = [];

        if (!data.title) issues.push('Missing page title');
        if (data.title && data.title.length > 60) issues.push('Title too long (>60 chars)');
        if (!data.metaDescription) issues.push('Missing meta description');
        if (data.metaDescription && data.metaDescription.length > 160) issues.push('Meta description too long (>160 chars)');
        if (!data.h1) issues.push('Missing H1 tag');
        
        const h1Count = await page.$$('h1').then(elements => elements.length);
        if (h1Count > 1) issues.push('Multiple H1 tags');
        
        if (data.imagesWithoutAlt > 0) issues.push(`${data.imagesWithoutAlt} images missing alt text`);
        if (data.wordCount < 300) issues.push('Low word count (<300 words)');

        return issues;
    }

    private async savePageData(data: SEOPageData): Promise<void> {
        await Dataset.pushData(data);

        // Update the on-page analysis in the database
        await prisma.onPageAnalysis.create({
            data: {
                projectId: this.projectId,
                url: data.url,
                title: data.title,
                metaDescription: data.metaDescription,
                h1: data.h1,
                h2Count: data.h2Count,
                imageCount: data.imageCount,
                wordCount: data.wordCount,
                internalLinks: data.internalLinks,
                externalLinks: data.externalLinks,
                score: this.calculateSEOScore(data),
                recommendations: data.seoIssues,
            },
        });
    }

    private calculateSEOScore(data: SEOPageData): number {
        let score = 100;
        score -= data.seoIssues.length * 10; // -10 points per issue
        score -= data.loadTime > 3000 ? 10 : 0; // -10 points if load time > 3s
        score -= data.imagesWithoutAlt > 0 ? 5 : 0; // -5 points if missing alt texts
        return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
    }

    private async updateProgress(): Promise<void> {
        const progressPercentage = Math.min(100, Math.floor((this.pagesProcessed / this.maxPages) * 100));
        
        await prisma.siteAudit.update({
            where: { id: this.auditId },
            data: {
                totalPages: this.pagesProcessed,
                progressPercentage,
                status: progressPercentage === 100 ? 'COMPLETED' as AuditStatus : 'IN_PROGRESS' as AuditStatus,
                completedAt: progressPercentage === 100 ? new Date() : undefined
            },
        });
    }

    async start(): Promise<void> {
        try {
            await prisma.siteAudit.update({
                where: { id: this.auditId },
                data: { status: 'IN_PROGRESS' },
            });

            await this.crawler.run([this.baseUrl]);

            // Final update after crawl completion
            await this.updateProgress();

        } catch (error) {
            await prisma.siteAudit.update({
                where: { id: this.auditId },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
                },
            });
            throw error;
        }
    }
}