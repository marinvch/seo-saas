import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';
import { AuditScheduler } from '@/lib/services/audit-scheduler';

interface RouteParams {
  projectId: string;
}

// Schema for validating schedule creation/update
const scheduleSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  isActive: z.boolean().default(true),
  options: z.object({
    maxDepth: z.number().min(1).max(10).optional(),
    emulateDevice: z.enum(['desktop', 'mobile']).optional(),
    includeScreenshots: z.boolean().optional(),
    respectRobotsTxt: z.boolean().optional(),
  }),
});

// GET handler to list schedules
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

    // Get all schedules for this project
    const schedules = await prisma.auditSchedule.findMany({
      where: { projectId },
      orderBy: { nextRunAt: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching audit schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit schedules' },
      { status: 500 }
    );
  }
});

// POST handler to create new schedule
export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();

    // Validate input data
    const validatedData = scheduleSchema.parse(data);

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

    // Calculate initial next run time
    const nextRunAt = new Date();
    switch (validatedData.frequency) {
      case 'DAILY':
        nextRunAt.setDate(nextRunAt.getDate() + 1);
        break;
      case 'WEEKLY':
        nextRunAt.setDate(nextRunAt.getDate() + 7);
        break;
      case 'MONTHLY':
        nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        break;
    }

    // Create new schedule
    const schedule = await prisma.auditSchedule.create({
      data: {
        projectId,
        frequency: validatedData.frequency,
        isActive: validatedData.isActive,
        options: validatedData.options,
        nextRunAt,
      },
    });

    // Initialize the schedule in the scheduler
    if (validatedData.isActive) {
      const scheduler = AuditScheduler.getInstance();
      await scheduler.initialize();
    }

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating audit schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create audit schedule' },
      { status: 500 }
    );
  }
});