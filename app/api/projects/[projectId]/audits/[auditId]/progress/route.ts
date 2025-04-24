import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma-client";

// GET audit progress
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; auditId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, auditId } = params;

    // First, get the user with their organizations
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        organizations: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get organizations the user belongs to
    const organizationIds = user.organizations.map(org => org.organizationId);

    // Check if project exists and if user has access to it
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { organizationId: { in: organizationIds } },
          { createdById: user.id },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get audit progress
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Calculate progress based on status
    let progress = 0;
    switch (audit.status) {
      case 'PENDING':
        progress = 5;
        break;
      case 'IN_PROGRESS':
        // If there's a stored progress, use it; otherwise estimate based on pages crawled
        progress = audit.progressPercentage || Math.min(Math.floor((audit.totalPages / (audit.options as any).maxPages) * 100), 95);
        break;
      case 'COMPLETED':
        progress = 100;
        break;
      case 'FAILED':
        progress = 0;
        break;
    }

    return NextResponse.json({
      status: audit.status,
      progress,
      totalPages: audit.totalPages,
      error: audit.errorMessage || undefined,
    });
  } catch (error) {
    console.error("Error fetching audit progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit progress" },
      { status: 500 }
    );
  }
}