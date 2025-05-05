import axios from 'axios';
import { log } from 'crawlee';
import { XMLParser } from 'fast-xml-parser';

/**
 * Parse a sitemap.xml file and extract all URLs
 * 
 * @param url - URL to the sitemap.xml file
 * @returns Array of URLs found in the sitemap
 */
export async function parseSitemap(url: string): Promise<string[]> {
  try {
    // Set a user agent to avoid being blocked
    const response = await axios.get(url, { 
      timeout: 20000,
      headers: {
        'User-Agent': 'SEOMasterBot/1.0 (+https://seo-saas.example.com/bot)'
      }
    });
    
    // Check if we got XML
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('xml')) {
      log.warning(`Sitemap at ${url} is not XML, got content-type: ${contentType}`);
    }
    
    // Initialize parser with options
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      allowBooleanAttributes: true
    });
    
    // Parse the XML
    const content = response.data;
    return await extractUrlsFromSitemap(content, url, parser);
  } catch (error) {
    log.warning(`Failed to fetch sitemap from ${url}: ${error}`);
    return [];
  }
}

/**
 * Extract URLs from sitemap XML content
 */
async function extractUrlsFromSitemap(xml: string, sitemapUrl: string, parser: XMLParser): Promise<string[]> {
  try {
    const result = parser.parse(xml);
    const urls: string[] = [];
    
    // Check if this is a sitemap index (contains multiple sitemaps)
    if (result.sitemapindex) {
      log.info('Found sitemap index with multiple sitemaps');
      
      // Process each sitemap in the index
      const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
        ? result.sitemapindex.sitemap 
        : [result.sitemapindex.sitemap];
      
      for (const sitemap of sitemaps) {
        if (sitemap.loc) {
          log.info(`Processing sub-sitemap: ${sitemap.loc}`);
          try {
            // Recursively process each sitemap in the index
            const subSitemapUrls = await parseSitemap(sitemap.loc);
            urls.push(...subSitemapUrls);
          } catch (error) {
            log.warning(`Failed to process sub-sitemap at ${sitemap.loc}: ${error}`);
          }
        }
      }
    } 
    // Regular sitemap with URLs
    else if (result.urlset) {
      const urlset = Array.isArray(result.urlset.url) 
        ? result.urlset.url 
        : [result.urlset.url];
      
      for (const item of urlset) {
        if (item.loc) {
          urls.push(item.loc);
        }
      }
    } 
    // Not a recognized sitemap format
    else {
      log.warning(`Sitemap at ${sitemapUrl} doesn't have expected format`);
    }
    
    return urls;
  } catch (error) {
    log.error(`Error parsing sitemap XML from ${sitemapUrl}: ${error}`);
    return [];
  }
}

/**
 * A more comprehensive sitemap parser that handles special cases
 */
export async function parseAllSitemaps(baseUrl: string): Promise<string[]> {
  const allUrls: string[] = [];
  const processedSitemaps = new Set<string>();
  
  // Try common sitemap paths
  const sitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemap/sitemap.xml',
    '/wp-sitemap.xml',      // WordPress
    '/sitemap1.xml',        
    '/post-sitemap.xml',    // WordPress-specific
    '/page-sitemap.xml',    // WordPress-specific
    '/news-sitemap.xml',    // News sites
    '/product-sitemap.xml', // eCommerce sites
  ];
  
  // Get the base URL without trailing slash
  const origin = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Also check robots.txt for sitemap references
  try {
    const robotsTxtUrl = `${origin}/robots.txt`;
    const robotsResponse = await axios.get(robotsTxtUrl, { timeout: 10000 });
    const robotsContent = robotsResponse.data;
    
    // Find Sitemap: directives in robots.txt
    const sitemapMatches = robotsContent.match(/Sitemap:\s*(.+)$/igm);
    if (sitemapMatches) {
      for (const match of sitemapMatches) {
        const sitemapUrl = match.replace(/Sitemap:\s*/i, '').trim();
        sitemapPaths.push(sitemapUrl);
      }
    }
  } catch (error) {
    // Ignore if robots.txt cannot be fetched
  }
  
  // Process each potential sitemap URL
  for (const path of sitemapPaths) {
    const sitemapUrl = path.startsWith('http') ? path : `${origin}${path}`;
    
    // Skip if already processed
    if (processedSitemaps.has(sitemapUrl)) {
      continue;
    }
    
    processedSitemaps.add(sitemapUrl);
    
    try {
      log.info(`Trying sitemap at ${sitemapUrl}`);
      const sitemapUrls = await parseSitemap(sitemapUrl);
      log.info(`Found ${sitemapUrls.length} URLs in sitemap ${sitemapUrl}`);
      
      allUrls.push(...sitemapUrls);
    } catch (error) {
      // Skip if this sitemap URL doesn't work
    }
  }
  
  // Return unique URLs
  return [...new Set(allUrls)];
}