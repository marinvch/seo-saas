import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuditService } from "@/lib/seo/audit-service";
import { prisma } from "@/lib/db/prisma-client";
import { AuditStatus } from "@prisma/client";

const auditService = new AuditService();

// GET single audit
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
        email: session.user.email || "",
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

    // Get the audit
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

// PUT (update) existing audit
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; auditId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, auditId } = params;
    const body = await request.json();

    // First, get the user with their organizations
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        organizations: {
          include: {
            organization: true,
          }
        },
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

    // Check if the audit exists and belongs to the project
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Update the audit
    const updatedAudit = await auditService.updateAudit(auditId, body);

    return NextResponse.json(updatedAudit);
  } catch (error) {
    console.error("Error updating audit:", error);
    return NextResponse.json(
      { error: "Failed to update audit", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE an audit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; auditId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, auditId } = params;

    // First, get the user with their organizations
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        organizations: {
          include: {
            organization: true,
          }
        },
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

    // Check if the audit exists and belongs to the project
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Delete the audit
    await auditService.deleteAudit(auditId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting audit:", error);
    return NextResponse.json(
      { error: "Failed to delete audit" },
      { status: 500 }
    );
  }
}

// POST to restart an audit
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; auditId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, auditId } = params;
    const body = await request.json();
    const { action } = body;

    // First, get the user with their organizations
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        organizations: {
          include: {
            organization: true,
          }
        },
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

    // Check if the audit exists and belongs to the project
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (action === "restart") {
      // Restart the audit
      const restartedAudit = await auditService.restartAudit(auditId);
      return NextResponse.json(restartedAudit);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing audit action:", error);
    return NextResponse.json(
      { error: "Failed to process audit action" },
      { status: 500 }
    );
  }
}