import { prisma } from "@/lib/db/prisma-client";
import { AddKeywordsOptions, KeywordResearchOptions, KeywordResearchResult } from "@/types/keyword-types";

export class KeywordService {
  /**
   * Add keywords to a project for tracking
   */
  public async addKeywords(options: AddKeywordsOptions) {
    const { projectId, keywords, countryCode = "US", device = "all", language = "en", tags = [] } = options;
    
    // Create keyword records
    const createdKeywords = await Promise.all(
      keywords.map(async (keyword) => {
        return await prisma.keyword.create({
          data: {
            keyword: keyword.trim().toLowerCase(),
            projectId,
            countryCode,
            device,
            language,
            tags: tags,
            status: "PENDING",
          }
        });
      })
    );

    // In a real implementation, you'd queue up a background job to fetch initial rankings
    // For now, we'll just return the created keywords
    return createdKeywords;
  }

  /**
   * Get all keywords for a project
   */
  public async getKeywordsForProject(projectId: string) {
    return prisma.keyword.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        rankings: {
          orderBy: { date: 'desc' },
          take: 1,
        }
      }
    });
  }

  /**
   * Get a specific keyword by ID
   */
  public async getKeyword(keywordId: string) {
    return prisma.keyword.findUnique({
      where: { id: keywordId },
      include: {
        rankings: {
          orderBy: { date: 'desc' },
          take: 10,
        }
      }
    });
  }

  /**
   * Perform keyword research based on a seed keyword
   */
  public async researchKeywords(options: KeywordResearchOptions): Promise<KeywordResearchResult[]> {
    const { seed, countryCode = "US", language = "en", limit = 10 } = options;
    
    // In a real implementation, this would call an external API like SEMrush, Ahrefs, etc.
    // For now, let's return mock data
    return this.generateMockResearchResults(seed, limit);
  }

  /**
   * Delete keywords from a project
   */
  public async deleteKeywords(keywordIds: string[]) {
    // Delete associated rankings first
    await prisma.keywordRanking.deleteMany({
      where: {
        keywordId: {
          in: keywordIds
        }
      }
    });
    
    // Then delete the keywords
    return prisma.keyword.deleteMany({
      where: {
        id: {
          in: keywordIds
        }
      }
    });
  }

  /**
   * Generate mock keyword research results (for development purposes)
   */
  private generateMockResearchResults(seed: string, limit: number): KeywordResearchResult[] {
    const prefixes = ["best", "top", "how to", "why", "what is", "where to", "when to", "guide to", "tutorial"];
    const suffixes = ["guide", "tutorial", "service", "tool", "software", "platform", "company", "agency", "solution"];
    const intents = ["informational", "commercial", "transactional", "navigational", "mixed"] as const;
    
    // Generate related keywords based on the seed
    const related: KeywordResearchResult[] = [];
    
    // Add the seed keyword itself
    related.push({
      keyword: seed,
      searchVolume: Math.floor(Math.random() * 10000) + 1000,
      cpc: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
      competition: parseFloat((Math.random()).toFixed(2)),
      difficulty: Math.floor(Math.random() * 100),
      intent: intents[Math.floor(Math.random() * intents.length)]
    });
    
    // Generate variations with prefixes
    for (const prefix of prefixes) {
      if (related.length >= limit) break;
      related.push({
        keyword: `${prefix} ${seed}`,
        searchVolume: Math.floor(Math.random() * 5000) + 100,
        cpc: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
        competition: parseFloat((Math.random()).toFixed(2)),
        difficulty: Math.floor(Math.random() * 100),
        intent: intents[Math.floor(Math.random() * intents.length)]
      });
    }
    
    // Generate variations with suffixes
    for (const suffix of suffixes) {
      if (related.length >= limit) break;
      related.push({
        keyword: `${seed} ${suffix}`,
        searchVolume: Math.floor(Math.random() * 5000) + 100,
        cpc: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
        competition: parseFloat((Math.random()).toFixed(2)),
        difficulty: Math.floor(Math.random() * 100),
        intent: intents[Math.floor(Math.random() * intents.length)]
      });
    }
    
    // Sort by search volume (descending)
    related.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
    
    return related.slice(0, limit);
  }
}