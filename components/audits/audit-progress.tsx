'use client';

import { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuditPolling } from '@/hooks/use-audit-polling';
import { AuditStatus } from '@prisma/client';

interface AuditProgressProps {
  projectId: string;
  className?: string;
}

const statusColors = {
  PENDING: 'bg-yellow-500',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
} as const;

const statusMessages = {
  PENDING: 'Preparing audit...',
  IN_PROGRESS: 'Analyzing website...',
  COMPLETED: 'Audit completed',
  FAILED: 'Audit failed',
} as const;

export function AuditProgress({ projectId, className }: AuditProgressProps) {
  const currentAudit = useAuditPolling(projectId);

  if (!currentAudit) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Site Audit Progress</CardTitle>
          <Badge variant={currentAudit.status === 'FAILED' ? 'destructive' : 'default'}>
            {currentAudit.status}
          </Badge>
        </div>
        <CardDescription>
          {statusMessages[currentAudit.status as AuditStatus]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress 
            value={currentAudit.progressPercentage || 0} 
            className="h-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pages analyzed: {currentAudit.totalPages}</span>
            <span>{currentAudit.progressPercentage}%</span>
          </div>
          {currentAudit.error && (
            <p className="text-sm text-destructive mt-2">{currentAudit.error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}