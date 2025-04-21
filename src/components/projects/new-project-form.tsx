"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Project creation schema validation
const projectSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  type: z.enum(["WEBSITE", "BLOG", "ECOMMERCE", "SOCIAL_MEDIA"]),
  targetCountry: z.string().optional(),
  targetLanguage: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    url: "",
    type: "WEBSITE",
    targetCountry: "",
    targetLanguage: "",
  });

  const validateForm = () => {
    try {
      projectSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast({
        title: "Project created",
        description: `${formData.name} has been created successfully.`,
      });

      // Redirect to the project page
      router.push(`/dashboard/projects/${data.id}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Project</CardTitle>
        <CardDescription>
          Enter the details of the website or application you want to monitor and analyze.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Company Website"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Website URL
            </label>
            <Input
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={errors.url ? "border-red-500" : ""}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the full URL including https://
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Project Type
            </label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="BLOG">Blog</SelectItem>
                <SelectItem value="ECOMMERCE">E-commerce</SelectItem>
                <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="targetCountry" className="text-sm font-medium">
              Target Country (optional)
            </label>
            <Input
              id="targetCountry"
              name="targetCountry"
              value={formData.targetCountry}
              onChange={handleInputChange}
              placeholder="United States"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="targetLanguage" className="text-sm font-medium">
              Target Language (optional)
            </label>
            <Input
              id="targetLanguage"
              name="targetLanguage"
              value={formData.targetLanguage}
              onChange={handleInputChange}
              placeholder="en-US"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}