import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';

interface RouteParams {
  projectId: string;
  keywordId: string;
}

// GET handler to fetch ranking history for a specific keyword
export const GET = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, keywordId } = params;
    
    // Optional query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const searchEngine = url.searchParams.get('searchEngine') || 'google';

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

    // Verify the keyword exists and belongs to this project
    const keyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
      },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Fetch the ranking history
    const rankings = await prisma.rankTracking.findMany({
      where: {
        keywordId,
        searchEngine,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching keyword rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword rankings' },
      { status: 500 }
    );
  }
});

// POST handler to add a new ranking entry
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, keywordId } = params;
    const data = await req.json();
    
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

    // Verify the keyword exists and belongs to this project
    const keyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
      },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Get the previous rank for comparison
    const lastRankEntry = await prisma.rankTracking.findFirst({
      where: {
        keywordId,
        searchEngine: data.searchEngine || 'google',
      },
      orderBy: {
        date: 'desc',
      },
    });

    const previousRank = lastRankEntry?.rank || null;
    const currentRank = data.rank !== undefined ? data.rank : null;
    
    // Calculate change
    let change = null;
    if (previousRank !== null && currentRank !== null) {
      change = previousRank - currentRank; // Positive means improved ranking
    }

    // Create new rank tracking entry
    const rankEntry = await prisma.rankTracking.create({
      data: {
        keywordId,
        projectId,
        rank: currentRank,
        previousRank,
        change,
        url: data.url || null,
        searchEngine: data.searchEngine || 'google',
        date: new Date(),
      },
    });

    return NextResponse.json(rankEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding keyword ranking:', error);
    return NextResponse.json(
      { error: 'Failed to add keyword ranking' },
      { status: 500 }
    );
  }
});