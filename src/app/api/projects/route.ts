import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma-client";

// Validation schema
const projectSchema = z.object({
  name: z.string().min(3),
  url: z.string().url(),
  type: z.enum(["WEBSITE", "BLOG", "ECOMMERCE", "SOCIAL_MEDIA"]),
  targetCountry: z.string().optional(),
  targetLanguage: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
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

    // Get organization (assuming user has at least one organization)
    // In a more complete implementation, you might want to select which org to create the project in
    if (user.organizations.length === 0) {
      return NextResponse.json(
        { error: "No organization found. Please create an organization first." },
        { status: 400 }
      );
    }

    const organizationId = user.organizations[0].organizationId;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = projectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, url, type, targetCountry, targetLanguage } = validationResult.data;

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        url,
        type: type as any, // Cast to Prisma enum type
        targetCountry,
        targetLanguage,
        organizationId,
        createdById: user.id,
      },
    });

    // Also create default project settings
    await prisma.projectSettings.create({
      data: {
        projectId: project.id,
        rankTrackingFreq: "WEEKLY",
        autoAuditFrequency: "WEEKLY",
        emailAlerts: true,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}