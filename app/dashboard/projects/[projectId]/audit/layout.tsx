import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma-client';

interface AuditLayoutProps {
  children: React.ReactNode;
  params: {
    projectId: string;
  };
}

export default async function AuditLayout({ children, params }: AuditLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Verify user has access to this project
  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      organization: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      organization: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="border-b">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium">
              {project.name} - Site Audit
            </h2>
            <span className="text-sm text-muted-foreground">
              {project.organization.name}
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}