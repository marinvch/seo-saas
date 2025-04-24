"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-form";

export default function NewProjectPage() {
  const router = useRouter();
  const [hasOrganization, setHasOrganization] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const response = await fetch("/api/user/organizations");
        const data = await response.json();
        setHasOrganization(data.organizations?.length > 0);
      } catch (error) {
        console.error("Failed to check organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOrganization();
  }, []);

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create New Project</h1>
        </div>
      </div>

      {!hasOrganization ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-semibold">Organization Required</h2>
            <p className="text-muted-foreground">
              You need to select or create an organization before you can create a project.
              Projects must belong to an organization. Please create a new organization to continue.
            </p>
            <div className="flex justify-center pt-4">
              <CreateOrganizationDialog onSuccess={() => setHasOrganization(true)} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <CreateProjectForm />
      )}
    </div>
  );
}