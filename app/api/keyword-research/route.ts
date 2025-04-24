import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";

// Rate limiting variables (in-memory for simplicity, use Redis in production)
const RATE_LIMIT = 5; // Maximum requests per window
const WINDOW_SIZE = 60 * 1000; // 1 minute in milliseconds
const ipRequestRecord: Record<string, { count: number; resetAt: number }> = {};

/**
 * POST handler for keyword research API
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
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
    ipRequestRecord[clientIp].count += 1;
    
    // Parse request body
    const { query, country } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }
    
    // For demo purposes, generate mock data
    // In production, integrate with a real keyword research API
    const mockKeywords = generateMockKeywordData(query);
    
    return NextResponse.json({
      query,
      country: country || "global",
      results: mockKeywords
    });
    
  } catch (error) {
    console.error("Keyword research error:", error);
    return NextResponse.json(
      { error: "Failed to process keyword research request" },
      { status: 500 }
    );
  }
}

/**
 * Generate mock keyword data for demonstration
 */
function generateMockKeywordData(query: string) {
  const baseKeywords = [
    `${query}`,
    `best ${query}`,
    `${query} online`,
    `cheap ${query}`,
    `${query} near me`,
    `how to ${query}`,
    `${query} service`,
    `${query} company`,
    `${query} software`,
    `${query} tools`,
  ];
  
  return baseKeywords.map(keyword => ({
    keyword,
    volume: Math.floor(Math.random() * 10000) + 100,
    difficulty: Math.random() * 100,
    cpc: parseFloat((Math.random() * 5).toFixed(2)),
    competition: Math.random(),
  }));
}