"use client";

import { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateAudit, updateAuditProgress } from '../store/slices/audits-slice';

interface UseAuditPollingOptions {
  auditId: string;
  projectId: string;
  enabled?: boolean;
  interval?: number;
}

/**
 * Custom hook for polling audit status
 * This will periodically check the status and progress of an audit and update the Redux store
 */
export function useAuditPolling({
  auditId, 
  projectId, 
  enabled = true,
  interval = 3000 // Poll more frequently
}: UseAuditPollingOptions) {
  const [isPolling, setIsPolling] = useState(false);  const [error, setError] = useState<Error | null>(null);
  const [auditStatus, setAuditStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Don't poll if disabled or missing IDs
    if (!enabled || !auditId || !projectId) return;

    // Track if component is mounted to avoid state updates after unmount
    let isMounted = true;
    setIsPolling(true);
    setError(null);

    const pollAudit = async () => {
      try {
        // Fetch the audit progress data from the new endpoint
        const response = await fetch(`/api/projects/${projectId}/audits/${auditId}/progress`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit progress');
        }
        
        const progressData = await response.json();
        
        // Only update if component is still mounted
        if (!isMounted) return;
        
        // Update state with audit status and progress
        setAuditStatus(progressData.status);
        
        // Update progress based on the actual progress from the server
        if (progressData.progress !== undefined) {
          setProgress(progressData.progress);
          
          // Update redux store with the progress
          dispatch(updateAuditProgress({ 
            auditId, 
            progress: progressData.progress 
          }));
        }
        
        // For completed or failed audits, fetch the full audit details
        if (progressData.status === 'COMPLETED' || progressData.status === 'FAILED') {
          const auditResponse = await fetch(`/api/projects/${projectId}/audits/${auditId}`);
          
          if (auditResponse.ok) {
            const auditData = await auditResponse.json();
            dispatch(updateAudit(auditData));
          }
          
          // Stop polling once completed or failed
          setIsPolling(false);
        } else {
          // If audit is still in progress, continue polling
          setTimeout(pollAudit, interval);
        }
      } catch (error) {
        console.error('Error polling audit status:', error);
        
        if (isMounted) {
          setError(error instanceof Error ? error : new Error('Unknown error'));
          // Continue polling even with errors (might be temporary issues)
          setTimeout(pollAudit, interval * 2); // Back off a bit on errors
        }
      }
    };
    
    // Start polling
    pollAudit();
    
    // Cleanup function
    return () => {
      isMounted = false;
      setIsPolling(false);
    };
  }, [auditId, projectId, enabled, interval, dispatch]);

  return { isPolling, auditStatus, progress, error };
}