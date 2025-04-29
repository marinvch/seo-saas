import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';

interface RouteParams {
  projectId: string;
  keywordId: string;
}

// Schema for validating keyword updates
const keywordUpdateSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100).optional(),
  volume: z.number().int().nonnegative().optional(),
  difficulty: z.number().min(0).max(100).optional(),
  cpc: z.number().min(0).optional(),
  intent: z.string().optional(),
});

// Helper function to verify project access
async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        users: {
          some: {
            userId,
          },
        },
      },
    },
  });

  return !!project;
}

// GET handler to fetch a specific keyword
export const GET = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, keywordId } = params;

    // Verify user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, req.auth.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch the keyword
    const keyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
      },
      include: {
        rankTracking: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(keyword);
  } catch (error) {
    console.error('Error fetching keyword:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword' },
      { status: 500 }
    );
  }
});

// PATCH handler to update a keyword
export const PATCH = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, keywordId } = params;
    const data = await req.json();
    
    // Validate update data
    const validatedData = keywordUpdateSchema.parse(data);

    // Verify user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, req.auth.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check if keyword exists
    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
      },
    });

    if (!existingKeyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // If updating keyword text, check for duplicates
    if (validatedData.keyword && validatedData.keyword !== existingKeyword.keyword) {
      const duplicateKeyword = await prisma.keyword.findFirst({
        where: {
          projectId,
          keyword: validatedData.keyword,
          id: { not: keywordId },  // Exclude current keyword
        },
      });

      if (duplicateKeyword) {
        return NextResponse.json(
          { error: 'Another keyword with this text already exists for this project' },
          { status: 409 }
        );
      }
    }

    // Update the keyword
    const updatedKeyword = await prisma.keyword.update({
      where: {
        id: keywordId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedKeyword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid keyword data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating keyword:', error);
    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
});

// DELETE handler to remove a keyword
export const DELETE = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, keywordId } = params;

    // Verify user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, req.auth.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check if keyword exists
    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
      },
    });

    if (!existingKeyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Delete the keyword (cascade will also delete associated rankings)
    await prisma.keyword.delete({
      where: {
        id: keywordId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
});