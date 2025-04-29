import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { PrismaClient } from '@prisma/client';
import { simulateAudit } from '@/lib/services/audit-service';

const prisma = new PrismaClient();

/**
 * POST /api/audit/start - Start a new audit or process a queued audit
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal request (from scheduler) or user request
    const data = await request.json();
    const { auditId, projectId, options } = data;

    // If auditId is provided, this is an internal request to process a queued audit
    if (auditId) {
      // Update the audit status
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: { 
          status: 'IN_PROGRESS',
          progressPercentage: 0
        }
      });

      // Start the audit process asynchronously
      // In a production environment, this would be handled by a separate worker
      simulateAudit(auditId).catch(error => {
        console.error(`Error in audit simulation for ${auditId}:`, error);
      });

      return NextResponse.json({ success: true, auditId });
    } 
    // Otherwise, this is a user request to create a new audit
    else {
      // Check authorization for user requests
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
      }

      // Fetch the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organization: true
        }
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if user has access to this project
      const userHasAccess = await checkUserAccessToProject(
        session.user.id, 
        project.organizationId, 
        projectId
      );

      if (!userHasAccess) {
        return NextResponse.json({ error: 'You do not have access to this project' }, { status: 403 });
      }

      // Create the audit
      const audit = await prisma.siteAudit.create({
        data: {
          projectId,
          siteUrl: project.url,
          status: 'PENDING',
          options: options || {},
          issuesSummary: {
            critical: 0,
            warning: 0,
            info: 0,
            total: 0
          }
        }
      });

      // Queue the audit for processing (in a production system this would go to a job queue)
      // For now, we'll start it directly
      simulateAudit(audit.id).catch(error => {
        console.error(`Error in audit simulation for ${audit.id}:`, error);
      });

      return NextResponse.json({ 
        success: true, 
        auditId: audit.id 
      });
    }
  } catch (error) {
    console.error('Error starting audit:', error);
    return NextResponse.json(
      { error: 'Failed to start audit' },
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
