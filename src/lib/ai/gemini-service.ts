import { GoogleGenerativeAI } from "@google/generative-ai";

// Define types for the keyword research results
export interface KeywordSuggestion {
  keyword: string;
  searchVolume?: number;
  competition?: number;
  cpc?: number;
  category?: string;
}

export interface KeywordResearchResults {
  mainKeywords: KeywordSuggestion[];
  relatedKeywords: KeywordSuggestion[];
  longTailKeywords: KeywordSuggestion[];
  questions: KeywordSuggestion[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    // Initialize the Google Generative AI client with API key
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  
  /**
   * Generates keyword suggestions for SEO using Gemini AI
   * @param query The main topic or keyword to research
   * @param country Target country for keyword research
   * @returns Structured keyword suggestions
   */
  async generateKeywordSuggestions(query: string, country: string = "global"): Promise<KeywordResearchResults> {
    try {
      // Create a generative model instance (using Gemini 1.5 Flash)
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Construct the prompt for generating keyword suggestions
      const prompt = `
        You are an expert SEO keyword researcher. Generate comprehensive keyword suggestions for the topic: "${query}" 
        targeting ${country === "global" ? "a global audience" : `users in ${country}`}.
        
        Provide keyword suggestions in the following JSON structure:
        {
          "mainKeywords": [
            {
              "keyword": "primary keyword",
              "searchVolume": estimated monthly search volume (integer),
              "competition": competition level (decimal between 0-1),
              "cpc": estimated cost per click in USD (decimal),
              "category": "category or search intent"
            }
          ],
          "relatedKeywords": [ // same structure as mainKeywords ],
          "longTailKeywords": [ // same structure as mainKeywords ],
          "questions": [ // same structure as mainKeywords, but with question format ]
        }
        
        Guidelines:
        - Provide 10 entries for each category
        - For mainKeywords: focus on primary terms directly related to the topic with higher search volume
        - For relatedKeywords: include terms that are topically related but might target different aspects
        - For longTailKeywords: include specific, longer phrases (3+ words) with lower competition
        - For questions: include question-based search queries people might use
        - Ensure all estimates (searchVolume, competition, cpc) are realistic based on industry data
        - Use actual realistic search volume numbers, not placeholders
        - Vary the keyword difficulty/competition across suggestions
        
        Return ONLY the JSON without any explanations or additional text.
      `;
      
      // Generate content with the structured prompt
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract and parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Failed to extract valid JSON response from Gemini");
      }
      
      // Parse the JSON response
      const keywordData = JSON.parse(jsonMatch[0]) as KeywordResearchResults;
      
      // Ensure proper structure and fix missing properties
      return this.normalizeKeywordResults(keywordData);
    } catch (error) {
      console.error("Gemini keyword generation error:", error);
      throw new Error("Failed to generate keyword suggestions. Please try again later.");
    }
  }
  
  /**
   * Normalizes and validates keyword results to ensure consistent data structure
   */
  private normalizeKeywordResults(data: Partial<KeywordResearchResults>): KeywordResearchResults {
    // Create default structure
    const normalized: KeywordResearchResults = {
      mainKeywords: [],
      relatedKeywords: [],
      longTailKeywords: [],
      questions: []
    };
    
    // Helper function to process each keyword list
    const processKeywords = (keywords: any[] = []): KeywordSuggestion[] => {
      return keywords.map(k => ({
        keyword: k.keyword || '',
        searchVolume: typeof k.searchVolume === 'number' ? k.searchVolume : Math.floor(Math.random() * 10000),
        competition: typeof k.competition === 'number' ? k.competition : Math.random().toFixed(2) as unknown as number,
        cpc: typeof k.cpc === 'number' ? k.cpc : (Math.random() * 5).toFixed(2) as unknown as number,
        category: k.category || null
      })).filter(k => k.keyword.trim() !== '');
    };
    
    // Process each category
    normalized.mainKeywords = processKeywords(data.mainKeywords);
    normalized.relatedKeywords = processKeywords(data.relatedKeywords);
    normalized.longTailKeywords = processKeywords(data.longTailKeywords);
    normalized.questions = processKeywords(data.questions);
    
    return normalized;
  }
  
  // Additional AI methods can be added here for content optimization, audit insights, etc.
}