import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
    selectCurrentAudit, 
    fetchAuditStatus,
    clearCurrentAudit 
} from '@/store/slices/audits-slice';

const POLLING_INTERVAL = 5000; // 5 seconds

export function useAuditPolling(projectId: string) {
    const dispatch = useAppDispatch();
    const currentAudit = useAppSelector(selectCurrentAudit);
    const pollingRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (currentAudit?.id && ['PENDING', 'IN_PROGRESS'].includes(currentAudit.status)) {
            // Start polling
            pollingRef.current = setInterval(() => {
                dispatch(fetchAuditStatus({ 
                    projectId, 
                    auditId: currentAudit.id 
                }));
            }, POLLING_INTERVAL);

            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
            };
        } else if (currentAudit?.status === 'COMPLETED' || currentAudit?.status === 'FAILED') {
            // Stop polling when audit is complete or failed
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        }
    }, [dispatch, projectId, currentAudit?.id, currentAudit?.status]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
            dispatch(clearCurrentAudit());
        };
    }, [dispatch]);

    return currentAudit;
}