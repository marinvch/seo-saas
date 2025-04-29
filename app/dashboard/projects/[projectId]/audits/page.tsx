import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PrismaClient } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditHistory, AuditHistorySkeleton } from "@/components/audits/audit-history";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { AuditHistoryEntry } from "@/types/audit";

const prisma = new PrismaClient();

interface PageProps {
  params: {
    projectId: string;
  };
}

async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: true,
    },
  });

  if (!project) return null;

  // Check if user has access to this project
  const hasAccess = await prisma.organizationUser.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
    },
  });

  if (!hasAccess) return null;

  return project;
}

async function getAuditHistory(projectId: string): Promise<AuditHistoryEntry[]> {
  const audits = await prisma.auditHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return audits.map(audit => {
    // Make sure to cast the issuesSummary to the correct type
    const issuesSummaryObj = audit.issuesSummary as any;
    
    return {
      id: audit.auditId,
      projectId,
      date: audit.createdAt.toISOString(),
      totalPages: audit.totalPages,
      issuesSummary: {
        critical: issuesSummaryObj?.critical || 0,
        warning: issuesSummaryObj?.warning || 0,
        info: issuesSummaryObj?.info || 0,
        total: issuesSummaryObj?.total || 0
      }
    };
  });
}

export default async function ProjectAuditsPage({ params }: PageProps) {
  const { projectId } = params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return notFound();
  }

  const project = await getProject(projectId, session.user.id);

  if (!project) {
    return notFound();
  }

  const auditHistory = await getAuditHistory(projectId);

  return (
    <div className="container py-4 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader>
          <PageHeaderHeading>Site Audits</PageHeaderHeading>
          <PageHeaderDescription>
            Run comprehensive SEO audits and track your site's progress over time
          </PageHeaderDescription>
        </PageHeader>

        <Button asChild className="ml-auto">
          <Link href={`/dashboard/projects/${projectId}/audits/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Audits</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <AuditHistory audits={auditHistory} projectId={projectId} />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-6">
          <Card className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Scheduled Audits</h3>
            <p className="text-muted-foreground mb-4">
              Set up automatic audits to run on a schedule. This feature is coming soon.
            </p>
            <Button variant="outline" disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Set Up Schedule
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
