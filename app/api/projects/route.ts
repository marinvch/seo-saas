import { prisma } from "../../../lib/db/prisma-client";
import { auth } from "../../../lib/auth/intex";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, url, type, organizationId } = await req.json();

    if (!name || !url || !organizationId) {
      return NextResponse.json(
        { message: "Project name, URL, and organization ID are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if the user has access to the organization
    const userOrganization = await prisma.organizationUser.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    if (!userOrganization) {
      return NextResponse.json(
        { message: "You don't have access to this organization" },
        { status: 403 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        url,
        type: type || "WEBSITE",
        organizationId,
        createdById: session.user.id,
        projectSettings: {
          create: {
            rankTrackingFreq: "WEEKLY",
            autoAuditFrequency: "WEEKLY",
            emailAlerts: true,
          },
        },
      },
      include: {
        projectSettings: true,
      },
    });

    return NextResponse.json(
      {
        project,
        message: "Project created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}