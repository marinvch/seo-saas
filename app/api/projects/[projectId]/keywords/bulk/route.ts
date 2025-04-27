import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';

interface RouteParams {
  projectId: string;
}

// Schema for validating bulk keyword addition
const keywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  volume: z.number().int().nonnegative().optional(),
  difficulty: z.number().min(0).max(100).optional(),
  cpc: z.number().min(0).optional(),
  intent: z.string().optional(),
});

const bulkKeywordSchema = z.object({
  keywords: z.array(keywordSchema),
});

// POST handler to bulk add keywords
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();
    
    // Validate bulk keywords data
    const validatedData = bulkKeywordSchema.parse(data);

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

    // Get existing keywords to avoid duplicates
    const existingKeywords = await prisma.keyword.findMany({
      where: {
        projectId,
      },
      select: {
        keyword: true,
      },
    });
    
    const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));

    // Filter out duplicates
    const newKeywords = validatedData.keywords.filter(
      k => !existingKeywordSet.has(k.keyword.toLowerCase())
    );

    if (newKeywords.length === 0) {
      return NextResponse.json(
        { error: 'All keywords already exist for this project' },
        { status: 409 }
      );
    }

    // Create the new keywords
    const createdKeywords = await prisma.$transaction(
      newKeywords.map(keyword => 
        prisma.keyword.create({
          data: {
            ...keyword,
            projectId,
          },
        })
      )
    );

    return NextResponse.json(createdKeywords, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid keyword data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating keywords in bulk:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
});