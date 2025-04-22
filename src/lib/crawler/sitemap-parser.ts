import { XMLParser } from "fast-xml-parser";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

/**
 * Extract URLs from a sitemap XML
 * @param sitemapUrl The URL of the sitemap to parse
 * @returns Array of URLs found in the sitemap
 */
export async function getSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    // Fetch the sitemap XML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOSaaS/1.0; +https://example.com)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `Failed to fetch sitemap: ${response.statusText} (${response.status})`
      );
      return [];
    }

    const xml = await response.text();

    // Parse the XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      allowBooleanAttributes: true,
    });

    const result = parser.parse(xml);
    let allUrls: string[] = [];

    // Handle regular sitemaps
    if (result.urlset?.url) {
      const urls = Array.isArray(result.urlset.url)
        ? result.urlset.url
        : [result.urlset.url];

      allUrls = urls.map((entry: { loc: string }) => entry.loc).filter(Boolean);
    }

    // Handle sitemap indexes (recursive)
    if (result.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap];

      const sitemapUrls = sitemaps
        .map((entry: { loc: string }) => entry.loc)
        .filter(Boolean);

      // Recursively fetch and parse child sitemaps
      for (const childSitemapUrl of sitemapUrls) {
        try {
          const childUrls = await getSitemapUrls(childSitemapUrl);
          allUrls = [...allUrls, ...childUrls];
        } catch (error) {
          console.error(
            `Error parsing child sitemap ${childSitemapUrl}:`,
            error
          );
        }
      }
    }

    // If we found no URLs but the XML contains URLs directly, try to extract them as a fallback
    if (allUrls.length === 0 && xml.includes("<loc>")) {
      const locMatches = xml.match(/<loc>(.*?)<\/loc>/g);
      if (locMatches) {
        allUrls = locMatches
          .map((match) =>
            match.replace("<loc>", "").replace("</loc>", "").trim()
          )
          .filter(Boolean);
      }
    }

    return allUrls;
  } catch (error) {
    console.error("Error parsing sitemap:", error);
    return [];
  }
}

/**
 * Discover sitemap locations for a domain using common patterns and robots.txt
 * @param baseUrl Base URL of the website
 * @returns Array of all URLs found across all discovered sitemaps
 */
export async function discoverSitemapsForDomain(
  baseUrl: string
): Promise<string[]> {
  try {
    // Normalize base URL
    const url = new URL(baseUrl);
    const domainBase = `${url.protocol}//${url.hostname}`;

    // Common sitemap locations to check
    const potentialSitemapUrls = [
      `${domainBase}/sitemap.xml`,
      `${domainBase}/sitemap_index.xml`,
      `${domainBase}/sitemap.php`,
      `${domainBase}/sitemap.txt`,
      `${domainBase}/sitemap/`,
      `${domainBase}/sitemaps/`,
      `${domainBase}/wp-sitemap.xml`,
      `${domainBase}/sitemap/sitemap-index.xml`,
    ];

    // Also check robots.txt for sitemap references
    try {
      const robotsUrl = `${domainBase}/robots.txt`;
      const robotsSitemaps = await extractSitemapsFromRobotsTxt(robotsUrl);
      potentialSitemapUrls.push(...robotsSitemaps);
    } catch (error) {
      console.warn(`Could not extract sitemaps from robots.txt:`, error);
    }

    // Also try to find sitemaps mentioned in the HTML
    try {
      const htmlSitemaps = await extractSitemapsFromHTML(`${domainBase}/`, domainBase);
      potentialSitemapUrls.push(...htmlSitemaps);
    } catch (error) {
      console.warn(`Could not extract sitemaps from HTML:`, error);
    }

    // Deduplicate potential sitemap URLs
    const uniquePotentialSitemaps = Array.from(new Set(potentialSitemapUrls));
    let allUrls: string[] = [];

    // Try each potential sitemap location
    for (const sitemapUrl of uniquePotentialSitemaps) {
      try {
        const urls = await getSitemapUrls(sitemapUrl);
        if (urls.length > 0) {
          console.log(`Found ${urls.length} URLs in sitemap: ${sitemapUrl}`);
          allUrls = [...allUrls, ...urls];
        }
      } catch (error) {
        // Continue to the next potential sitemap URL if this one fails
        continue;
      }
    }

    // Remove duplicates
    return Array.from(new Set(allUrls));
  } catch (error) {
    console.error(`Error discovering sitemaps:`, error);
    return [];
  }
}

/**
 * Extract sitemap URLs from robots.txt
 * @param robotsTxtUrl URL of the robots.txt file
 * @returns Array of sitemap URLs
 */
async function extractSitemapsFromRobotsTxt(
  robotsTxtUrl: string
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    const response = await fetch(robotsTxtUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOSaaS/1.0; +https://example.com)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    const sitemapUrls: string[] = [];

    // Extract sitemap URLs from robots.txt
    const matches = text.match(/^Sitemap:\s*(.*)$/gim);
    if (matches) {
      for (const match of matches) {
        const url = match.replace(/^Sitemap:\s*/i, "").trim();
        if (url && isValidUrl(url)) {
          sitemapUrls.push(url);
        }
      }
    }

    return sitemapUrls;
  } catch (error) {
    console.error("Error fetching robots.txt:", error);
    return [];
  }
}

/**
 * Extract sitemap URLs from HTML content
 * @param url URL of the page to check for sitemap references
 * @returns Array of sitemap URLs
 */
async function extractSitemapsFromHTML(url: string, baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOSaaS/1.0; +https://example.com)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const sitemapUrls: string[] = [];

    // Look for links that might point to sitemaps
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      const text = $(element).text().toLowerCase();

      if (
        href &&
        (href.includes("sitemap") ||
          text.includes("sitemap") ||
          href.endsWith(".xml"))
      ) {
        try {
          const resolvedUrl = new URL(href, baseUrl); // Use baseUrl passed as a parameter
          sitemapUrls.push(url.href);
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    });

    return sitemapUrls;
  } catch (error) {
    console.error("Error extracting sitemaps from HTML:", error);
    return [];
  }
}

/**
 * Check if a string is a valid URL
 * @param url URL to validate
 * @returns boolean indicating if the URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Parses XML sitemaps to extract URLs for crawling
 * Legacy class for compatibility
 */
export class SitemapParser {
  /**
   * Parse a sitemap URL and extract all URLs
   * @param sitemapUrl URL of the sitemap to parse
   * @returns Array of page URLs found in the sitemap
   */
  async parseSitemap(sitemapUrl: string): Promise<string[]> {
    return getSitemapUrls(sitemapUrl);
  }

  /**
   * Automatically discover and parse sitemaps for a website
   * @param baseUrl Base URL of the website
   * @returns Array of all URLs found across all sitemaps
   */
  async discoverAndParseSitemaps(baseUrl: string): Promise<string[]> {
    return discoverSitemapsForDomain(baseUrl);
  }
}
