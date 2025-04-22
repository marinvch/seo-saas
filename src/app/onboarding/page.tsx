"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Steps } from "@/components/ui/steps";
import { slugify } from "@/lib/utils";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agency information
  const [agencyName, setAgencyName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // First project information
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectType, setProjectType] = useState("WEBSITE");

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAgencyName(name);
    setSlug(slugify(name));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value));
  };

  const handleNext = () => {
    if (step === 0 && !agencyName) {
      setError("Agency name is required");
      return;
    }
    
    if (step === 1 && (!projectName || !projectUrl)) {
      setError("Project name and URL are required");
      return;
    }
    
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create organization
      const orgResponse = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: agencyName,
          slug,
          website
        }),
      });

      if (!orgResponse.ok) {
        const orgError = await orgResponse.json();
        throw new Error(orgError.message || "Failed to create organization");
      }

      const orgData = await orgResponse.json();

      // Create project
      if (projectName && projectUrl) {
        const projectResponse = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName,
            url: projectUrl,
            type: projectType,
            organizationId: orgData.organization.id
          }),
        });

        if (!projectResponse.ok) {
          const projectError = await projectResponse.json();
          console.error("Project creation failed:", projectError);
          // Continue even if project creation fails
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to SEOmaster</CardTitle>
          <CardDescription className="text-center">
            Let&apos;s set up your account in a few simple steps
          </CardDescription>
          
          <div className="w-full my-4">
            <Steps
              steps={[
                { label: "Agency Details" },
                { label: "First Project" },
                { label: "Complete" }
              ]}
              activeStep={step}
            />
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Agency Name</Label>
                <Input
                  id="agency-name"
                  placeholder="Acme Digital Marketing"
                  value={agencyName}
                  onChange={handleAgencyNameChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (Used for Your Dashboard URL)</Label>
                <Input
                  id="slug"
                  placeholder="acme-digital"
                  value={slug}
                  onChange={handleSlugChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Agency Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="https://your-agency.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">About Your Agency (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us a bit about your agency and the services you offer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">First Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Client Website"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-url">Project URL</Label>
                <Input
                  id="project-url"
                  placeholder="https://client-website.com"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-type">Project Type</Label>
                <select
                  id="project-type"
                  className="w-full p-2 border rounded"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                >
                  <option value="WEBSITE">Website</option>
                  <option value="BLOG">Blog</option>
                  <option value="ECOMMERCE">E-Commerce</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="p-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600 dark:text-green-300"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">You&apos;re all set!</h3>
                <p className="text-muted-foreground mb-4">
                  Your account has been successfully set up. Click the button below to go to
                  your dashboard and start using SEOmaster.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 0 && step < 2 ? (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          ) : <div></div>}

          {step < 2 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Complete Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}