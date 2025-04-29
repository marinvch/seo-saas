import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { PrismaClient } from '@prisma/client';
import { AuditProgressData } from '@/types/audit';

const prisma = new PrismaClient();

/**
 * GET /api/audit/progress - Get progress information for an ongoing audit
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

    // Map database status to API status
    let status: 'pending' | 'in_progress' | 'completed' | 'failed';
    switch (audit.status) {
      case 'PENDING':
        status = 'pending';
        break;
      case 'IN_PROGRESS':
        status = 'in_progress';
        break;
      case 'COMPLETED':
        status = 'completed';
        break;
      case 'FAILED':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    // Format the response
    const progressData: AuditProgressData = {
      auditId: audit.id,
      status,
      progress: audit.progressPercentage || 0,
      pagesDiscovered: audit.totalPages || 0,
      pagesProcessed: audit.totalPages || 0,
      error: audit.errorMessage || undefined
    };

    return NextResponse.json(progressData);
  } catch (error) {
    console.error('Error retrieving audit progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit progress' },
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