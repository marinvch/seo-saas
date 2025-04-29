"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
// Fix the import for page-header components
import { 
  PageHeader, 
  PageHeaderDescription, 
  PageHeaderHeading 
} from "@/components/page-header";
import { AuditProgress } from "@/components/audits/audit-progress";
import { AuditResultsView } from "@/components/audits/audit-results";
import { AuditResult } from "@/types/audit";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AuditDetailPage({ params }: { 
  params: { 
    projectId: string; 
    auditId: string;
  } 
}) {
  const { projectId, auditId } = params;
  const router = useRouter();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        setLoading(true);
        const response = await axios.get(`/api/audit?auditId=${auditId}`);
        setAudit(response.data);
      } catch (err) {
        console.error("Failed to fetch audit:", err);
        setError("Failed to load audit data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchAudit();
  }, [auditId]);

  if (loading) {
    return (
      <div className="container py-8">
        <PageHeader>
          <PageHeaderHeading>Loading Audit</PageHeaderHeading>
          <PageHeaderDescription>
            Please wait while we fetch the audit data
          </PageHeaderDescription>
        </PageHeader>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
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
          <PageHeaderHeading>Error</PageHeaderHeading>
          <PageHeaderDescription>
            {error}
          </PageHeaderDescription>
        </PageHeader>
        <div className="mt-8 flex justify-center">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If audit is null or not completed, show the progress component
  if (!audit || (audit && (audit.issuesSummary?.total === undefined))) {
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
      <div className="mb-6">
        <PageHeader>
          <PageHeaderHeading>Audit Results</PageHeaderHeading>
          <PageHeaderDescription>
            Detailed findings from your website's SEO audit
          </PageHeaderDescription>
        </PageHeader>
      </div>
      <AuditResultsView auditResult={audit} projectId={projectId} />
    </div>
  );
}
