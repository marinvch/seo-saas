import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/intex";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    try {
      // Fetch the content from the URL
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SEO SaaS Content Analyzer/1.0)",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
          { status: 500 }
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return NextResponse.json(
          { error: "URL does not point to an HTML page" },
          { status: 400 }
        );
      }

      const html = await response.text();

      // Extract and clean the main content
      const content = extractMainContent(html);

      return NextResponse.json({ content });
    } catch (error: any) {
      return NextResponse.json(
        { error: `Error fetching URL: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}

/**
 * Extract the main content from an HTML page
 * This is a simple implementation that removes script tags, style tags, and most HTML tags
 * For a production app, you might want to use a more sophisticated HTML parser
 */
function extractMainContent(html: string): string {
  try {
    // Remove script and style tags and their contents
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");

    // Extract content from body tag if possible
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      content = bodyMatch[1];
    }

    // Extract content from main tag if possible (more likely to contain the main content)
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch && mainMatch[1]) {
      content = mainMatch[1];
    }

    // Extract content from article tag if possible (more likely to contain the main content)
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch && articleMatch[1]) {
      content = articleMatch[1];
    }

    // Remove HTML tags but preserve line breaks
    content = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<div[^>]*>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<h[1-6][^>]*>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n");

    // Extract title if possible
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // Extract meta description if possible
    let metaDescription = "";
    const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i);
    if (metaMatch && metaMatch[1]) {
      metaDescription = metaMatch[1].trim();
    }

    // Remove all remaining HTML tags
    content = content.replace(/<[^>]*>/g, " ");

    // Fix spacing issues
    content = content
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n+/g, "\n")
      .trim();

    // Add title and meta description at the beginning if found
    let fullContent = "";
    if (title) {
      fullContent += `Title: ${title}\n\n`;
    }
    if (metaDescription) {
      fullContent += `Meta Description: ${metaDescription}\n\n`;
    }
    fullContent += content;

    return fullContent;
  } catch (error) {
    console.error("Error extracting content:", error);
    return html; // Return original HTML on error
  }
}