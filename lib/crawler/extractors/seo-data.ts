import { Page } from 'playwright';
import { SEOData } from '@/types/audit';

export async function extractSEOData(page: Page): Promise<SEOData> {
  return await page.evaluate(() => {
    const getMetaContent = (name: string): string | null => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? (meta as HTMLMetaElement).content : null;
    };

    // Extract structured data
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Extract OpenGraph data
    const openGraph = Array.from(document.querySelectorAll('meta[property^="og:"]'))
      .reduce((acc, meta) => {
        const property = (meta as HTMLMetaElement).getAttribute('property')?.replace('og:', '');
        if (property) {
          acc[property] = (meta as HTMLMetaElement).content;
        }
        return acc;
      }, {} as Record<string, string>);

    // Extract Twitter Card data
    const twitterCards = Array.from(document.querySelectorAll('meta[name^="twitter:"]'))
      .reduce((acc, meta) => {
        const name = (meta as HTMLMetaElement).getAttribute('name')?.replace('twitter:', '');
        if (name) {
          acc[name] = (meta as HTMLMetaElement).content;
        }
        return acc;
      }, {} as Record<string, string>);

    // Extract hreflang data
    const hreflang = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
      .map(link => ({
        href: link.getAttribute('href') || '',
        hreflang: link.getAttribute('hreflang') || '',
      }));

    // Extract robots directives
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsHeader = document.querySelector('meta[name="x-robots-tag"]');

    // Get base URL for internal/external link detection
    const baseUrl = window.location.origin;

    // Extract all links
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(link => {
        const url = link.getAttribute('href') || '';
        const absoluteUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
        return {
          url: absoluteUrl,
          text: link.textContent || '',
          isInternal: absoluteUrl.startsWith(baseUrl),
          nofollow: link.getAttribute('rel')?.includes('nofollow') || false,
        };
      });

    // Extract image data
    const images = Array.from(document.querySelectorAll('img'))
      .map(img => ({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));

    return {
      title: document.title,
      metaDescription: getMetaContent('description') || '',
      headings: {
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent || ''),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent || ''),
        h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent || ''),
      },
      images,
      links,
      canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      structuredData,
      openGraph,
      twitterCards,
      hreflang,
      robots: {
        meta: robotsMeta ? (robotsMeta as HTMLMetaElement).content : null,
        headers: robotsHeader ? (robotsHeader as HTMLMetaElement).content : null,
      },
    };
  });
}