import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GeminiService } from "@/lib/ai/gemini-service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { url, pageContent, keywords } = await req.json();

    if (!url || !pageContent || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "URL, page content, and keywords are required" },
        { status: 400 }
      );
    }

    // Initialize Gemini service
    const geminiService = new GeminiService();

    // Get content optimization suggestions
    const suggestions = await geminiService.getContentOptimizationSuggestions(
      url,
      pageContent,
      keywords
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error analyzing content:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}