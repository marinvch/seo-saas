import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma-client";
import { ZodError, z } from "zod";

// Schema for validating audit schedule input
const auditScheduleSchema = z.object({
  isActive: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
});

// Calculate the next run date based on frequency
function calculateNextRunDate(frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  const nextRun = new Date();
  
  // Set to a reasonable time for running audits (e.g., 2 AM)
  nextRun.setHours(2, 0, 0, 0);
  
  switch (frequency) {
    case 'daily':
      // Start tomorrow
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      // Start next week
      nextRun.setDate(now.getDate() + (now.getHours() >= 2 ? 7 : 1));
      break;
    case 'monthly':
      // Start next month, same day
      nextRun.setMonth(now.getMonth() + 1);
      break;
  }
  
  return nextRun;
}

// GET: Retrieve audit schedule for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { projectId } = params;
    
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
    
    // Check project exists and user has access
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
    
    // Get audit schedule
    const schedule = await prisma.auditSchedule.findFirst({
      where: {
        projectId,
      },
    });
    
    if (!schedule) {
      return NextResponse.json({
        message: "No schedule found for this project",
      }, { status: 404 });
    }
    
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error getting audit schedule:", error);
    return NextResponse.json({ error: "Failed to get audit schedule" }, { status: 500 });
  }
}

// POST: Create a new audit schedule
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { projectId } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = auditScheduleSchema.parse(body);
    
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
    
    // Check project exists and user has access
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
    
    // Calculate next run date
    const nextRunAt = validatedData.isActive 
      ? calculateNextRunDate(validatedData.frequency)
      : new Date(); // Placeholder date if not active
    
    // Create default audit options
    const defaultOptions = {
      projectId,
      siteUrl: project.websiteUrl,
      maxPages: 100,
      maxDepth: 3,
      includeSitemap: true,
      includeRobots: true
    };
    
    // Create schedule
    const schedule = await prisma.auditSchedule.create({
      data: {
        projectId,
        frequency: validatedData.frequency,
        isActive: validatedData.isActive,
        nextRunAt,
        options: defaultOptions,
      },
    });
    
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating audit schedule:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to create audit schedule" }, { status: 500 });
  }
}

// PUT: Update an existing audit schedule
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { projectId } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = auditScheduleSchema.parse(body);
    
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
    
    // Check project exists and user has access
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
    
    // Check if schedule exists
    const existingSchedule = await prisma.auditSchedule.findFirst({
      where: {
        projectId,
      },
    });
    
    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    
    // Calculate next run date if active and frequency changed or activated
    const recalculateNextRun = validatedData.isActive && 
      (existingSchedule.frequency !== validatedData.frequency || !existingSchedule.isActive);
    
    // Update schedule
    const updatedSchedule = await prisma.auditSchedule.update({
      where: {
        id: existingSchedule.id,
      },
      data: {
        frequency: validatedData.frequency,
        isActive: validatedData.isActive,
        ...(recalculateNextRun && { nextRunAt: calculateNextRunDate(validatedData.frequency) }),
      },
    });
    
    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating audit schedule:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update audit schedule" }, { status: 500 });
  }
}

// DELETE: Remove an audit schedule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { projectId } = params;
    
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
    
    // Check project exists and user has access
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
    
    // Delete schedule
    await prisma.auditSchedule.deleteMany({
      where: {
        projectId,
      },
    });
    
    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit schedule:", error);
    return NextResponse.json({ error: "Failed to delete audit schedule" }, { status: 500 });
  }
}