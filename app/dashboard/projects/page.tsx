"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Loader2, Plus, Settings } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects, selectAllProjects } from '@/store/slices/projects-slice';
import { useToast } from '@/components/ui/use-toast';

export default function ProjectsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const projects = useAppSelector(selectAllProjects);
  const loading = useAppSelector(state => state.projects.loading);
  const error = useAppSelector(state => state.projects.error);
  
  useEffect(() => {
    // Fetch projects when the component mounts
    dispatch(fetchProjects());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (loading) {
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
        
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your projects...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {projects.length === 0 && !loading && (
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