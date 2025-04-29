"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface ProjectDangerZoneProps {
  projectId: string;
  projectName: string;
}

export function ProjectDangerZone({ projectId, projectName }: ProjectDangerZoneProps) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmationText, setConfirmationText] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDeleteClick = () => {
    setOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (confirmationText !== projectName) {
      setValidationError("Project name doesn't match");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the project");
      }

      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
      
      // Navigate back to projects page
      router.push("/dashboard/projects");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
      console.error(error);
      setIsDeleting(false);
      setOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationText(e.target.value);
    setValidationError(null);
  };

  return (
    <>
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Actions here can't be undone. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/30 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-medium">Delete this project</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently delete the project and all of its data, including audits, keywords, and rankings.
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="sm:w-auto w-full"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 text-xs text-muted-foreground">
          You will need to confirm this action
        </CardFooter>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project{" "}
              <span className="font-medium">{projectName}</span> and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium">
              To confirm, type the project name: <span className="font-bold">{projectName}</span>
            </p>
            <Input 
              value={confirmationText}
              onChange={handleInputChange}
              placeholder={projectName}
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting || confirmationText !== projectName}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
