import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../../../../lib/db/prisma-client";
import { KeywordService } from "../../../../../../lib/seo/keyword-service";

// Validation schema for keyword research
const researchKeywordsSchema = z.object({
  seed: z.string().min(1, "Seed keyword is required"),
  countryCode: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().optional(),
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

// POST endpoint to perform keyword research
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
    const { hasAccess, message, project } = await checkProjectAccess(projectId, session.user.email);

    if (!hasAccess) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = researchKeywordsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const researchOptions = validationResult.data;

    // If no country code is provided, use the project's target country
    if (!researchOptions.countryCode && project?.targetCountry) {
      researchOptions.countryCode = project.targetCountry;
    }

    // If no language is provided, use the project's target language
    if (!researchOptions.language && project?.targetLanguage) {
      researchOptions.language = project.targetLanguage;
    }

    // Call the keyword research service
    const keywordService = new KeywordService();
    const results = await keywordService.researchKeywords(researchOptions);

    return NextResponse.json({
      seed: researchOptions.seed,
      results,
    });
  } catch (error) {
    console.error("Error researching keywords:", error);
    return NextResponse.json(
      { error: "Failed to research keywords" },
      { status: 500 }
    );
  }
}