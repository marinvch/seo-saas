import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma-client";
import { AuditService } from "@/lib/seo/audit-service";

// URL pattern schema
const urlPatternSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  description: z.string().optional(),
});

// Validation schema for audit creation
const createAuditSchema = z.object({
  siteUrl: z.string().url({ message: "Please enter a valid URL" }),
  maxPages: z.number().int().positive().max(1000).optional(),
  maxDepth: z.number().int().min(1).max(10).optional(),
  includeSitemap: z.boolean().default(true),
  includeRobots: z.boolean().default(true),
  crawlSingleUrl: z.boolean().default(false),
  followPatterns: z.array(urlPatternSchema).optional(),
  ignorePatterns: z.array(urlPatternSchema).optional(),
  userAgent: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Verify project exists and user has access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const organizationIds = user.organizations.map(org => org.organizationId);
    const hasAccess = 
      organizationIds.includes(project.organizationId) || 
      project.createdById === user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAuditSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const auditOptions = validationResult.data;

    // Create the audit
    const auditService = new AuditService();
    const auditId = await auditService.startAudit({
      ...auditOptions,
      projectId,
    });

    return NextResponse.json({ auditId });
  } catch (error: any) {
    console.error("Error creating audit:", error);
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Verify project exists and user has access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const organizationIds = user.organizations.map(org => org.organizationId);
    const hasAccess = 
      organizationIds.includes(project.organizationId) || 
      project.createdById === user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all audits for this project
    const auditService = new AuditService();
    const audits = await auditService.getAuditsForProject(projectId);

    return NextResponse.json(audits);
  } catch (error: any) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}