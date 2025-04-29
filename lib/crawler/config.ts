import { Browser, chromium } from 'playwright';

/**
 * Creates and configures a Playwright browser instance for web crawling
 * 
 * @returns A configured Playwright browser instance
 */
export async function createBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    timeout: 60000,
  });
}

/**
 * Default user agent to use for crawling to appear as a regular browser
 */
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36';

/**
 * Configuration for rate limiting to avoid being blocked
 */
export const RATE_LIMIT_CONFIG = {
  minDelayMs: 500,  // Minimum delay between requests
  maxDelayMs: 3000, // Maximum delay between requests
  maxConcurrency: 2 // Maximum concurrent requests
};

/**
 * Default timeout settings for various operations
 */
export const TIMEOUT_CONFIG = {
  navigationTimeoutSecs: 60,
  requestHandlerTimeoutSecs: 180,
  pageLoadTimeoutMs: 30000
};