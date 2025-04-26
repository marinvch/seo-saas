import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma-client";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const { name, slug } = json;

    if (!name || !slug) {
      return new NextResponse("Name and slug are required", { status: 400 });
    }

    // Check if organization with slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return new NextResponse("Organization with this slug already exists", {
        status: 400,
      });
    }

    // Create organization and link user as owner
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        users: {
          create: {
            userId: session.user.id,
            role: Role.AGENCY_OWNER,
          },
        },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      where: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}