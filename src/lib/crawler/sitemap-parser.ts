import { parse as parseXML } from 'fast-xml-parser';
import fetch from 'node-fetch';

/**
 * Parses XML sitemaps to extract URLs for crawling
 */
export class SitemapParser {
  /**
   * Parse a sitemap URL and extract all URLs
   * @param sitemapUrl URL of the sitemap to parse
   * @returns Array of page URLs found in the sitemap
   */
  async parseSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      // Fetch the sitemap XML
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
      }
      
      const xml = await response.text();
      return this.extractUrlsFromSitemap(xml);
    } catch (error) {
      console.error('Error parsing sitemap:', error);
      return [];
    }
  }
  
  /**
   * Extract URLs from sitemap XML content
   * @param xml XML content of the sitemap
   * @returns Array of URLs found in the sitemap
   */
  private extractUrlsFromSitemap(xml: string): string[] {
    try {
      const result = parseXML(xml, {
        ignoreAttributes: false,
        parseAttributeValue: true
      });
      
      // Handle regular sitemaps
      if (result.urlset?.url) {
        const urls = Array.isArray(result.urlset.url) 
          ? result.urlset.url 
          : [result.urlset.url];
        
        return urls.map(entry => entry.loc).filter(Boolean);
      }
      
      // Handle sitemap indexes
      if (result.sitemapindex?.sitemap) {
        const sitemaps = Array.isArray(result.sitemapindex.sitemap)
          ? result.sitemapindex.sitemap
          : [result.sitemapindex.sitemap];
        
        return sitemaps.map(entry => entry.loc).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting URLs from sitemap XML:', error);
      return [];
    }
  }
  
  /**
   * Automatically discover and parse sitemaps for a website
   * @param baseUrl Base URL of the website
   * @returns Array of all URLs found across all sitemaps
   */
  async discoverAndParseSitemaps(baseUrl: string): Promise<string[]> {
    const potentialSitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap.php`,
      `${baseUrl}/sitemap`
    ];
    
    let allUrls: string[] = [];
    
    for (const sitemapUrl of potentialSitemapUrls) {
      try {
        const urls = await this.parseSitemap(sitemapUrl);
        allUrls = [...allUrls, ...urls];
        
        // If we found URLs, consider it a success and don't try other potential locations
        if (urls.length > 0) {
          break;
        }
      } catch (error) {
        // Continue to the next potential sitemap URL if this one fails
        continue;
      }
    }
    
    return Array.from(new Set(allUrls));
  }
}