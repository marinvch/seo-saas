import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
          { error: "Failed to fetch URL" },
          { status: response.status }
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
      const content = extractMainContent(html);

      return NextResponse.json({
        url,
        content,
        fullHtml: html,
      });
    } catch (error) {
      console.error("Error fetching page content:", error);
      return NextResponse.json(
        { error: "Failed to fetch page content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
  // Remove scripts, styles, and comments
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                   .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                   .replace(/<!--[\s\S]*?-->/g, ' ');
  
  // Extract text from body
  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(content);
  if (bodyMatch && bodyMatch[1]) {
    content = bodyMatch[1];
  }
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  return content;
}