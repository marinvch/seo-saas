import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db/prisma-client";
import { z } from "zod";
import { AuditStatus } from "@prisma/client";
import { startSiteAudit } from "@/lib/crawler/site-auditor";
import type { SiteAuditConfig } from "@/types/audit";

const auditConfigSchema = z.object({
  startUrl: z.string().url(),
  maxDepth: z.number().min(1).max(10),
  emulateDevice: z.enum(["desktop", "mobile"]),
  respectRobotsTxt: z.boolean(),
  includeScreenshots: z.boolean(),
  skipExternal: z.boolean(),
  maxRequestsPerCrawl: z.number().min(10).max(500),
  maxConcurrency: z.number().min(1).max(10),
  includeSitemap: z.boolean(),
  projectId: z.string().optional(),
});

export const POST = withApiAuth(async (req: NextRequest) => {
  try {
    const data = await req.json();
    const validatedConfig = auditConfigSchema.parse(data);
    
    // Separate config from projectId for type safety
    const { projectId, ...auditConfig } = validatedConfig;

    // Create base audit data
    const auditData = {
      siteUrl: auditConfig.startUrl,
      status: "PENDING" as AuditStatus,
      options: auditConfig,
      issuesSummary: {
        critical: 0,
        warning: 0,
        info: 0,
        total: 0,
      },
    };

    // Add projectId if provided
    const createData = projectId 
      ? { ...auditData, projectId }
      : auditData;

    // Create audit record
    const audit = await prisma.siteAudit.create({
      data: createData,
    });

    // Start the audit process asynchronously
    startSiteAudit(audit.id, auditConfig as SiteAuditConfig).catch((error: Error) => {
      console.error(`Failed to start audit ${audit.id}:`, error);
      // Update audit status to failed
      prisma.siteAudit.update({
        where: { id: audit.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      }).catch(console.error);
    });

    return NextResponse.json({
      auditId: audit.id,
      message: "Audit started successfully",
    });
  } catch (error) {
    console.error("Error starting audit:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start audit" },
      { status: 500 }
    );
  }
});
