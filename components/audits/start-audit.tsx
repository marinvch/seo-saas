"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteAuditConfig } from "@/types/audit";

// Form schema for site audit configuration
const auditFormSchema = z.object({
  startUrl: z.string().url({
    message: "Please enter a valid URL (e.g. https://example.com)",
  }),
  maxDepth: z.number().min(1).max(10),
  emulateDevice: z.enum(["desktop", "mobile"]),
  respectRobotsTxt: z.boolean().default(true),
  includeScreenshots: z.boolean().default(false),
  skipExternal: z.boolean().default(true),
  maxRequestsPerCrawl: z.number().min(10).max(500),
  maxConcurrency: z.number().min(1).max(10),
  includeSitemap: z.boolean().default(true),
});

type StartAuditProps = {
  projectId?: string;
  projectUrl?: string;
  onAuditStarted?: (auditId: string) => void;
};

export function StartAudit({ projectId, projectUrl, onAuditStarted }: StartAuditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Define form with schema validation
  const form = useForm<z.infer<typeof auditFormSchema>>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      startUrl: projectUrl || "",
      maxDepth: 3,
      emulateDevice: "desktop",
      respectRobotsTxt: true,
      includeScreenshots: false,
      skipExternal: true,
      maxRequestsPerCrawl: 100,
      maxConcurrency: 5,
      includeSitemap: true,
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof auditFormSchema>) {
    try {
      setIsSubmitting(true);

      // Prepare audit config
      const auditConfig: SiteAuditConfig & { projectId?: string } = {
        ...values,
      };

      // Add project ID if provided
      if (projectId) {
        auditConfig.projectId = projectId;
      }

      // Call API to start audit
      const response = await axios.post("/api/audit", auditConfig);
      const { auditId } = response.data;

      // Show success notification
      toast({
        title: "Audit started successfully",
        description: "You can track the progress in the audit history section.",
        duration: 5000,
      });

      // Call the callback if provided
      if (onAuditStarted && auditId) {
        onAuditStarted(auditId);
      } else if (projectId) {
        // Navigate to audit details page
        router.push(`/dashboard/projects/${projectId}/audits/${auditId}`);
      } else {
        // Navigate to audit results page without project context
        router.push(`/dashboard/audits/${auditId}`);
      }
    } catch (error) {
      console.error("Failed to start audit:", error);
      
      // Show error notification
      toast({
        title: "Failed to start audit",
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Site Audit</CardTitle>
        <CardDescription>
          Configure and start a comprehensive SEO audit of your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="pt-4 space-y-6">
                <FormField
                  control={form.control}
                  name="startUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL where the audit should start
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxDepth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Crawl Depth: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        How deep should the crawler follow links (1-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emulateDevice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which device type to emulate during the audit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeSitemap"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Analyze Sitemap
                        </FormLabel>
                        <FormDescription>
                          Parse sitemap.xml to discover and audit additional pages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="respectRobotsTxt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Respect robots.txt
                        </FormLabel>
                        <FormDescription>
                          Follow the crawling rules specified in robots.txt
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="advanced" className="pt-4 space-y-6">
                <Alert>
                  <AlertDescription>
                    These advanced settings control how the audit crawler behaves. Default values work well for most websites.
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="maxRequestsPerCrawl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Pages: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={10}
                          max={500}
                          step={10}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of pages to crawl (10-500)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxConcurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concurrency: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of pages to crawl simultaneously (1-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skipExternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Skip External Links
                        </FormLabel>
                        <FormDescription>
                          Only crawl pages on the same domain
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeScreenshots"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Capture Screenshots
                        </FormLabel>
                        <FormDescription>
                          Take screenshots of each page (increases audit time)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <CardFooter className="px-0">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Starting Audit..." : "Start Audit"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
