import { URL } from 'url';
import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

interface KeywordToCheck {
  id: string;
  keyword: string;
}

interface RankCheckOptions {
  projectUrl: string;
  keywords: KeywordToCheck[];
  searchEngine: string;
  maxPages?: number; // Maximum number of pages to check
  country?: string;
  language?: string;
}

interface RankingResult {
  keywordId: string;
  keyword: string;
  rank: number | null;
  url: string | null;
  page: number | null;
  position: number | null;
}

/**
 * Check rankings for a list of keywords for a specific website
 * This implementation is designed to be more serverless-friendly compared to using Crawlee
 * @param options Configuration options including keywords and project URL
 * @returns Array of ranking results
 */
export async function checkKeywordRankings(options: RankCheckOptions): Promise<RankingResult[]> {
  const { projectUrl, keywords, searchEngine, maxPages = 2 } = options;
  
  // Extract domain for matching - remove www if present
  const projectDomain = new URL(projectUrl).hostname.replace(/^www\./, '');
  
  // Results storage
  const results: RankingResult[] = [];
  
  // Launch browser only once for all keywords to improve performance
  let browser = null;
  
  try {
    // Use minimal browser configuration optimized for serverless environments
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process' // Important for serverless environments
      ]
    });
    
    // Process keywords sequentially to reduce memory usage
    for (const keyword of keywords) {
      let rankingResult: RankingResult = {
        keywordId: keyword.id,
        keyword: keyword.keyword,
        rank: null,
        url: null,
        page: null,
        position: null
      };
      
      try {
        // Create a new context for each keyword to avoid cross-contamination
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        
        // Set a reasonable timeout
        page.setDefaultTimeout(15000);
        
        // Check up to the specified number of pages
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          // Construct search URL based on search engine
          let searchUrl;
          if (searchEngine === 'google') {
            const startParam = pageNum > 1 ? `&start=${(pageNum - 1) * 10}` : '';
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}&hl=en${startParam}`;
          } else if (searchEngine === 'bing') {
            const firstParam = pageNum > 1 ? `&first=${(pageNum - 1) * 10 + 1}` : '';
            searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword.keyword)}${firstParam}`;
          } else {
            // Default to Google
            const startParam = pageNum > 1 ? `&start=${(pageNum - 1) * 10}` : '';
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}&hl=en${startParam}`;
          }
          
          console.log(`Checking '${keyword.keyword}' on ${searchEngine}, page ${pageNum}`);
          
          try {
            // Navigate to search page
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            
            // Add a small delay to ensure page loads properly
            await setTimeout(1500);
            
            // Extract search result links based on search engine
            let resultLinks = [];
            if (searchEngine === 'google') {
              // Try multiple selector strategies for Google (their HTML structure changes frequently)
              resultLinks = await page.evaluate(() => {
                // First attempt: standard search results
                let links = Array.from(document.querySelectorAll('div.g a[href^="http"]:not([href*="google"])'))
                  .map(el => (el as HTMLAnchorElement).href);
                
                // Second attempt: modern layout with yuRUbf class
                if (!links.length) {
                  links = Array.from(document.querySelectorAll('.yuRUbf > a, [data-header-feature] a[href^="http"]:not([href*="google"])'))
                    .map(el => (el as HTMLAnchorElement).href);
                }
                
                // Third attempt: general links in search results
                if (!links.length) {
                  links = Array.from(document.querySelectorAll('#search a[href^="http"]:not([href*="google"])')
                    .values())
                    .map(el => (el as HTMLAnchorElement).href)
                    // Filter out navigation links, image links, etc.
                    .filter(href => !href.includes('webcache.googleusercontent') && 
                                   !href.includes('google.com/search') &&
                                   !href.includes('accounts.google') &&
                                   !href.includes('support.google'));
                }
                
                return links;
              });
            } else if (searchEngine === 'bing') {
              resultLinks = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('li.b_algo h2 > a'))
                  .map(el => (el as HTMLAnchorElement).href);
              });
            }
            
            console.log(`Found ${resultLinks.length} result links`);
            
            // Find the position of the target domain
            for (let i = 0; i < resultLinks.length; i++) {
              const url = resultLinks[i];
              try {
                // Check if this URL contains our target domain
                if (url.includes(projectDomain)) {
                  rankingResult = {
                    keywordId: keyword.id,
                    keyword: keyword.keyword,
                    rank: (pageNum - 1) * 10 + (i + 1), // Overall rank
                    url,
                    page: pageNum,
                    position: i + 1, // Position on the current page
                  };
                  console.log(`Found ${projectDomain} at rank ${rankingResult.rank}`);
                  break;
                }
              } catch (urlError) {
                console.error(`Error checking URL ${url}:`, urlError);
                // Continue to next URL
              }
            }
            
            // If found a ranking, no need to check more pages
            if (rankingResult.rank !== null) {
              break;
            }
          } catch (pageError) {
            console.error(`Error on page ${pageNum} for keyword ${keyword.keyword}:`, pageError);
            // Continue to next page or keyword
          }
        }
        
        // Close the context to free resources
        await context.close();
      } catch (keywordError) {
        console.error(`Error processing keyword ${keyword.keyword}:`, keywordError);
        // Continue to next keyword with null values
      }
      
      // Always add a result for this keyword (found or not)
      results.push(rankingResult);
    }
  } catch (error) {
    console.error('Critical error in rank checking:', error);
  } finally {
    // Always close the browser to free resources
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    // Ensure each keyword has a result entry, even if processing failed
    const coveredKeywordIds = new Set(results.map(r => r.keywordId));
    for (const keyword of keywords) {
      if (!coveredKeywordIds.has(keyword.id)) {
        results.push({
          keywordId: keyword.id,
          keyword: keyword.keyword,
          rank: null,
          url: null,
          page: null,
          position: null
        });
      }
    }
  }
  
  return results;
}