"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertCircle, Clock, FileDown, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface IssueSummary {
  critical: number;
  error: number;
  warning: number;
  info: number;
}

interface AuditSummaryProps {
  audit: {
    id: string;
    projectId: string;
    siteUrl: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    totalPages: number;
    issuesSummary: IssueSummary;
    htmlReport?: string;
    progressPercentage?: number;
  };
}

export default function AuditSummary({ audit }: AuditSummaryProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Calculate total issues
  const totalIssues = 
    audit.issuesSummary.critical + 
    audit.issuesSummary.error + 
    audit.issuesSummary.warning + 
    audit.issuesSummary.info;

  // Calculate health score (basic algorithm)
  const calculateHealthScore = () => {
    if (audit.totalPages === 0) return 0;
    
    const criticalImpact = 1.0;
    const errorImpact = 0.7;
    const warningImpact = 0.3;
    const infoImpact = 0.1;
    
    const totalImpact = 
      (audit.issuesSummary.critical * criticalImpact) +
      (audit.issuesSummary.error * errorImpact) +
      (audit.issuesSummary.warning * warningImpact) +
      (audit.issuesSummary.info * infoImpact);
    
    // Base score out of 100, reduced by impact
    const baseScore = 100;
    const impactPerPage = totalImpact / audit.totalPages;
    const penaltyFactor = Math.min(impactPerPage * 5, 100); // Cap penalty at 100%
    
    return Math.max(0, Math.round(baseScore - penaltyFactor));
  };
  
  const healthScore = calculateHealthScore();

  // Get health status color
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDownloadReport = async () => {
    if (!audit.htmlReport) {
      toast({
        title: "Report Unavailable",
        description: "The HTML report is not available for this audit.",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);
    
    try {
      // In a real implementation, fetch the report file
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      // Create a fake download for this demonstration
      const element = document.createElement("a");
      element.href = "data:text/html;charset=utf-8," + encodeURIComponent("<html><body><h1>Sample Report</h1></body></html>");
      element.download = `audit-report-${audit.id}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Report Downloaded",
        description: "The audit report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the audit report.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShareReport = async () => {
    setSharing(true);
    
    try {
      // In a real implementation, generate a shareable link
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      // Copy a fake URL to clipboard
      const shareableUrl = `https://your-seo-saas.com/shared/audit/${audit.id}`;
      await navigator.clipboard.writeText(shareableUrl);
      
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Failed to generate shareable link.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with basic audit info */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Audit Summary</h1>
            {getStatusBadge(audit.status)}
          </div>
          <p className="text-muted-foreground mb-1">
            {audit.siteUrl}
          </p>
          <p className="text-sm text-muted-foreground">
            Started: {format(new Date(audit.startedAt), "MMM d, yyyy h:mm a")}
            {audit.completedAt && (
              <> • Completed: {format(new Date(audit.completedAt), "MMM d, yyyy h:mm a")}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadReport}
            disabled={downloading || !audit.htmlReport}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download Report"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShareReport}
            disabled={sharing}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {sharing ? "Generating Link..." : "Share Report"}
          </Button>
          <Button asChild size="sm">
            <Link href={`/dashboard/projects/${audit.projectId}/technical-audit/new`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run New Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Status for pending/in_progress audits */}
      {(audit.status.toLowerCase() === "pending" || audit.status.toLowerCase() === "in_progress" || audit.status.toLowerCase() === "running") && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-blue-500 mb-4 animate-spin-slow" />
              <h2 className="text-xl font-bold mb-2">
                {audit.status.toLowerCase() === "pending" ? "Audit Pending" : "Audit In Progress"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {audit.status.toLowerCase() === "pending"
                  ? "Your audit is queued and will start soon."
                  : "Your website is being crawled and analyzed."}
              </p>
              <Progress 
                value={audit.status.toLowerCase() === "pending" ? 5 : audit.progressPercentage || 35} 
                className="w-full max-w-md mb-4" 
              />
              <p className="text-sm text-muted-foreground">
                {audit.status.toLowerCase() === "pending"
                  ? "This might take a few minutes to start."
                  : `${audit.totalPages} pages crawled so far`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results for completed audits */}
      {audit.status.toLowerCase() === "completed" && (
        <>
          {/* Health Score & Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Health Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>
                  {healthScore}%
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2 rounded-full ${
                      healthScore >= 90
                        ? "bg-green-500"
                        : healthScore >= 70
                        ? "bg-yellow-500"
                        : healthScore >= 50
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {healthScore >= 90
                    ? "Excellent! Your site is in great shape."
                    : healthScore >= 70
                    ? "Good. Some improvements recommended."
                    : healthScore >= 50
                    ? "Fair. Several issues need attention."
                    : "Poor. Critical issues require immediate attention."}
                </p>
              </CardContent>
            </Card>

            {/* Pages Crawled */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pages Crawled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{audit.totalPages}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total pages crawled and analyzed
                </p>
              </CardContent>
            </Card>

            {/* Total Issues */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalIssues}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Issues found across all pages
                </p>
              </CardContent>
            </Card>

            {/* Critical Issues */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-500">
                  {audit.issuesSummary.critical}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  High-priority issues requiring immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issues Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Issues Breakdown</CardTitle>
              <CardDescription>
                Summary of issues found across your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Critical Issues */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span>Critical Issues</span>
                    </div>
                    <Badge variant="outline" className="text-red-500">
                      {audit.issuesSummary.critical}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{
                        width: `${
                          totalIssues > 0
                            ? (audit.issuesSummary.critical / totalIssues) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Error Issues */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                      <span>Errors</span>
                    </div>
                    <Badge variant="outline" className="text-orange-500">
                      {audit.issuesSummary.error}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{
                        width: `${
                          totalIssues > 0
                            ? (audit.issuesSummary.error / totalIssues) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Warning Issues */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                      <span>Warnings</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-500">
                      {audit.issuesSummary.warning}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{
                        width: `${
                          totalIssues > 0
                            ? (audit.issuesSummary.warning / totalIssues) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Info Issues */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                      <span>Notices</span>
                    </div>
                    <Badge variant="outline" className="text-blue-500">
                      {audit.issuesSummary.info}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${
                          totalIssues > 0
                            ? (audit.issuesSummary.info / totalIssues) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/projects/${audit.projectId}/technical-audit/${audit.id}/issues`}>
                  View Detailed Issues
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}

      {/* Failed audit message */}
      {audit.status.toLowerCase() === "failed" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Audit Failed</h2>
              <p className="text-muted-foreground mb-6">
                We encountered an error while trying to audit your website.
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${audit.projectId}/technical-audit/new`}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}