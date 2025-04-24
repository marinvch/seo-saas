'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startSiteAudit,
  fetchAuditHistory,
  selectCurrentAudit,
  selectAuditHistory,
  selectAuditLoading,
} from '@/store/slices/audits-slice';
import { Button } from '@/components/ui/button';
import { AuditProgress } from '@/components/audits/audit-progress';
import { SEOIssuesSummary } from '@/components/audits/seo-issues-summary';
import { AuditHistory } from '@/components/audits/audit-history';
import { Play, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AuditDashboard() {
  const { projectId } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const currentAudit = useAppSelector(selectCurrentAudit);
  const auditHistory = useAppSelector(selectAuditHistory);
  const isLoading = useAppSelector(selectAuditLoading);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchAuditHistory(projectId as string));
    }
  }, [dispatch, projectId]);

  const handleStartAudit = async () => {
    if (!projectId) return;

    try {
      await dispatch(startSiteAudit({ 
        projectId: projectId as string,
        options: {
          maxPages: 1000,
          ignoreRobotsTxt: false
        }
      })).unwrap();
      
      toast({
        title: "Audit Started",
        description: "The site audit has been initiated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Starting Audit",
        description: "Failed to start the site audit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (auditId: string) => {
    router.push(`/dashboard/projects/${projectId}/audits/${auditId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Site Audit</h1>
        <Button 
          onClick={handleStartAudit} 
          disabled={isLoading || currentAudit?.status === 'IN_PROGRESS'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Start New Audit
        </Button>
      </div>

      {/* Current Audit Progress */}
      {currentAudit && ['PENDING', 'IN_PROGRESS'].includes(currentAudit.status) && (
        <AuditProgress 
          projectId={projectId as string} 
          className="mb-6"
        />
      )}

      {/* Latest Audit Results */}
      {currentAudit?.status === 'COMPLETED' && currentAudit.issuesSummary && (
        <SEOIssuesSummary 
          issues={currentAudit.issuesSummary.issues}
          totalPages={currentAudit.totalPages}
          className="mb-6"
        />
      )}

      {/* Audit History */}
      <AuditHistory 
        audits={auditHistory}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}