import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma-client";
import AuditHistory from "@/components/audit/audit-history";
import AuditScheduleForm from "@/components/audit/audit-schedule-form";

interface TechnicalAuditPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: TechnicalAuditPageProps): Promise<Metadata> {
  const project = await getProject(params.projectId);
  
  if (!project) {
    return {
      title: "Project Not Found | SEO SaaS",
      description: "The requested project could not be found.",
    };
  }
  
  return {
    title: `Technical Audit - ${project.name} | SEO SaaS`,
    description: `SEO technical audit tools and history for ${project.name}`,
  };
}

async function getProject(projectId: string) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return null;
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
    return null;
  }

  const organizationIds = user.organizations.map(org => org.organizationId);

  // Get project and check if user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return null;
  }

  // Check if user has access to this project
  const hasAccess = 
    organizationIds.includes(project.organizationId) || 
    project.createdById === user.id;

  if (!hasAccess) {
    return null;
  }

  return project;
}

async function getAuditSchedule(projectId: string) {
  try {
    const schedule = await prisma.auditSchedule.findFirst({
      where: { projectId },
    });
    
    return schedule;
  } catch (error) {
    console.error("Error fetching audit schedule:", error);
    return null;
  }
}

export default async function TechnicalAuditPage({ params }: TechnicalAuditPageProps) {
  const project = await getProject(params.projectId);
  
  if (!project) {
    notFound();
  }
  
  // Get the audit schedule if it exists
  const schedule = await getAuditSchedule(params.projectId);
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Technical Audit</h1>
        <p className="text-muted-foreground">
          Run technical SEO audits for {project.name} and view past results
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AuditHistory projectId={params.projectId} />
        </div>
        
        <div>
          <AuditScheduleForm 
            projectId={params.projectId} 
            currentSchedule={schedule ? {
              id: schedule.id,
              frequency: schedule.frequency as 'daily' | 'weekly' | 'monthly',
              isActive: schedule.isActive,
              nextRunAt: schedule.nextRunAt,
              lastRunAt: schedule.lastRunAt || undefined,
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
}