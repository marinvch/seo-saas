import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

/**
 * Analyze page content and provide SEO recommendations and insights
 * @param input SEO analysis input data
 * @returns Structured SEO analysis with score, recommendations and insights
 */
export async function analyzeSEOContent(input: SEOAnalysisInput): Promise<SEOAnalysisResult> {
  try {
    const prompt = `
      Act as an expert SEO analyst. Analyze the following content for SEO optimization and provide detailed recommendations.
      
      URL: ${input.url}
      ${input.content ? `Content: ${input.content}` : ''}
      ${input.keywords?.length ? `Target Keywords: ${input.keywords.join(', ')}` : ''}
      ${input.targetMarket ? `Target Market: ${input.targetMarket}` : ''}
      
      Provide a comprehensive SEO analysis with the following:
      1. An overall SEO score from 0-100
      2. At least 5 specific recommendations with descriptions and action items
      3. Key insights about content quality, readability, and keyword usage
      
      Return the results in valid JSON format as follows:
      {
        "score": number,
        "recommendations": [
          {
            "title": "string",
            "description": "string",
            "priority": "high"|"medium"|"low",
            "category": "content"|"technical"|"performance"|"keywords",
            "actionItems": ["string"]
          }
        ],
        "insights": ["string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1] || jsonMatch[2];
      return JSON.parse(jsonContent) as SEOAnalysisResult;
    }
    
    throw new Error("Failed to parse JSON response from Gemini");
  } catch (error) {
    console.error("Error in Gemini SEO analysis:", error);
    throw new Error(`Failed to analyze content with Gemini API: ${(error as Error).message}`);
  }
}

/**
 * Generate content suggestions based on keywords and target audience
 * @param topic Main topic for content
 * @param keywords Target keywords to include
 * @param targetAudience Description of the target audience
 * @returns Content suggestions including titles, outlines and meta descriptions
 */
export async function generateContentSuggestions(
  topic: string,
  keywords: string[],
  targetAudience: string
) {
  try {
    const prompt = `
      Act as an expert SEO content strategist. Generate content suggestions for the following:
      
      Topic: ${topic}
      Target Keywords: ${keywords.join(', ')}
      Target Audience: ${targetAudience}
      
      Provide the following:
      1. 5 SEO-optimized article titles that would rank well
      2. A detailed content outline for the best title option
      3. 3 meta description options under 155 characters
      
      Return the results in valid JSON format as follows:
      {
        "titles": ["string"],
        "bestOutline": {
          "title": "string",
          "sections": [
            {
              "heading": "string",
              "subpoints": ["string"]
            }
          ]
        },
        "metaDescriptions": ["string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1] || jsonMatch[2];
      return JSON.parse(jsonContent);
    }
    
    throw new Error("Failed to parse JSON response from Gemini");
  } catch (error) {
    console.error("Error in Gemini content suggestions:", error);
    throw new Error(`Failed to generate content suggestions: ${(error as Error).message}`);
  }
}

/**
 * Analyze keyword data and provide recommendations
 * @param keywords List of keywords to analyze
 * @param websiteNiche Website industry/niche
 * @param competitors Array of competitor websites
 * @returns Keyword analysis and recommendations
 */
export async function analyzeKeywords(
  keywords: string[],
  websiteNiche: string,
  competitors: string[] = []
) {
  try {
    const prompt = `
      Act as an expert SEO keyword analyst. Analyze the following keywords for a website in the ${websiteNiche} niche.
      
      Keywords: ${keywords.join(', ')}
      ${competitors.length > 0 ? `Competitors: ${competitors.join(', ')}` : ''}
      
      Provide the following analysis:
      1. Group keywords by search intent (informational, navigational, commercial, transactional)
      2. Identify the most valuable keywords to focus on
      3. Suggest additional related keywords that might be valuable
      4. Recommend content types for different keyword groups
      
      Return the results in valid JSON format.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1] || jsonMatch[2];
      return JSON.parse(jsonContent);
    }
    
    throw new Error("Failed to parse JSON response from Gemini");
  } catch (error) {
    console.error("Error in Gemini keyword analysis:", error);
    throw new Error(`Failed to analyze keywords: ${(error as Error).message}`);
  }
}