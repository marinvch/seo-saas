import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';
import { AuditScheduler } from '@/lib/services/audit-scheduler';

interface RouteParams {
  projectId: string;
  scheduleId: string;
}

// Schema for validating schedule updates
const scheduleUpdateSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  isActive: z.boolean().optional(),
  options: z.object({
    maxDepth: z.number().min(1).max(10).optional(),
    emulateDevice: z.enum(['desktop', 'mobile']).optional(),
    includeScreenshots: z.boolean().optional(),
    respectRobotsTxt: z.boolean().optional(),
  }).optional(),
});

// PATCH handler to update schedule
export const PATCH = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, scheduleId } = params;
    const data = await req.json();

    // Validate input data
    const validatedData = scheduleUpdateSchema.parse(data);

    // Verify user has access to this project and schedule
    const schedule = await prisma.auditSchedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
        project: {
          organization: {
            users: {
              some: {
                userId: req.auth.userId,
              },
            },
          },
        },
      },
      include: {
        project: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate new next run time if frequency is changing
    let nextRunAt = schedule.nextRunAt;
    if (validatedData.frequency && validatedData.frequency !== schedule.frequency) {
      nextRunAt = new Date();
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
    }

    // Update schedule
    const updatedSchedule = await prisma.auditSchedule.update({
      where: { id: scheduleId },
      data: {
        ...validatedData,
        nextRunAt,
      },
    });

    // Update the scheduler
    const scheduler = AuditScheduler.getInstance();
    const scheduleConfig = {
      id: scheduleId,
      projectId,
      frequency: updatedSchedule.frequency.toLowerCase() as 'daily' | 'weekly' | 'monthly',
      nextRunAt: updatedSchedule.nextRunAt.toISOString(),
      isActive: updatedSchedule.isActive,
      options: updatedSchedule.options as Record<string, any> || {}
    };

    if (validatedData.isActive !== undefined) {
      if (validatedData.isActive) {
        await scheduler.createOrUpdateSchedule(scheduleConfig);
      } else {
        await scheduler.deleteSchedule(scheduleId);
      }
    } else if (validatedData.frequency || validatedData.options) {
      await scheduler.createOrUpdateSchedule(scheduleConfig);
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating audit schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update audit schedule' },
      { status: 500 }
    );
  }
});

// DELETE handler to remove schedule
export const DELETE = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId, scheduleId } = params;

    // Verify user has access to this project and schedule
    const schedule = await prisma.auditSchedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
        project: {
          organization: {
            users: {
              some: {
                userId: req.auth.userId,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      );
    }

    // Delete schedule
    await prisma.auditSchedule.delete({
      where: { id: scheduleId },
    });

    // Remove from scheduler
    const scheduler = AuditScheduler.getInstance();
    await scheduler.deleteSchedule(scheduleId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting audit schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete audit schedule' },
      { status: 500 }
    );
  }
});