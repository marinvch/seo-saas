'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface SEOIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  affectedUrls?: string[];
}

interface SEOIssuesSummaryProps {
  issues: SEOIssue[];
  totalPages: number;
  className?: string;
}

const severityIcons = {
  critical: <AlertCircle className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <CheckCircle className="h-5 w-5 text-green-500" />,
};

const severityLabels = {
  critical: 'Critical Issues',
  warning: 'Warnings',
  info: 'Passed Checks',
};

export function SEOIssuesSummary({ issues, totalPages, className }: SEOIssuesSummaryProps) {
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, SEOIssue[]>);

  const getCriticalCount = () => groupedIssues.critical?.length || 0;
  const getWarningCount = () => groupedIssues.warning?.length || 0;
  const getPassedCount = () => groupedIssues.info?.length || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>SEO Analysis Results</CardTitle>
        <CardDescription>
          Found {getCriticalCount()} critical issues and {getWarningCount()} warnings across {totalPages} pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="destructive" className="mb-2">
                {getCriticalCount()} Critical
              </Badge>
              <p className="text-sm text-muted-foreground">Need immediate attention</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2 bg-yellow-500">
                {getWarningCount()} Warnings
              </Badge>
              <p className="text-sm text-muted-foreground">Should be addressed</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2 bg-green-500">
                {getPassedCount()} Passed
              </Badge>
              <p className="text-sm text-muted-foreground">Good practices</p>
            </div>
          </div>

          {/* Detailed Issues */}
          <Accordion type="single" collapsible className="w-full">
            {(Object.keys(severityLabels) as Array<keyof typeof severityLabels>).map((severity) => (
              groupedIssues[severity]?.length > 0 && (
                <AccordionItem value={severity} key={severity}>
                  <AccordionTrigger className="flex items-center gap-2">
                    {severityIcons[severity]}
                    <span>{severityLabels[severity]} ({groupedIssues[severity].length})</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {groupedIssues[severity].map((issue, index) => (
                        <Alert key={index} variant={severity === 'critical' ? 'destructive' : 'default'}>
                          <AlertTitle>{issue.message}</AlertTitle>
                          {issue.details && (
                            <AlertDescription>{issue.details}</AlertDescription>
                          )}
                          {issue.affectedUrls && issue.affectedUrls.length > 0 && (
                            <AlertDescription className="mt-2">
                              <strong>Affected URLs:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                {issue.affectedUrls.slice(0, 3).map((url, i) => (
                                  <li key={i} className="text-sm">{url}</li>
                                ))}
                                {issue.affectedUrls.length > 3 && (
                                  <li className="text-sm">
                                    And {issue.affectedUrls.length - 3} more...
                                  </li>
                                )}
                              </ul>
                            </AlertDescription>
                          )}
                        </Alert>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SEOIssuesSummaryWithError(props: SEOIssuesSummaryProps) {
  return (
    <ErrorBoundary>
      <SEOIssuesSummary {...props} />
    </ErrorBoundary>
  );
}