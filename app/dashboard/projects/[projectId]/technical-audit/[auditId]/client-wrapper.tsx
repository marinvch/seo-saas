"use client";

import { useAuditPolling } from '@/hooks/use-audit-polling';
import AuditSummary from '../../components/audit/audit-summary';
import { AuditResult } from '@/types/audit-types';

interface AuditClientWrapperProps {
  initialAudit: AuditResult;
}

export default function AuditClientWrapper({ initialAudit }: AuditClientWrapperProps) {
  // Use our polling hook to get real-time updates
  const { audit, loading, error } = useAuditPolling({
    projectId: initialAudit.projectId,
    auditId: initialAudit.id,
    initialAudit,
  });

  // Show error if any
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
        <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">Error</h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  // Use the updated audit data or fall back to initial data
  return <AuditSummary audit={audit || initialAudit} />;
}