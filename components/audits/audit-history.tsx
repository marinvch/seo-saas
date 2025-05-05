'use client';

import { formatDistanceToNow, formatDistance } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, Download, BarChart2 } from 'lucide-react';
import type { AuditStatus } from '@prisma/client';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AuditRecord {
  id: string;
  status: AuditStatus;
  startedAt: Date;
  completedAt?: Date | null;
  totalPages: number;
  progressPercentage?: number;
}

interface AuditHistoryProps {
  audits: AuditRecord[];
  onViewDetails: (auditId: string) => void;
  className?: string;
}

const statusColors = {
  PENDING: 'bg-yellow-500',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
} as const;

export function AuditHistory({ audits, onViewDetails, className }: AuditHistoryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audit History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell>
                  {formatDistanceToNow(new Date(audit.startedAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={audit.status === 'FAILED' ? 'destructive' : 'default'}
                    className={audit.status !== 'FAILED' ? statusColors[audit.status] : undefined}
                  >
                    {audit.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {audit.completedAt ? (
                    formatDistance(
                      new Date(audit.startedAt),
                      new Date(audit.completedAt)
                    )
                  ) : (
                    audit.progressPercentage ? `${audit.progressPercentage}% complete` : 'N/A'
                  )}
                </TableCell>
                <TableCell>{audit.totalPages}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(audit.id)}
                    >
                      <BarChart2 className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    {audit.status === 'COMPLETED' && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AuditHistoryWithError(props: { projectId: string }) {
  return (
    <ErrorBoundary>
      <AuditHistory {...props} />
    </ErrorBoundary>
  );
}