import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { PrismaClient } from '@prisma/client';
import { AuditResult } from '@/types/audit';

const prisma = new PrismaClient();

/**
 * GET /api/audit - Retrieve audit details
 */
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audit ID from query params
    const searchParams = request.nextUrl.searchParams;
    const auditId = searchParams.get('auditId');
    
    if (!auditId) {
      return NextResponse.json({ error: 'Missing auditId parameter' }, { status: 400 });
    }

    // Fetch the audit
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
      include: {
        project: {
          select: {
            createdById: true,
            organizationId: true
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Check if user has access to this audit (via project)
    const userHasAccess = await checkUserAccessToProject(
      session.user.id, 
      audit.project.organizationId, 
      audit.projectId
    );

    if (!userHasAccess) {
      return NextResponse.json({ error: 'You do not have access to this audit' }, { status: 403 });
    }

    // Format the response
    const result: AuditResult = {
      id: audit.id,
      projectId: audit.projectId,
      siteUrl: audit.siteUrl,
      startedAt: audit.startedAt.toISOString(),
      completedAt: audit.completedAt ? audit.completedAt.toISOString() : '',
      pagesAnalyzed: audit.totalPages,
      // Fix the type issue by properly handling pageResults - ensure it has issues or provide empty array
      issues: (typeof audit.pageResults === 'object' && audit.pageResults !== null) 
        ? (audit.pageResults as any).issues || []
        : [],
      // Fix the type issue with issuesSummary
      issuesSummary: audit.issuesSummary as any,
      // Make htmlReport undefined instead of null to satisfy the type
      htmlReport: audit.htmlReport || undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrieving audit:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/audit - Cancel an audit
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audit ID from query params
    const searchParams = request.nextUrl.searchParams;
    const auditId = searchParams.get('auditId');
    
    if (!auditId) {
      return NextResponse.json({ error: 'Missing auditId parameter' }, { status: 400 });
    }

    // Fetch the audit
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
      include: {
        project: {
          select: {
            createdById: true,
            organizationId: true
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Check if user has access to this audit (via project)
    const userHasAccess = await checkUserAccessToProject(
      session.user.id, 
      audit.project.organizationId, 
      audit.projectId
    );

    if (!userHasAccess) {
      return NextResponse.json({ error: 'You do not have access to this audit' }, { status: 403 });
    }

    // Only allow cancellation of pending or in-progress audits
    if (audit.status !== 'PENDING' && audit.status !== 'IN_PROGRESS') {
      return NextResponse.json({ 
        error: 'Only pending or in-progress audits can be cancelled' 
      }, { status: 400 });
    }

    // Update the audit status to failed
    await prisma.siteAudit.update({
      where: { id: auditId },
      data: {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
        completedAt: new Date()
      }
    });

    // In a real implementation, you would also cancel any running crawler jobs

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling audit:', error);
    return NextResponse.json(
      { error: 'Failed to cancel audit' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if a user has access to a project
 */
async function checkUserAccessToProject(
  userId: string, 
  organizationId: string, 
  projectId: string
): Promise<boolean> {
  // Check if user is the creator of the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      createdById: userId
    }
  });

  if (project) {
    return true;
  }

  // Check if user is a member of the organization
  const orgMember = await prisma.organizationUser.findFirst({
    where: {
      organizationId,
      userId
    }
  });

  return !!orgMember;
}