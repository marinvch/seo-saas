import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma-client";
import { auth } from "@/lib/auth";
import { GeminiService } from "@/lib/ai/gemini-service";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string; auditId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, auditId } = params;

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get the audit data
    const audit = await prisma.siteAudit.findUnique({
      where: {
        id: auditId,
        projectId,
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (audit.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Audit not yet completed" },
        { status: 400 }
      );
    }

    // Check if we already have cached insights
    const cachedInsights = audit.aiInsights as any;
    
    if (cachedInsights && cachedInsights.timestamp) {
      const cacheAge = Date.now() - new Date(cachedInsights.timestamp).getTime();
      // Use cached insights if they're less than 24 hours old
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ insights: cachedInsights });
      }
    }

    // Generate new insights with Gemini AI
    const geminiService = new GeminiService();
    const insights = await geminiService.getAuditInsights(audit);
    
    // Add timestamp to insights
    const insightsWithTimestamp = {
      ...insights,
      timestamp: new Date().toISOString(),
    };

    // Cache the insights in the audit record
    await prisma.siteAudit.update({
      where: { id: auditId },
      data: { aiInsights: insightsWithTimestamp },
    });

    return NextResponse.json({ insights: insightsWithTimestamp });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}