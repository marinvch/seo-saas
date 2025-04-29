import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';

interface RouteParams {
  projectId: string;
}

// Schema for validating keyword creation/update
const keywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  volume: z.number().int().nonnegative().optional(),
  difficulty: z.number().min(0).max(100).optional(),
  cpc: z.number().min(0).optional(),
  intent: z.string().optional(),
});

// GET handler to list all keywords for a project
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

    // Fetch keywords for the project
    const keywords = await prisma.keyword.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
});

// POST handler to create a new keyword
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();
    
    // Validate keyword data
    const validatedData = keywordSchema.parse(data);

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

    // Check if keyword already exists for this project
    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        projectId,
        keyword: validatedData.keyword,
      },
    });

    if (existingKeyword) {
      return NextResponse.json(
        { error: 'Keyword already exists for this project' },
        { status: 409 }
      );
    }

    // Create the new keyword
    const keyword = await prisma.keyword.create({
      data: {
        ...validatedData,
        projectId,
      },
    });

    return NextResponse.json(keyword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid keyword data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
});