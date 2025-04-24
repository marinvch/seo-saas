import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth/intex"; // Try default import if authOptions is the default export
import { prisma } from "@/lib/db/prisma-client";

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

// Add session type declaration
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(auth);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;

    // Check if project exists and user has access
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

    const { keywords } = await request.json();

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Keywords array is required" },
        { status: 400 }
      );
    }

    // Process each keyword and prepare for bulk insert
    const keywordsToCreate = keywords.map((keyword) => ({
      projectId,
      keyword: keyword.keyword,
      volume: keyword.volume || null,
      difficulty: keyword.difficulty || null,
      cpc: keyword.cpc || null,
      intent: keyword.intent || null,
    }));

    // Create all keywords in a single transaction
    const result = await prisma.keyword.createMany({
      data: keywordsToCreate,
      skipDuplicates: true, // Skip if keyword already exists in project
    });

    return NextResponse.json({
      success: true,
      data: {
        added: result.count,
        total: keywords.length,
      },
    });
  } catch (error: any) {
    console.error("Bulk add keywords error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add keywords" },
      { status: 500 }
    );
  }
}
