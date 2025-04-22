"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCheck, AlertTriangle, ArrowRight, Lightbulb, Pulse } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuditInsight {
  insights: string;
  prioritizedActions: Array<{ action: string; impact: "HIGH" | "MEDIUM" | "LOW" }>;
  contentSuggestions: string;
  timestamp?: string;
}

interface AuditInsightsProps {
  projectId: string;
  auditId: string;
}

export default function AuditInsights({ projectId, auditId }: AuditInsightsProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<AuditInsight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchInsights();
  }, [projectId, auditId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/audits/${auditId}/ai-insights`);
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400) {
          // Audit not completed yet
          setError("The audit is not yet complete. AI insights will be available once the audit finishes.");
        } else {
          setError(data.error || "Failed to fetch AI insights");
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError("An error occurred while fetching AI insights");
      console.error("Error fetching AI insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch(
        `/api/projects/${projectId}/audits/${auditId}/ai-insights?force=true`,
        { method: "POST" }
      );
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate new insights");
        setGenerating(false);
        return;
      }
      
      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError("An error occurred while generating new insights");
      console.error("Error generating insights:", err);
    } finally {
      setGenerating(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <Skeleton className="h-8 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Powered SEO Insights
          </CardTitle>
          <CardDescription>
            Get intelligent recommendations based on your audit results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={fetchInsights}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Powered SEO Insights
            </CardTitle>
            <CardDescription>
              Intelligent recommendations powered by Gemini 1.5 Flash
            </CardDescription>
          </div>
          {insights?.timestamp && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Generated {formatTimestamp(insights.timestamp)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="insights">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">Overall Analysis</TabsTrigger>
            <TabsTrigger value="actions">Priority Actions</TabsTrigger>
            <TabsTrigger value="content">Content Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            <p className="whitespace-pre-line">{insights?.insights}</p>
          </TabsContent>
          
          <TabsContent value="actions">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These actions are prioritized based on their potential impact on your SEO performance
              </p>
              
              <ul className="space-y-3">
                {insights?.prioritizedActions?.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 p-2 border rounded-md bg-muted/50">
                    <div className="mt-1 text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{action.action}</div>
                      <div className="mt-1">
                        <Badge variant="outline" className={getImpactColor(action.impact)}>
                          {action.impact} IMPACT
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
                
                {(!insights?.prioritizedActions || insights.prioritizedActions.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground">
                    No priority actions available
                  </div>
                )}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <div className="space-y-4">
              <p className="whitespace-pre-line">{insights?.contentSuggestions}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/projects/${projectId}/technical-audit/${auditId}`)}
        >
          Back to Audit Results
        </Button>
        
        <Button 
          onClick={generateNewInsights} 
          disabled={generating}
          className="flex items-center gap-1"
        >
          {generating ? (
            <>
              <Pulse className="h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4" />
              Refresh Insights
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}