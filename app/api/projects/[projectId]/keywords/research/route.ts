import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db/prisma-client";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface RouteParams {
  projectId: string;
}

// Schema for validating keyword research requests
const keywordResearchSchema = z.object({
  seed: z.string().min(1, "Seed keyword is required").max(100),
});

// POST handler for keyword research
export const POST = withApiAuth(
  async (req: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { projectId } = params;
      const data = await req.json();

      // Validate input data
      const validatedData = keywordResearchSchema.parse(data);

      // Verify user has access to this project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organization: {
            users: {
              some: {
                userId: req.auth.userId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
          targetCountry: true,
          targetLanguage: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }

      // Get existing keywords for this project to avoid suggesting duplicates
      const existingKeywords = await prisma.keyword.findMany({
        where: {
          projectId,
        },
        select: {
          keyword: true,
        },
      });

      const existingKeywordTexts = existingKeywords.map((k) => k.keyword);

      // Prepare the prompt for Gemini
      const prompt = `Generate 25 SEO keyword suggestions based on the seed keyword "${
        validatedData.seed
      }" for a ${project.type.toLowerCase()} website at ${project.url}.
    ${project.targetCountry ? `Target country: ${project.targetCountry}.` : ""}
    ${
      project.targetLanguage
        ? `Target language: ${project.targetLanguage}.`
        : ""
    }
    
    Please format the response as a JSON array of objects, each containing:
    - keyword (string): The suggested keyword phrase
    - volume (number): Estimated monthly search volume (simulated number between 10-10000)
    - difficulty (number): Keyword difficulty score (0-100)
    - cpc (number): Estimated cost per click in USD (0.1-20.0)
    - intent (string): Search intent (informational, navigational, transactional, commercial)
    
    Please exclude these existing keywords: ${existingKeywordTexts.join(", ")}
    
    Example format:
    [
      {
        "keyword": "example keyword",
        "volume": 1500,
        "difficulty": 45,
        "cpc": 1.25,
        "intent": "informational"
      }
    ]`;

      // Use Gemini AI to generate keyword suggestions
      let suggestions;
      try {
        const response = await model.generateContent(prompt);
        const textResponse = response.response.text();

        // Extract JSON from the response
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("Failed to extract JSON from AI response");
        }

        suggestions = JSON.parse(jsonMatch[0]);
      } catch (aiError) {
        console.error("AI Error:", aiError);

        // Fallback to mock data if AI fails
        suggestions = generateMockKeywordSuggestions(
          validatedData.seed,
          existingKeywordTexts
        );
      }

      return NextResponse.json(suggestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input data", details: error.errors },
          { status: 400 }
        );
      }

      console.error("Error generating keyword suggestions:", error);
      return NextResponse.json(
        { error: "Failed to generate keyword suggestions" },
        { status: 500 }
      );
    }
  }
);

// Function to generate mock keyword suggestions when AI is not available
function generateMockKeywordSuggestions(
  seedKeyword: string,
  existingKeywords: string[]
) {
  const baseKeywords = [
    `best ${seedKeyword}`,
    `${seedKeyword} guide`,
    `how to use ${seedKeyword}`,
    `${seedKeyword} tutorial`,
    `${seedKeyword} tips`,
    `${seedKeyword} examples`,
    `${seedKeyword} vs`,
    `alternative to ${seedKeyword}`,
    `${seedKeyword} comparison`,
    `${seedKeyword} review`,
    `buy ${seedKeyword}`,
    `${seedKeyword} cost`,
    `${seedKeyword} price`,
    `${seedKeyword} online`,
    `affordable ${seedKeyword}`,
    `professional ${seedKeyword}`,
    `${seedKeyword} near me`,
    `top ${seedKeyword}`,
    `${seedKeyword} service`,
    `${seedKeyword} benefits`,
  ];

  // Filter out existing keywords
  const filteredKeywords = baseKeywords.filter(
    (keyword) => !existingKeywords.includes(keyword)
  );

  // Generate random mock data for each keyword
  return filteredKeywords.map((keyword) => ({
    keyword,
    volume: Math.floor(Math.random() * 9990) + 10, // 10-10000
    difficulty: Math.floor(Math.random() * 100), // 0-100
    cpc: parseFloat((Math.random() * 19.9 + 0.1).toFixed(2)), // 0.1-20.0
    intent: ["informational", "navigational", "transactional", "commercial"][
      Math.floor(Math.random() * 4)
    ],
  }));
}
