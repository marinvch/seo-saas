import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';

interface RouteParams {
  projectId: string;
}

// GET handler to retrieve ranking data for a project
export const GET = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;

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

    // Get keywords for this project
    const keywords = await prisma.keyword.findMany({
      where: { projectId },
      select: {
        id: true,
        keyword: true,
      },
    });

    // Get the latest ranking data for each keyword
    const rankings = await prisma.rankTracking.findMany({
      where: {
        projectId,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        keyword: {
          select: {
            keyword: true,
          },
        },
      },
    });

    // Transform the data to include keyword text
    const transformedRankings = rankings.map((rank) => ({
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

    return NextResponse.json(transformedRankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
});