"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  ArrowUpDown, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  Trash2, 
  XCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDispatch } from 'react-redux';
import { deleteAudit } from '@/store/slices/audits-slice';

interface AuditHistoryProps {
  projectId: string;
}

interface AuditItem {
  id: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  totalPages: number;
  issuesSummary: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}

export default function AuditHistory({ projectId }: AuditHistoryProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch audits for this project
  useEffect(() => {
    async function fetchAudits() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/audits`);
        
        if (response.ok) {
          const data = await response.json();
          setAudits(data);
        } else {
          console.error('Failed to fetch audits');
          toast({
            title: 'Error',
            description: 'Failed to load audit history',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching audits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudits();
  }, [projectId]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  // Sort audits based on current sort order
  const sortedAudits = [...audits].sort((a, b) => {
    const aDate = new Date(a.startedAt).getTime();
    const bDate = new Date(b.startedAt).getTime();
    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  // Handle audit deletion
  const handleDeleteAudit = async (auditId: string) => {
    try {
      await dispatch(deleteAudit({ projectId, auditId }) as any);
      
      // Update local state
      setAudits(audits.filter(audit => audit.id !== auditId));
      
      toast({
        title: 'Audit Deleted',
        description: 'The audit has been successfully deleted',
      });
      
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete audit',
        variant: 'destructive',
      });
    }
  };

  // Get status badge for an audit
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed') {
      return <Badge className="bg-green-600">Completed</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge variant="outline">Pending</Badge>;
    } else if (statusLower === 'running' || statusLower === 'in_progress') {
      return <Badge className="bg-blue-600">In Progress</Badge>;
    } else if (statusLower === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    
    return <Badge>{status}</Badge>;
  };

  // Get status icon for an audit
  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (statusLower === 'pending') {
      return <Clock className="h-5 w-5 text-slate-400" />;
    } else if (statusLower === 'running' || statusLower === 'in_progress') {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin-slow" />;
    } else if (statusLower === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  };

  // Calculate total issues for an audit
  const getTotalIssues = (issuesSummary: AuditItem['issuesSummary']) => {
    return (
      issuesSummary.critical +
      issuesSummary.error +
      issuesSummary.warning +
      issuesSummary.info
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            Past technical audits for this project
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Button>
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}/technical-audit/new`}>
              New Audit
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading audit history...</p>
            </div>
          </div>
        ) : sortedAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No audits found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This project doesn't have any technical audits yet.
            </p>
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/technical-audit/new`}>
                Run Your First Audit
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {sortedAudits.map((audit) => (
              <div
                key={audit.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(audit.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        Audit {audit.id.substring(0, 8)}
                      </span>
                      {getStatusBadge(audit.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Started: {format(new Date(audit.startedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                    {audit.completedAt && (
                      <p className="text-sm text-muted-foreground">
                        Completed: {format(new Date(audit.completedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  {audit.status.toLowerCase() === 'completed' && (
                    <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 space-y-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Pages:</span>
                        <span>{audit.totalPages}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Issues:</span>
                        <span>{getTotalIssues(audit.issuesSummary)}</span>
                      </div>
                      {audit.issuesSummary.critical > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-red-500">Critical:</span>
                          <span className="text-red-500">{audit.issuesSummary.critical}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Link href={`/dashboard/projects/${projectId}/technical-audit/${audit.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 w-full sm:w-auto"
                      onClick={() => setDeleteConfirm(audit.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone and all audit data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteAudit(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}