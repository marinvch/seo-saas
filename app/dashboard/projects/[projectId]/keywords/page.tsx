"use client";

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjectById, selectSelectedProject } from '@/store/slices/projects-slice';

interface ProjectKeywordsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectKeywordsPage({ params }: ProjectKeywordsPageProps) {
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
        
        <h1 className="text-3xl font-bold mb-2">Keyword Tracking</h1>
        <p className="text-muted-foreground">
          {project?.name && `Track and monitor keywords for ${project.name}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading keywords...</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Keywords</CardTitle>
            <Button>Add Keywords</Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-10">
              No keywords found. Add keywords to start tracking your rankings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}