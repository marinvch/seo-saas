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
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuditProgress } from "@/components/audits/audit-progress";
import Link from "next/link";

// Form schema
const auditFormSchema = z.object({
  maxPages: z.coerce.number()
    .min(1, "Must audit at least 1 page")
    .max(1000, "Maximum 1000 pages per audit"),
  maxDepth: z.coerce.number()
    .min(1, "Depth must be at least 1")
    .max(10, "Maximum depth of 10"),
  includeSubdomains: z.boolean().default(false),
  checkExternal: z.boolean().default(false),
  userAgent: z.string().default("desktop"),
  respectRobotsTxt: z.boolean().default(true),
  checkImages: z.boolean().default(true),
  checkPerformance: z.boolean().default(true)
});

type AuditFormValues = z.infer<typeof auditFormSchema>;

export default function NewAuditPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      maxPages: 100,
      maxDepth: 3,
      includeSubdomains: false,
      checkExternal: false,
      userAgent: "desktop",
      respectRobotsTxt: true,
      checkImages: true,
      checkPerformance: true
    },
  });

  // Handle form submission
  async function onSubmit(data: AuditFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/audit/start', {
        projectId,
        options: data
      });
      
      if (response.data.success && response.data.auditId) {
        setAuditId(response.data.auditId);
        toast({
          title: "Audit started",
          description: "Your site audit has been started and is now in progress.",
          duration: 5000,
        });
      } else {
        throw new Error("Failed to start audit");
      }
    } catch (error) {
      console.error("Error starting audit:", error);
      toast({
        title: "Error",
        description: "Failed to start the audit. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setIsSubmitting(false);
    }
  }

  // If an audit is in progress, show the progress component
  if (auditId) {
    return (
      <div className="container py-8">
        <PageHeader>
          <PageHeaderHeading>Audit In Progress</PageHeaderHeading>
          <PageHeaderDescription>
            Your site is being crawled and analyzed for SEO issues
          </PageHeaderDescription>
        </PageHeader>
        <div className="mt-6">
          <AuditProgress auditId={auditId} projectId={projectId} />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/dashboard/projects/${projectId}/audits`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Audits
      </Button>

      <PageHeader>
        <PageHeaderHeading>New Site Audit</PageHeaderHeading>
        <PageHeaderDescription>
          Configure and start a comprehensive SEO audit for your website
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Audit Configuration</CardTitle>
          <CardDescription>
            Customize the settings for your site audit
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxPages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Pages</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum number of pages to audit
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
                      <FormLabel>Crawl Depth</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        How many clicks from the homepage to crawl
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="userAgent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Agent</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="desktop">Desktop Browser</SelectItem>
                        <SelectItem value="mobile">Mobile Browser</SelectItem>
                        <SelectItem value="googlebot">Google Bot</SelectItem>
                        <SelectItem value="bingbot">Bing Bot</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The user agent to use when crawling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="includeSubdomains"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Subdomains</FormLabel>
                        <FormDescription>
                          Check URLs on different subdomains
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkExternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Check External Links</FormLabel>
                        <FormDescription>
                          Verify external links but don't crawl them
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="respectRobotsTxt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Respect robots.txt</FormLabel>
                        <FormDescription>
                          Follow the rules in robots.txt
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkImages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Check Images</FormLabel>
                        <FormDescription>
                          Analyze images for alt text and optimization
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="checkPerformance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Check Performance</FormLabel>
                      <FormDescription>
                        Measure page load performance metrics
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${projectId}/audits`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Starting Audit..." : "Start Audit"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
