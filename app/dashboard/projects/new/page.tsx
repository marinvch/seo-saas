"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-form";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUserOrganizations } from "@/store/slices/user-slice";

export default function NewProjectPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { organizations, loading, error } = useAppSelector((state) => state.user);

  // Load organizations when the component mounts
  useEffect(() => {
    dispatch(fetchUserOrganizations());
  }, [dispatch]);

  // Show loading state
  if (loading) {
    return (
      <div className="container max-w-3xl py-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container max-w-3xl py-6">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => dispatch(fetchUserOrganizations())}>Retry</Button>
          </CardContent>
        </Card>
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

      {organizations?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-semibold">Organization Required</h2>
            <p className="text-muted-foreground">
              You need to create an organization before you can create a project.
              Projects must belong to an organization. Please create a new organization to continue.
            </p>
            <div className="flex justify-center pt-4">
              <CreateOrganizationDialog onSuccess={() => dispatch(fetchUserOrganizations())} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <CreateProjectForm />
      )}
    </div>
  );
}