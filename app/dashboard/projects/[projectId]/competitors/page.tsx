"use client";

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjectById, selectSelectedProject } from '@/store/slices/projects-slice';

interface ProjectCompetitorsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectCompetitorsPage({ params }: ProjectCompetitorsPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const project = useAppSelector(selectSelectedProject);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        await dispatch(fetchProjectById(params.projectId)).unwrap();
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [dispatch, params.projectId]);

  // Handle the case where project is not found
  if (!isLoading && !project) {
    notFound();
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/dashboard/projects/${params.projectId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Competitor Analysis</h1>
        <p className="text-muted-foreground">
          {project?.name && `Track and analyze competitors for ${project.name}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading competitors...</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Competitors</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Competitor
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-10">
              No competitors found. Add competitors to start tracking and analyzing their performance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}