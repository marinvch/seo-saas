import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Plus, Settings } from 'lucide-react';
import { prisma } from '@/lib/db/prisma-client';
import { authOptions } from '@/lib/auth/auth';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Get user's organization projects
  const projects = await prisma.project.findMany({
    where: {
      organization: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      projectSettings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{project.name}</span>
                <Link
                  href={`/dashboard/projects/${project.id}/settings`}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Globe className="mr-2 h-4 w-4" />
                <span className="truncate">{project.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/projects/${project.id}/audits`}>
                    View Audits
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    Manage Project
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your first project to start tracking your SEO performance.
              </p>
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}