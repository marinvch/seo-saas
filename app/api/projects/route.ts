import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(3),
  url: z.string().url(),
  type: z.enum(['WEBSITE', 'BLOG', 'ECOMMERCE', 'SOCIAL_MEDIA']),
  targetCountry: z.string().min(2).optional(),
  targetLanguage: z.string().min(2).optional(),
  organizationId: z.string().uuid(),
});

export const POST = withApiAuth(async (req: NextRequest) => {
  try {
    const data = await req.json();
    const validatedData = projectSchema.parse(data);
    const session = req.auth;

    // Verify user has access to the organization
    const userOrg = await prisma.organizationUser.findFirst({
      where: { 
        userId: session.userId,
        organizationId: validatedData.organizationId,
      },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        type: validatedData.type,
        targetCountry: validatedData.targetCountry,
        targetLanguage: validatedData.targetLanguage,
        organizationId: validatedData.organizationId,
        createdById: session.userId,
      },
    });

    // Create default project settings
    await prisma.projectSettings.create({
      data: {
        projectId: project.id,
        rankTrackingFreq: 'WEEKLY',
        autoAuditFrequency: 'WEEKLY',
        emailAlerts: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid project data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
});

export const GET = withApiAuth(async (req: NextRequest) => {
  try {
    const session = req.auth;
    const searchParams = new URL(req.url).searchParams;
    const organizationId = searchParams.get('organizationId');

    // Get user's organization projects
    const projects = await prisma.project.findMany({
      where: {
        organizationId: organizationId || undefined,
        organization: {
          users: {
            some: {
              userId: session.userId,
            },
          },
        },
      },
      include: {
        projectSettings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
});