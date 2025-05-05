"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type { SiteAuditConfig } from "@/types/audit";

// Form schema for site audit configuration
const auditFormSchema = z.object({
  startUrl: z.string().url({
    message: "Please enter a valid URL (e.g. https://example.com)",
  }),
  maxDepth: z.number().min(1).max(10),
  emulateDevice: z.enum(["desktop", "mobile"] as const),
  respectRobotsTxt: z.boolean(),
  includeScreenshots: z.boolean(),
  skipExternal: z.boolean(),
  maxRequestsPerCrawl: z.number().min(10).max(500),
  maxConcurrency: z.number().min(1).max(10),
  includeSitemap: z.boolean(),
});

type FormValues = z.infer<typeof auditFormSchema>;

interface StartAuditProps {
  projectId?: string;
  projectUrl?: string;
  onAuditStarted?: (auditId: string) => void;
}

function StartAuditForm({
  projectId,
  projectUrl,
  onAuditStarted,
}: StartAuditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
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

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const auditConfig: SiteAuditConfig = {
        ...values,
        projectId,
      };

      const response = await axios.post("/api/audit/start", auditConfig);
      const { auditId } = response.data;

      if (!auditId) {
        throw new Error("No audit ID returned from server");
      }

      toast({
        title: "Audit started successfully",
        description: "You can track the progress in the audit history section.",
        duration: 5000,
      });

      // Handle success based on context
      if (onAuditStarted) {
        onAuditStarted(auditId);
      } else if (projectId) {
        router.push(`/dashboard/projects/${projectId}/audits/${auditId}`);
      } else {
        router.push(`/dashboard/audits/${auditId}`);
      }
    } catch (error) {
      console.error("Failed to start audit:", error);

      toast({
        title: "Failed to start audit",
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || "Server error occurred"
          : "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                          disabled={!!projectUrl}
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
                          onValueChange={(values: number[]) =>
                            field.onChange(values[0])
                          }
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
                          Parse sitemap.xml to discover and audit additional
                          pages
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
                    These advanced settings control how the audit crawler
                    behaves. Default values work well for most websites.
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
                          onValueChange={(values: number[]) =>
                            field.onChange(values[0])
                          }
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
                          onValueChange={(values: number[]) =>
                            field.onChange(values[0])
                          }
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Audit...
                </>
              ) : (
                "Start Audit"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Wrap with ErrorBoundary for better error handling
export function StartAudit(props: StartAuditProps) {
  return (
    <ErrorBoundary>
      <StartAuditForm {...props} />
    </ErrorBoundary>
  );
}
