"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Trash2, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UrlPattern } from "@/types/audit-types";

const auditFormSchema = z.object({
  siteUrl: z.string().url({ message: "Please enter a valid URL" }),
  maxPages: z.number().int().positive().max(1000).optional(),
  maxDepth: z.number().int().min(1).max(10).optional(),
  includeSitemap: z.boolean().default(true),
  includeRobots: z.boolean().default(true),
  crawlSingleUrl: z.boolean().default(false),
  followPatterns: z.array(
    z.object({
      id: z.string(),
      pattern: z.string(),
      description: z.string().optional(),
    })
  ).optional(),
  ignorePatterns: z.array(
    z.object({
      id: z.string(),
      pattern: z.string(),
      description: z.string().optional(),
    })
  ).optional(),
  userAgent: z.string().optional(),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

interface NewAuditFormProps {
  projectId: string;
  projectUrl: string;
}

export default function NewAuditForm({ projectId, projectUrl }: NewAuditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Default ignore patterns
  const defaultIgnorePatterns: UrlPattern[] = [
    { id: "1", pattern: "**/wp-admin/**", description: "WordPress admin" },
    { id: "2", pattern: "**/wp-login.php", description: "WordPress login" },
    { id: "3", pattern: "**/wp-content/uploads/**", description: "WP uploads" },
    { id: "4", pattern: "**/feed/**", description: "RSS feeds" },
    { id: "5", pattern: "**/*.pdf", description: "PDF files" },
  ];
  
  const [formData, setFormData] = useState<AuditFormData>({
    siteUrl: projectUrl,
    maxPages: 100,
    maxDepth: 3,
    includeSitemap: true,
    includeRobots: true,
    crawlSingleUrl: false,
    ignorePatterns: defaultIgnorePatterns,
    followPatterns: [],
    userAgent: "SEO SaaS Auditor/1.0",
  });

  // For URL pattern management
  const [newFollowPattern, setNewFollowPattern] = useState("");
  const [newIgnorePattern, setNewIgnorePattern] = useState("");

  const validateForm = () => {
    try {
      auditFormSchema.parse(formData);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const addFollowPattern = () => {
    if (!newFollowPattern) return;
    
    setFormData((prev) => ({
      ...prev,
      followPatterns: [
        ...(prev.followPatterns || []),
        {
          id: Date.now().toString(),
          pattern: newFollowPattern,
        },
      ],
    }));
    
    setNewFollowPattern("");
  };

  const removeFollowPattern = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      followPatterns: prev.followPatterns?.filter((p) => p.id !== id),
    }));
  };

  const addIgnorePattern = () => {
    if (!newIgnorePattern) return;
    
    setFormData((prev) => ({
      ...prev,
      ignorePatterns: [
        ...(prev.ignorePatterns || []),
        {
          id: Date.now().toString(),
          pattern: newIgnorePattern,
        },
      ],
    }));
    
    setNewIgnorePattern("");
  };

  const removeIgnorePattern = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      ignorePatterns: prev.ignorePatterns?.filter((p) => p.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/audits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start audit");
      }

      toast({
        title: "Audit Started",
        description: "Your website audit has been initiated successfully.",
      });

      // Redirect to the audit results page
      router.push(`/dashboard/projects/${projectId}/technical-audit/${data.auditId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start audit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Technical Audit</CardTitle>
        <CardDescription>
          Configure the settings for your website audit
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Website URL</Label>
              <Input
                id="siteUrl"
                name="siteUrl"
                value={formData.siteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className={errors.siteUrl ? "border-red-500" : ""}
              />
              {errors.siteUrl && (
                <p className="text-sm text-red-500">{errors.siteUrl}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The website to audit. Include https:// at the beginning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPages">Maximum Pages</Label>
                <Input
                  id="maxPages"
                  name="maxPages"
                  type="number"
                  value={formData.maxPages || ""}
                  onChange={handleInputChange}
                  placeholder="100"
                  className={errors.maxPages ? "border-red-500" : ""}
                />
                {errors.maxPages && (
                  <p className="text-sm text-red-500">{errors.maxPages}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum number of pages to crawl (1-1000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDepth">Maximum Depth</Label>
                <Input
                  id="maxDepth"
                  name="maxDepth"
                  type="number"
                  value={formData.maxDepth || ""}
                  onChange={handleInputChange}
                  placeholder="3"
                  className={errors.maxDepth ? "border-red-500" : ""}
                />
                {errors.maxDepth && (
                  <p className="text-sm text-red-500">{errors.maxDepth}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  How deep to crawl (1-10 levels)
                </p>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeSitemap">Include Sitemap</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically discover URLs from your sitemap.xml
                </p>
              </div>
              <Switch
                id="includeSitemap"
                checked={formData.includeSitemap}
                onCheckedChange={(checked) =>
                  handleSwitchChange("includeSitemap", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeRobots">Process Robots.txt</Label>
                <p className="text-xs text-muted-foreground">
                  Respect robots.txt directives during crawling
                </p>
              </div>
              <Switch
                id="includeRobots"
                checked={formData.includeRobots}
                onCheckedChange={(checked) =>
                  handleSwitchChange("includeRobots", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="crawlSingleUrl">Crawl Single URL Only</Label>
                <p className="text-xs text-muted-foreground">
                  Only analyze the specified URL without following links
                </p>
              </div>
              <Switch
                id="crawlSingleUrl"
                checked={formData.crawlSingleUrl}
                onCheckedChange={(checked) =>
                  handleSwitchChange("crawlSingleUrl", checked)
                }
              />
            </div>
          </div>

          {/* Advanced Settings Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-settings">
              <AccordionTrigger>Advanced Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* User Agent */}
                <div className="space-y-2">
                  <Label htmlFor="userAgent">User Agent</Label>
                  <Input
                    id="userAgent"
                    name="userAgent"
                    value={formData.userAgent || ""}
                    onChange={handleInputChange}
                    placeholder="SEO SaaS Auditor/1.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom user agent for the crawler
                  </p>
                </div>

                {/* URL Patterns to Follow */}
                <div className="space-y-2">
                  <Label>URL Patterns to Follow</Label>
                  <p className="text-xs text-muted-foreground">
                    Specify patterns for URLs that should be crawled (glob syntax)
                  </p>

                  <div className="flex gap-2">
                    <Input
                      value={newFollowPattern}
                      onChange={(e) => setNewFollowPattern(e.target.value)}
                      placeholder="e.g. /blog/**"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFollowPattern}
                      disabled={!newFollowPattern}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-2">
                    {formData.followPatterns?.map((pattern) => (
                      <div
                        key={pattern.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span>{pattern.pattern}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFollowPattern(pattern.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {formData.followPatterns?.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No patterns added. By default, all URLs from the same domain will be crawled.
                      </p>
                    )}
                  </div>
                </div>

                {/* URL Patterns to Ignore */}
                <div className="space-y-2">
                  <Label>URL Patterns to Ignore</Label>
                  <p className="text-xs text-muted-foreground">
                    Specify patterns for URLs that should be ignored (glob syntax)
                  </p>

                  <div className="flex gap-2">
                    <Input
                      value={newIgnorePattern}
                      onChange={(e) => setNewIgnorePattern(e.target.value)}
                      placeholder="e.g. /admin/**"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addIgnorePattern}
                      disabled={!newIgnorePattern}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-2">
                    {formData.ignorePatterns?.map((pattern) => (
                      <div
                        key={pattern.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex-1">
                          <span>{pattern.pattern}</span>
                          {pattern.description && (
                            <p className="text-xs text-muted-foreground">
                              {pattern.description}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIgnorePattern(pattern.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {formData.ignorePatterns?.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No patterns added. Common file types are ignored by default.
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Starting Audit..." : "Start Audit"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}