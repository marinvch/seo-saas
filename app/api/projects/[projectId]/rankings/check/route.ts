import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';
import { checkKeywordRankings } from '@/lib/crawler/rank-tracker';

interface RouteParams {
  projectId: string;
}

// Schema for validating ranking check requests
const checkRankingsSchema = z.object({
  keywordIds: z.array(z.string()).optional(),
  searchEngine: z.string().default('google'),
});

// POST handler for triggering keyword ranking checks
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();

    console.log('Received ranking check request:', { projectId, data });

    // Validate input data
    const validatedData = checkRankingsSchema.parse(data);

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
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Project found, checking keywords');

    // Get keywords to check - either the ones specified or all project keywords
    const keywordsQuery: any = { 
      where: { 
        projectId,
        ...(validatedData.keywordIds?.length ? { id: { in: validatedData.keywordIds } } : {})
      },
      take: 10, // Limit to prevent overloading (reduced from 25)
    };

    const keywords = await prisma.keyword.findMany(keywordsQuery);

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'No keywords found to check rankings' },
        { status: 400 }
      );
    }
    
    console.log(`Found ${keywords.length} keywords to check rankings for`);
    
    // Check keyword rankings using the crawler service
    const rankingResults = await checkKeywordRankings({
      projectUrl: project.url,
      keywords: keywords.map(k => ({ 
        id: k.id, 
        keyword: k.keyword 
      })),
      searchEngine: validatedData.searchEngine,
      maxPages: 3, // Limit pages to check for faster results
    }).catch(error => {
      console.error('Error checking keyword rankings:', error);
      throw new Error(`Rank checking failed: ${error.message}`);
    });

    console.log(`Successfully checked rankings for ${rankingResults.length} keywords`);

    // Store the results in the database
    const storedRankings = await Promise.all(
      rankingResults.map(async (result) => {
        // Get the previous rank for this keyword (if any)
        const previousRanking = await prisma.rankTracking.findFirst({
          where: {
            keywordId: result.keywordId,
            projectId,
          },
          orderBy: {
            date: 'desc',
          },
          select: {
            rank: true,
          },
        });

        // Calculate the change in ranking
        const previousRank = previousRanking?.rank || null;
        const change = result.rank !== null && previousRank !== null
          ? previousRank - result.rank
          : null;

        // Store the new ranking
        return prisma.rankTracking.create({
          data: {
            projectId,
            keywordId: result.keywordId,
            rank: result.rank,
            previousRank,
            change,
            url: result.url,
            searchEngine: validatedData.searchEngine,
          },
          include: {
            keyword: {
              select: {
                keyword: true,
              },
            },
          },
        });
      })
    );

    // Transform the data for response
    const transformedRankings = storedRankings.map((rank) => ({
      id: rank.id,
      projectId: rank.projectId,
      keywordId: rank.keywordId,
      rank: rank.rank,
      previousRank: rank.previousRank,
      change: rank.change,
      url: rank.url,
      date: rank.date.toISOString(),
      searchEngine: rank.searchEngine,
      keyword: rank.keyword.keyword,
    }));

    console.log('Successfully stored ranking results');

    return NextResponse.json(transformedRankings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error checking keyword rankings:', error);
    return NextResponse.json(
      { error: `Failed to check keyword rankings: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
});