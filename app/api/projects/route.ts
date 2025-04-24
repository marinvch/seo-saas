import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle GET requests to /api/projects
export const GET = withApiAuth(async (req: NextRequest, { params }, token) => {
  try {
    const userId = token.sub;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    
    // Fetch projects with filtering
    let projects;
    if (organizationId) {
      // Fetch projects for a specific organization
      projects = await prisma.project.findMany({
        where: {
          organizationId: organizationId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else {
      // Fetch all projects the user has access to through their organizations
      projects = await prisma.project.findMany({
        where: {
          organization: {
            users: {
              some: {
                userId,
              },
            },
          },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
});

// Handle POST requests to /api/projects
export const POST = withApiAuth(async (req: NextRequest, { params }, token) => {
  try {
    const userId = token.sub;
    const body = await req.json();
    
    // Validate required fields
    const { name, url, type, organizationId } = body;
    if (!name || !url || !type || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, type, and organizationId are required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to the organization
    const userOrganization = await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    
    if (!userOrganization) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }
    
    // Create new project
    const project = await prisma.project.create({
      data: {
        name,
        url,
        type: type,
        organizationId,
        createdById: userId,
        targetCountry: body.targetCountry,
        targetLanguage: body.targetLanguage,
      },
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
});