import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

interface SEOAnalysisInput {
  url: string;
  content?: string;
  keywords?: string[];
  targetMarket?: string;
}

interface SEOAnalysisResult {
  score: number;
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'content' | 'technical' | 'performance' | 'keywords';
    actionItems: string[];
  }[];
  insights: string[];
}

export async function analyzeSEO(input: SEOAnalysisInput): Promise<SEOAnalysisResult> {
  const prompt = generateSEOPrompt(input);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the structured response
    return parseSEOAnalysis(text);
  } catch (error) {
    console.error("Error generating SEO analysis:", error);
    throw new Error("Failed to generate SEO analysis");
  }
}

function generateSEOPrompt(input: SEOAnalysisInput): string {
  return `Analyze the following webpage from an SEO perspective:

URL: ${input.url}
${input.content ? `Content: ${input.content}\n` : ''}
${input.keywords ? `Target Keywords: ${input.keywords.join(', ')}\n` : ''}
${input.targetMarket ? `Target Market: ${input.targetMarket}\n` : ''}

Please provide a detailed SEO analysis including:
1. Overall SEO score (0-100)
2. Specific recommendations with priority levels and action items
3. Key insights about the content and its optimization

Format the response as a structured JSON object with the following schema:
{
  "score": number,
  "recommendations": [{
    "title": string,
    "description": string,
    "priority": "high" | "medium" | "low",
    "category": "content" | "technical" | "performance" | "keywords",
    "actionItems": string[]
  }],
  "insights": string[]
}`;
}

function parseSEOAnalysis(text: string): SEOAnalysisResult {
  try {
    // Clean up the response text to ensure it's valid JSON
    const jsonStr = text.substring(
      text.indexOf('{'),
      text.lastIndexOf('}') + 1
    );
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing SEO analysis:", error);
    throw new Error("Failed to parse SEO analysis result");
  }
}