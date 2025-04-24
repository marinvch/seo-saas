import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma-client";
import NewAuditForm from "../../components/audit/new-audit-form";
import { Metadata } from "next";

interface NewAuditPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: NewAuditPageProps): Promise<Metadata> {
  const project = await getProject(params.projectId);
  
  if (!project) {
    return {
      title: "Project Not Found | SEO SaaS",
      description: "The requested project could not be found.",
    };
  }
  
  return {
    title: `New Technical Audit for ${project.name} | SEO SaaS`,
    description: `Configure and start a new technical SEO audit for ${project.name}.`,
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

export default async function NewAuditPage({ params }: NewAuditPageProps) {
  const project = await getProject(params.projectId);
  
  if (!project) {
    notFound();
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">New Technical Audit</h1>
      <p className="mb-6 text-muted-foreground">
        Configure the settings for your website audit. The audit will analyze your website for SEO issues and provide recommendations for improvement.
      </p>
      <NewAuditForm projectId={project.id} projectUrl={project.url} />
    </div>
  );
}