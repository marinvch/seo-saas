"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  BarChart2,
  ListTodo,
  Download,
  Share2,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { SeoIssuesSummary } from "./seo-issues-summary";
import { type AuditResult } from "@/types/audit";

interface AuditResultsViewProps {
  auditResult: AuditResult;
  projectId?: string;
}

export function AuditResultsView({ auditResult, projectId }: AuditResultsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("issues");
  
  // Count issues by severity
  const issueCount = {
    critical: auditResult.issuesSummary.critical,
    warning: auditResult.issuesSummary.warning,
    info: auditResult.issuesSummary.info,
    total: auditResult.issuesSummary.total
  };
  
  // Format dates
  const startDate = new Date(auditResult.startedAt);
  const endDate = auditResult.completedAt ? new Date(auditResult.completedAt) : null;
  
  // Calculate duration in minutes
  const duration = endDate 
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) 
    : 0;
  
  // Export report as PDF/HTML (placeholder)
  const exportReport = () => {
    if (auditResult.htmlReport) {
      window.open(auditResult.htmlReport, '_blank');
    } else {
      alert('Report export functionality coming soon');
    }
  };
  
  // Share report (placeholder)
  const shareReport = () => {
    alert('Report sharing functionality coming soon');
  };
  
  return (
    <Card className="border-green-100 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            <CardTitle>Audit Complete</CardTitle>
          </div>
          {projectId && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Project
            </Button>
          )}
        </div>
        <CardDescription>
          {`Audit completed on ${format(startDate, "MMMM d, yyyy")} at ${format(startDate, "h:mm a")}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Pages Analyzed</div>
              <div className="mt-1 text-2xl font-bold">{auditResult.pagesAnalyzed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Critical Issues</div>
              <div className="mt-1 text-2xl font-bold text-red-600">{issueCount.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Warnings</div>
              <div className="mt-1 text-2xl font-bold text-yellow-600">{issueCount.warning}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Duration</div>
              <div className="mt-1 text-2xl font-bold">{duration} min</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="issues" className="flex items-center">
              <ListTodo className="mr-2 h-4 w-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="mt-4 space-y-4">
            <SeoIssuesSummary 
              issues={auditResult.issues || []}
              title="SEO Issues"
              description={`${issueCount.total} issues found across ${auditResult.pagesAnalyzed} pages`}
            />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Statistics</CardTitle>
                <CardDescription>
                  Performance metrics and crawl statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Detailed statistics will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {`Audit ID: ${auditResult.id}`}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={shareReport}
            className="flex items-center"
          >
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={exportReport}
            className="flex items-center"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function AuditResultsLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
          <div className="h-64 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="flex space-x-2">
          <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        </div>
      </CardFooter>
    </Card>
  );
}