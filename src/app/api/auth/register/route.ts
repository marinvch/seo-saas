import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create slug from name
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-");
    const uniqueSuffix = Date.now().toString().slice(-4);
    const organizationSlug = `${baseSlug}-${uniqueSuffix}`;

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "AGENCY_OWNER",
        },
      });

      // Create organization for the user
      const organization = await tx.organization.create({
        data: {
          name: `${name}'s Agency`,
          slug: organizationSlug,
          users: {
            create: {
              userId: user.id,
              role: "AGENCY_OWNER",
            },
          },
        },
      });

      // Create default branding settings
      await tx.brandingSettings.create({
        data: {
          organizationId: organization.id,
        },
      });

      // Create free trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          plan: "FREE",
          status: "TRIAL",
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
          trialEnd,
        },
      });

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: result.user.id,
        organizationId: result.organization.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}