import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { SiteAuditor } from '@/lib/crawler/site-auditor';
import { z } from 'zod';

interface RouteParams {
  projectId: string;
}

// Schema for audit request validation
const auditRequestSchema = z.object({
  maxDepth: z.number().min(1).max(10).optional(),
  emulateDevice: z.enum(['desktop', 'mobile']).optional(),
  includeScreenshots: z.boolean().optional(),
  respectRobotsTxt: z.boolean().optional().default(true),
});

// POST handler to start a new audit
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();

    // Validate request data
    const validatedData = auditRequestSchema.parse(data);

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

    // Check if there's already an active audit
    const existingAudit = await prisma.siteAudit.findFirst({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingAudit) {
      return NextResponse.json(
        { error: 'An audit is already in progress for this project' },
        { status: 409 }
      );
    }

    // Create new audit record
    const audit = await prisma.siteAudit.create({
      data: {
        projectId,
        siteUrl: project.url,
        status: 'PENDING',
        startedAt: new Date(),
        options: validatedData,
        issuesSummary: {},  // Will be populated when audit completes
      },
    });

    // Start the audit process asynchronously
    const auditor = new SiteAuditor({
      startUrl: project.url,
      ...validatedData,
    });

    // Run audit in background
    auditor.start().then(async (result) => {
      // Update audit record with results
      await prisma.siteAudit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalPages: result.pagesAnalyzed,
          issuesSummary: result.issues,
          pageResults: result.pages,
        },
      });

      // Create audit history record
      await prisma.auditHistory.create({
        data: {
          projectId,
          auditId: audit.id,
          totalPages: result.pagesAnalyzed,
          issuesSummary: result.issues,
        },
      });
    }).catch(async (error) => {
      // Update audit record with error
      await prisma.siteAudit.update({
        where: { id: audit.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });
    });

    return NextResponse.json(audit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error starting site audit:', error);
    return NextResponse.json(
      { error: 'Failed to start site audit' },
      { status: 500 }
    );
  }
});

// GET handler to retrieve audit status and results
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

    // Get latest audit
    const audit = await prisma.siteAudit.findFirst({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'No audits found for this project' },
        { status: 404 }
      );
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit' },
      { status: 500 }
    );
  }
});