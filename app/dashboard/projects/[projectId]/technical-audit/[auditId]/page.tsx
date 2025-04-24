import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "../../../../../../lib/db/prisma-client";
import AuditSummary from "../../../../../../components/audit/audit-summary";
import AuditClientWrapper from "./client-wrapper";
import { Metadata } from "next";

interface AuditPageProps {
  params: {
    projectId: string;
    auditId: string;
  };
}

export async function generateMetadata({ params }: AuditPageProps): Promise<Metadata> {
  const { audit, project } = await getAuditAndProject(params.projectId, params.auditId);
  
  if (!audit || !project) {
    return {
      title: "Audit Not Found | SEO SaaS",
      description: "The requested audit could not be found.",
    };
  }
  
  return {
    title: `Technical Audit for ${project.name} | SEO SaaS`,
    description: `SEO audit results and analysis for ${project.name}`,
  };
}

async function getAuditAndProject(projectId: string, auditId: string) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return { audit: null, project: null };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organizations: {
        include: { organization: true },
      },
    },
  });

  if (!user) {
    return { audit: null, project: null };
  }

  const organizationIds = user.organizations.map(org => org.organizationId);

  // Get project and check if user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { audit: null, project: null };
  }

  // Check if user has access to this project
  const hasAccess = 
    organizationIds.includes(project.organizationId) || 
    project.createdById === user.id;

  if (!hasAccess) {
    return { audit: null, project: null };
  }

  // Get audit
  const audit = await prisma.siteAudit.findUnique({
    where: {
      id: auditId,
      projectId: projectId,
    },
  });

  if (!audit) {
    return { audit: null, project };
  }

  return { audit, project };
}

export default async function AuditPage({ params }: AuditPageProps) {
  const { audit, project } = await getAuditAndProject(params.projectId, params.auditId);
  
  if (!audit || !project) {
    notFound();
  }
  
  // Transform DB audit object to match component props
  // The actual data structure may vary based on your DB schema
  const auditData = {
    id: audit.id,
    projectId: audit.projectId,
    siteUrl: audit.siteUrl,
    status: audit.status,
    startedAt: audit.startedAt,
    completedAt: audit.completedAt || undefined,
    totalPages: audit.totalPages,
    options: audit.options as any, // Include required options
    pageResults: audit.pageResults as any,
    issuesSummary: audit.issuesSummary as any, // This should be parsed from JSON if stored as JSONB
    htmlReport: audit.htmlReport || undefined,
    progressPercentage: audit.progressPercentage !== undefined ? audit.progressPercentage : undefined,
    errorMessage: audit.errorMessage || undefined
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <AuditClientWrapper initialAudit={auditData} />
    </div>
  );
}