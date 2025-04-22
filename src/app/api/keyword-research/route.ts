import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GeminiService } from "@/lib/ai/gemini-service";

// Rate limiter configuration
const RATE_LIMIT = 10; // 10 requests per window
const WINDOW_SIZE = 60 * 60 * 1000; // 1 hour
const ipRequestRecord: Record<string, { count: number; resetAt: number }> = {};

/**
 * POST handler for keyword research API
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    // Initialize or reset expired records
    if (!ipRequestRecord[clientIp] || ipRequestRecord[clientIp].resetAt < now) {
      ipRequestRecord[clientIp] = { count: 0, resetAt: now + WINDOW_SIZE };
    }
    
    // Check if rate limit exceeded
    if (ipRequestRecord[clientIp].count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }
    
    // Increment request count
    ipRequestRecord[clientIp].count++;

    // Parse request body
    const body = await request.json();
    const { query, country, projectId } = body;

    // Validate request
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid request: query is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Invalid request: projectId is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini service
    const geminiService = new GeminiService();

    // Generate keyword suggestions
    const results = await geminiService.generateKeywordSuggestions(
      query,
      country || "global"
    );

    // Return keyword suggestions
    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("Keyword research API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate keyword suggestions",
        message: error.message
      },
      { status: 500 }
    );
  }
}