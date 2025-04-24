import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../../../lib/db/prisma-client";
import { KeywordService } from "../../../../../lib/seo/keyword-service";

// Validation schema for adding keywords
const addKeywordsSchema = z.object({
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  countryCode: z.string().optional(),
  device: z.enum(["desktop", "mobile", "all"]).optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Validation schema for keyword research
const researchKeywordsSchema = z.object({
  seed: z.string().min(1, "Seed keyword is required"),
  countryCode: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().optional(),
});

// Validation schema for updating keywords
const updateKeywordsSchema = z.object({
  keywordIds: z.array(z.string()).min(1, "At least one keyword ID is required"),
  tags: z.array(z.string()).optional(),
  intent: z.string().optional(),
  notes: z.string().optional(),
});

// Validation schema for deleting keywords
const deleteKeywordsSchema = z.object({
  keywordIds: z.array(z.string()).min(1, "At least one keyword ID is required"),
});

// Helper function to check project access
async function checkProjectAccess(projectId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      organizations: {
        include: { organization: true },
      },
    },
  });

  if (!user) {
    return { hasAccess: false, message: "User not found" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { hasAccess: false, message: "Project not found" };
  }

  const organizationIds = user.organizations.map(org => org.organizationId);
  const hasAccess = 
    organizationIds.includes(project.organizationId) || 
    project.createdById === user.id;

  return { 
    hasAccess, 
    message: hasAccess ? "" : "Access denied to this project",
    project,
    user
  };
}

// GET endpoint to fetch keywords for a project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const { hasAccess, message } = await checkProjectAccess(projectId, session.user.email);

    if (!hasAccess) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Get query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const sort = url.searchParams.get("sort") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // Get keywords for project
    const keywordService = new KeywordService();
    const result = await keywordService.getKeywords(projectId, {
      search,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// POST endpoint to add new keywords
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const { hasAccess, message } = await checkProjectAccess(projectId, session.user.email);

    if (!hasAccess) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addKeywordsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const keywordOptions = {
      ...validationResult.data,
      projectId,
    };

    // Add keywords
    const keywordService = new KeywordService();
    const keywordIds = await keywordService.addKeywords(keywordOptions);

    if (keywordIds.length === 0) {
      return NextResponse.json(
        { message: "No new keywords were added. They may already exist." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: `Added ${keywordIds.length} new keywords`,
      keywordIds,
    });
  } catch (error) {
    console.error("Error adding keywords:", error);
    return NextResponse.json(
      { error: "Failed to add keywords" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update keywords
export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const { hasAccess, message } = await checkProjectAccess(projectId, session.user.email);

    if (!hasAccess) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateKeywordsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { keywordIds, ...updateData } = validationResult.data;

    // Verify keywords belong to this project
    const keywords = await prisma.keyword.findMany({
      where: {
        id: { in: keywordIds },
        projectId,
      },
      select: { id: true },
    });

    if (keywords.length !== keywordIds.length) {
      return NextResponse.json(
        { error: "Some keywords do not belong to this project" },
        { status: 400 }
      );
    }

    // Update each keyword
    const keywordService = new KeywordService();
    const updates = await Promise.all(
      keywordIds.map(id => keywordService.updateKeyword(id, updateData))
    );

    return NextResponse.json({
      message: `Updated ${updates.length} keywords`,
      updatedKeywords: updates.map(k => k.id),
    });
  } catch (error) {
    console.error("Error updating keywords:", error);
    return NextResponse.json(
      { error: "Failed to update keywords" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove keywords
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const { hasAccess, message } = await checkProjectAccess(projectId, session.user.email);

    if (!hasAccess) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = deleteKeywordsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { keywordIds } = validationResult.data;

    // Verify keywords belong to this project
    const keywords = await prisma.keyword.findMany({
      where: {
        id: { in: keywordIds },
        projectId,
      },
      select: { id: true },
    });

    if (keywords.length !== keywordIds.length) {
      return NextResponse.json(
        { error: "Some keywords do not belong to this project" },
        { status: 400 }
      );
    }

    // Delete keywords
    const keywordService = new KeywordService();
    const deletedCount = await keywordService.deleteKeywords(keywordIds);

    return NextResponse.json({
      message: `Deleted ${deletedCount} keywords`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting keywords:", error);
    return NextResponse.json(
      { error: "Failed to delete keywords" },
      { status: 500 }
    );
  }
}