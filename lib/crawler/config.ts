import { Configuration, PlaywrightCrawlerOptions } from 'crawlee';

export const crawlerConfig: PlaywrightCrawlerOptions = {
    requestHandlerTimeoutSecs: 180,
    maxRequestRetries: 3,
    maxRequestsPerCrawl: 1000,
    minConcurrency: 1,
    maxConcurrency: 5,
};

export const defaultHeaders = {
    'User-Agent': 'SEOMaster Audit Bot/1.0 (+https://seomaster.com/bot)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
};

export interface SEOPageData {
    url: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    h2Count: number;
    wordCount: number;
    imageCount: number;
    imagesWithoutAlt: number;
    internalLinks: number;
    externalLinks: number;
    statusCode: number;
    loadTime: number;
    canonical: string | null;
    structured_data: any[];
    headers: Record<string, string>;
    seoIssues: string[];
}