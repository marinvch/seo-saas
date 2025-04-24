import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma-client";
import { analyzeSEO } from "@/lib/ai/gemini-client";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  url: z.string().url(),
  content: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetMarket: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projectId = params.projectId;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { organization: { include: { users: true } } },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Check if user has access to the project
    const hasAccess = project.organization.users.some(
      (user) => user.userId === session.user.id
    );
    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = analyzeRequestSchema.parse(body);

    const analysis = await analyzeSEO(validatedData);

    // Store the analysis results
    await prisma.onPageAnalysis.create({
      data: {
        projectId,
        url: validatedData.url,
        score: analysis.score,
        recommendations: analysis.recommendations as any,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error in SEO analysis:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}