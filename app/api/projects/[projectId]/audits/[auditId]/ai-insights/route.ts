import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma-client";
import { GeminiService } from "@/lib/ai/gemini-service";

export async function GET(
  request: NextRequest,
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

    // Verify audit exists and user has access
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
      include: {
        project: {
          include: {
            organization: {
              include: {
                users: {
                  where: {
                    userId: session.user.id
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (audit.project.id !== projectId) {
      return NextResponse.json(
        { error: "Audit does not belong to the specified project" },
        { status: 400 }
      );
    }

    // Check if user has access to the project's organization
    if (audit.project.organization.users.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Initialize AI service
    const gemini = new GeminiService();

    // Get AI insights based on audit data
    const insights = await gemini.getAuditInsights({
      auditId: auditId,
      siteUrl: audit.siteUrl,
      issuesSummary: audit.issuesSummary as any,
      pageResults: audit.pageResults as any,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}