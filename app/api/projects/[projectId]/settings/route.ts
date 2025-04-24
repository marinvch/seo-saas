import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { z } from 'zod';

interface RouteParams {
  projectId: string;
}

const projectSettingsSchema = z.object({
  rankTrackingFreq: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  autoAuditFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  emailAlerts: z.boolean(),
  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
});

export const PATCH = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;
    const data = await req.json();
    const validatedData = projectSettingsSchema.parse(data);

    // Update project settings
    const settings = await prisma.projectSettings.update({
      where: { projectId },
      data: validatedData,
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project settings' },
      { status: 500 }
    );
  }
});

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
  try {
    const { projectId } = params;

    const settings = await prisma.projectSettings.findUnique({
      where: { projectId },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Project settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project settings' },
      { status: 500 }
    );
  }
});