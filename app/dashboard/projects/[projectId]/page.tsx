import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma-client";
import ProjectDetails from "../../../../components/projects/project-details";

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProject(params.projectId);
  
  if (!project) {
    return {
      title: "Project Not Found | SEO SaaS",
      description: "The requested project could not be found.",
    };
  }
  
  return {
    title: `${project.name} | SEO SaaS`,
    description: `SEO details and analysis for ${project.name}`,
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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.projectId);
  
  if (!project) {
    notFound();
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-8">
      <ProjectDetails project={project} />
    </div>
  );
}