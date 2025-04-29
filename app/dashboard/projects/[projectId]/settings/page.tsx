import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PrismaClient } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Fix imports by using explicit imports from each file
import { 
  PageHeader, 
  PageHeaderDescription, 
  PageHeaderHeading 
} from "@/components/page-header";
import { ProjectGeneralSettings } from "@/components/projects/project-general-settings";
import { ProjectAuditSettings } from "@/components/projects/project-audit-settings";
import { ProjectIntegrationSettings } from "@/components/projects/project-integration-settings";
import { ProjectTeamSettings } from "@/components/projects/project-team-settings";
import { ProjectDangerZone } from "@/components/projects/project-danger-zone";

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
      projectSettings: true,
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

export default async function ProjectSettingsPage({ params }: PageProps) {
  const { projectId } = params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return notFound();
  }

  const project = await getProject(projectId, session.user.id);

  if (!project) {
    return notFound();
  }

  // Get project settings or create default settings object
  const settings = project.projectSettings || {
    id: "",
    projectId: project.id,
    rankTrackingFreq: "WEEKLY",
    autoAuditFrequency: "WEEKLY",
    emailAlerts: true,
    slackWebhookUrl: null,
    integrations: null,
  };

  return (
    <div className="container py-4 md:py-8 space-y-6">
      <PageHeader>
        <PageHeaderHeading>Project Settings</PageHeaderHeading>
        <PageHeaderDescription>
          Configure your project settings and integrations
        </PageHeaderDescription>
      </PageHeader>

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="audit">Audit Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <ProjectGeneralSettings project={project} />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <ProjectAuditSettings projectId={projectId} settings={settings} />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6">
          <ProjectIntegrationSettings projectId={projectId} settings={settings} />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <ProjectTeamSettings projectId={projectId} organizationId={project.organizationId} />
        </TabsContent>
        <TabsContent value="danger" className="mt-6">
          <ProjectDangerZone projectId={projectId} projectName={project.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}