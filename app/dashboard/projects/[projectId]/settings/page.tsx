"use client";

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { ProjectSettingsForm } from '@/components/projects/project-settings-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjectById, selectSelectedProject } from '@/store/slices/projects-slice';

interface ProjectSettingsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
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
        
        <h1 className="text-3xl font-bold mb-2">Project Settings</h1>
        <p className="text-muted-foreground">
          {project?.name && `Configure settings for ${project.name}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading project settings...</p>
        </div>
      ) : project && project.projectSettings ? (
        <ProjectSettingsForm 
          projectId={project.id} 
          initialSettings={project.projectSettings} 
        />
      ) : (
        <div className="p-4 border rounded-md bg-amber-50 text-amber-800">
          Settings not found for this project. Please try refreshing the page.
        </div>
      )}
    </div>
  );
}