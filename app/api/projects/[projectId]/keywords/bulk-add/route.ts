import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth"; 
import { prisma } from "@/lib/db/prisma-client";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizations?: { organizationId: string; role: string }[];
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
    const session = await auth();
    const projectId = params.projectId;

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            users: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this project
    const hasAccess =
      project.organization.users.length > 0 || project.createdById === session.user.id;
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Parse request body
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Keywords array is required" },
        { status: 400 }
      );
    }

    // Process keywords (remove duplicates and validate)
    const uniqueKeywords = [...new Set(keywords)]
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    if (uniqueKeywords.length === 0) {
      return NextResponse.json(
        { error: "No valid keywords provided" },
        { status: 400 }
      );
    }

    // Check for existing keywords to avoid duplicates
    const existingKeywords = await prisma.keyword.findMany({
      where: {
        projectId,
        keyword: { in: uniqueKeywords },
      },
      select: { keyword: true },
    });

    const existingKeywordSet = new Set(
      existingKeywords.map((k) => k.keyword)
    );

    // Filter out keywords that already exist
    const newKeywords = uniqueKeywords.filter(
      (keyword) => !existingKeywordSet.has(keyword)
    );

    if (newKeywords.length === 0) {
      return NextResponse.json(
        { message: "All keywords already exist for this project" },
        { status: 200 }
      );
    }

    // Create new keywords
    const createdKeywords = await prisma.keyword.createMany({
      data: newKeywords.map((keyword) => ({
        projectId,
        keyword,
      })),
    });

    return NextResponse.json({
      message: `Added ${createdKeywords.count} new keywords successfully`,
      count: createdKeywords.count,
    });
  } catch (error) {
    console.error("Error adding keywords:", error);
    return NextResponse.json(
      { error: "Failed to add keywords" },
      { status: 500 }
    );
  }
}
