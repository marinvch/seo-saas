"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "../ui/use-toast";
import { Lightbulb, ArrowRight, Loader2, RefreshCw, Sparkles, FileText, Heading1, Heading2, Link2 } from "lucide-react";
import { Separator } from "../ui/separator";

interface ContentOptimizationResult {
  title: string;
  metaDescription: string;
  headingStructure: string;
  contentSuggestions: string;
  internalLinkingSuggestions: string;
}

export default function ContentOptimizer() {
  const [url, setUrl] = useState<string>("");
  const [pageContent, setPageContent] = useState<string>("");
  const [keywordsText, setKeywordsText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isFetchingContent, setIsFetchingContent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentOptimizationResult | null>(null);

  const fetchContentFromUrl = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a URL to fetch content from",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsFetchingContent(true);
      setError(null);

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL including http:// or https://",
          variant: "destructive",
        });
        setIsFetchingContent(false);
        return;
      }

      const response = await fetch("/api/fetch-page-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch page content");
      }

      const data = await response.json();
      setPageContent(data.content);
      
      toast({
        title: "Content fetched",
        description: "Page content has been successfully retrieved",
      });
    } catch (err: any) {
      toast({
        title: "Error fetching content",
        description: err.message || "Failed to fetch page content. Please try again.",
        variant: "destructive",
      });
      setError(err.message || "Failed to fetch content");
    } finally {
      setIsFetchingContent(false);
    }
  };

  const analyzeContent = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!pageContent) {
      toast({
        title: "Content required",
        description: "Please fetch or paste content to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!keywordsText) {
      toast({
        title: "Keywords required",
        description: "Please enter target keywords to optimize for",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Parse keywords from comma-separated text
      const keywords = keywordsText
        .split(",")
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 0);

      if (keywords.length === 0) {
        toast({
          title: "Keywords required",
          description: "Please enter at least one valid keyword",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch("/api/content-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          pageContent,
          keywords,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze content");
      }

      const data = await response.json();
      setResult(data.suggestions);
      
      toast({
        title: "Analysis complete",
        description: "Content optimization suggestions are ready",
      });
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Failed to analyze content. Please try again.",
        variant: "destructive",
      });
      setError(err.message || "Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Content Optimizer
          </CardTitle>
          <CardDescription>
            Optimize your page content for SEO with AI-powered recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Page URL</Label>
            <div className="flex space-x-2">
              <Input
                id="url"
                placeholder="https://example.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="button"
                onClick={fetchContentFromUrl}
                disabled={isFetchingContent || !url}
              >
                {isFetchingContent ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Content"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the URL of the page you want to optimize
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords</Label>
            <Input
              id="keywords"
              placeholder="seo, digital marketing, seo tools"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your target keywords separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Page Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your page content here or use the fetch button"
              className="min-h-[200px]"
              value={pageContent}
              onChange={(e) => setPageContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              HTML content will be automatically cleaned for analysis
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={analyzeContent}
            disabled={isAnalyzing || !url || !pageContent || !keywordsText}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Content...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Analyze & Optimize Content
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
            <CardDescription>
              AI-powered recommendations to improve your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="title">
              <TabsList className="mb-4">
                <TabsTrigger value="title">Title & Meta</TabsTrigger>
                <TabsTrigger value="headings">Heading Structure</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="links">Internal Linking</TabsTrigger>
              </TabsList>

              <TabsContent value="title" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Suggested Title
                  </h3>
                  <Separator className="my-2" />
                  <div className="p-3 border rounded-md bg-muted/50">
                    {result.title}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Character count: {result.title?.length || 0}/60
                    {result.title?.length > 60 && (
                      <Badge variant="destructive" className="ml-2">
                        Too long
                      </Badge>
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Suggested Meta Description
                  </h3>
                  <Separator className="my-2" />
                  <div className="p-3 border rounded-md bg-muted/50">
                    {result.metaDescription}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Character count: {result.metaDescription?.length || 0}/160
                    {result.metaDescription?.length > 160 && (
                      <Badge variant="destructive" className="ml-2">
                        Too long
                      </Badge>
                    )}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="headings">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Heading1 className="h-4 w-4" /> Heading Structure Suggestions
                  </h3>
                  <Separator className="my-2" />
                  <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-line">
                    {result.headingStructure}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Heading2 className="h-4 w-4" /> Content Recommendations
                  </h3>
                  <Separator className="my-2" />
                  <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-line">
                    {result.contentSuggestions}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Internal Linking Opportunities
                  </h3>
                  <Separator className="my-2" />
                  <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-line">
                    {result.internalLinkingSuggestions}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setResult(null)}
            >
              Reset Analysis
            </Button>
            <Button
              variant="secondary"
              onClick={analyzeContent}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate Suggestions
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}