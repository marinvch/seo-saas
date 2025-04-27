import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, BarChart2, Search, Users } from 'lucide-react';

interface ProjectDashboardPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      projectSettings: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <Button asChild>
            <Link href={`/dashboard/projects/${project.id}/audits`}>View Audits</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">{project.url}</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href={`/dashboard/projects/${project.id}`} className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overview</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Project dashboard and key metrics</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/dashboard/projects/${project.id}/settings`} className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Configure project preferences</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/dashboard/projects/${project.id}/keywords`} className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keywords</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Track keyword rankings</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/dashboard/projects/${project.id}/competitors`} className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Monitor competitor performance</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Overview Content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}