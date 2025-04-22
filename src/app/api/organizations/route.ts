import { prisma } from "@/lib/db/prisma-client";
import { auth } from "@/lib/auth";
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

    const { name, slug, website, description } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { message: "Organization name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { message: "Organization slug already exists" },
        { status: 400 }
      );
    }

    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        logo: null, // Add default logo later if needed
        users: {
          create: {
            userId: session.user.id,
            role: "AGENCY_OWNER", // This user becomes the owner
          }
        },
        ...(website && { website }),
        brandingSettings: {
          create: {
            // Default branding settings
            primaryColor: "#3b82f6",
            secondaryColor: "#10b981",
            accentColor: "#f59e0b",
            whitelabelReports: false,
            emailTemplates: false,
            clientPortal: false,
          }
        },
        subscription: {
          create: {
            plan: "TRIAL",
            status: "TRIAL",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          }
        }
      },
      include: {
        users: true,
        brandingSettings: true,
        subscription: true,
      }
    });

    return NextResponse.json(
      {
        organization,
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Organization creation error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}