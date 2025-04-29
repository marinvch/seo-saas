import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchAuditStatus } from '@/store/slices/audit-slice';
import type { AuditStatus } from '@prisma/client';

interface AuditPollingResult {
  id: string;
  status: AuditStatus;
  totalPages: number;
  progressPercentage?: number;
  error?: string;
}

export function useAuditPolling(projectId: string) {
  const dispatch = useAppDispatch();
  const [currentAudit, setCurrentAudit] = useState<AuditPollingResult | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    const pollAudit = async () => {
      try {
        const result = await dispatch(fetchAuditStatus(projectId)).unwrap();
        
        if (isMounted) {
          setCurrentAudit({
            id: result.id,
            status: result.status,
            totalPages: result.totalPages,
            progressPercentage: result.progressPercentage,
            error: result.errorMessage,
          });

          // Stop polling if audit is complete or failed
          if (result.status === 'COMPLETED' || result.status === 'FAILED') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling audit status:', error);
        if (isMounted) {
          clearInterval(interval);
        }
      }
    };

    // Initial poll
    pollAudit();

    // Set up polling interval (every 5 seconds)
    interval = setInterval(pollAudit, 5000);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dispatch, projectId]);

  return currentAudit;
}