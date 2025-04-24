import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { AuditResult, PageAuditResult } from '@/types/audit-types';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Info,
  Search,
  XCircle,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { ScrollArea } from '../../components/ui/scroll-area';

interface AuditDetailsProps {
  audit: AuditResult;
  projectId: string;
}

export const AuditDetails = ({ audit, projectId }: AuditDetailsProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('issues');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);

  // Get unique issue types for filtering
  const getUniqueIssueTypes = () => {
    if (!audit.pageResults) return [];
    const issueTypes = new Set<string>();
    
    audit.pageResults.forEach((page) => {
      page.issues.forEach((issue) => {
        issueTypes.add(issue.type);
      });
    });
    
    return Array.from(issueTypes);
  };

  // Get all issues from all pages
  const getAllIssues = () => {
    if (!audit.pageResults) return [];
    
    const allIssues = audit.pageResults.flatMap((page) => 
      page.issues.map((issue) => ({
        ...issue,
        url: page.url,
      }))
    );
    
    return allIssues.sort((a, b) => {
      // Sort by severity first
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      
      // Then by issue type
      return a.type.localeCompare(b.type);
    });
  };

  // Filter and search pages
  const filteredPages = () => {
    if (!audit.pageResults) return [];
    
    return audit.pageResults.filter((page) => {
      const matchesSearch = searchTerm === '' || 
        page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.title.toLowerCase().includes(searchTerm.toLowerCase());
        
      return matchesSearch;
    }).sort((a, b) => a.url.localeCompare(b.url));
  };

  // Filter and search issues
  const filteredIssues = () => {
    const allIssues = getAllIssues();
    
    return allIssues.filter((issue) => {
      const matchesSearch = searchTerm === '' || 
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.url.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSeverity = selectedSeverity === null || issue.severity === selectedSeverity;
      const matchesType = selectedIssueType === null || issue.type === selectedIssueType;
        
      return matchesSearch && matchesSeverity && matchesType;
    });
  };

  // Get the severity badge component
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Critical
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-orange-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case 'info':
        return (
          <Badge className="bg-blue-500">
            <Info className="w-3 h-3 mr-1" />
            Info
          </Badge>
        );
      default:
        return null;
    }
  };

  // Toggle expanded page
  const toggleExpandedPage = (url: string) => {
    setExpandedPageUrl(expandedPageUrl === url ? null : url);
  };

  // Page details card
  const renderPageDetails = (page: PageAuditResult) => {
    return (
      <Card className="mb-4">
        <CardHeader className="cursor-pointer" onClick={() => toggleExpandedPage(page.url)}>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base text-primary truncate" title={page.url}>
                {page.title || 'No Title'}
              </CardTitle>
              <CardDescription className="truncate" title={page.url}>
                {page.url}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary text-xs rounded px-2 py-1">
                {page.issues.length} issues
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedPageUrl === page.url ? 'transform rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </CardHeader>
        
        <Collapsible open={expandedPageUrl === page.url}>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Page Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Title</div>
                      <div className="text-muted-foreground">{page.title || 'No Title'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Meta Description</div>
                      <div className="text-muted-foreground">
                        {page.description || 'No Description'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Status</div>
                      <div className="text-muted-foreground">{page.status}</div>
                    </div>
                    <div>
                      <div className="font-medium">Load Time</div>
                      <div className="text-muted-foreground">{page.loadTime}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Content Length</div>
                      <div className="text-muted-foreground">
                        {page.contentLength.toLocaleString()} bytes
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Canonical URL</div>
                      <div className="text-muted-foreground">
                        {page.canonicalUrl || 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Issues</h4>
                  {page.issues.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Severity</TableHead>
                          <TableHead>Issue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {page.issues.map((issue, i) => (
                          <TableRow key={`${issue.type}-${i}`}>
                            <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{issue.type.replaceAll('_', ' ')}</div>
                              <div className="text-muted-foreground text-sm">
                                {issue.description}
                              </div>
                              {issue.recommendation && (
                                <div className="text-green-600 dark:text-green-400 text-sm mt-1">
                                  Recommendation: {issue.recommendation}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No issues found on this page.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Headings</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {page.h1.length > 0 && (
                        <div>
                          <span className="font-medium">H1: </span>
                          {page.h1.join(', ')}
                        </div>
                      )}
                      {page.h2.length > 0 && (
                        <div>
                          <span className="font-medium">H2: </span>
                          {page.h2.join(', ')}
                        </div>
                      )}
                      {page.h3.length > 0 && (
                        <div>
                          <span className="font-medium">H3: </span>
                          {page.h3.join(', ')}
                        </div>
                      )}
                      {page.h1.length === 0 && page.h2.length === 0 && page.h3.length === 0 && (
                        <div>No headings found</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Links</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Internal Links: </span>
                        {page.internalLinks.length}
                      </div>
                      <div>
                        <span className="font-medium">External Links: </span>
                        {page.externalLinks.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(page.url, '_blank')}
                  >
                    Visit Page <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/projects/${projectId}/technical-audit`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Audits
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Audit Results</CardTitle>
          <CardDescription>
            Audit for {audit.siteUrl} - {audit.totalPages} pages analyzed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="issues">Issues ({getAllIssues().length})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({audit.pageResults?.length || 0})</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {activeTab === 'issues' && (
                  <>
                    <div className="w-full sm:w-48">
                      <select
                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={selectedSeverity || ''}
                        onChange={(e) => setSelectedSeverity(e.target.value || null)}
                      >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="error">Error</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div className="w-full sm:w-48">
                      <select
                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={selectedIssueType || ''}
                        onChange={(e) => setSelectedIssueType(e.target.value || null)}
                      >
                        <option value="">All Issue Types</option>
                        {getUniqueIssueTypes().map((type) => (
                          <option key={type} value={type}>
                            {type.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <TabsContent value="issues" className="space-y-4">
                {filteredIssues().length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Severity</TableHead>
                          <TableHead>Issue</TableHead>
                          <TableHead className="w-[300px]">URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIssues().map((issue, i) => (
                          <TableRow key={`${issue.type}-${issue.url}-${i}`}>
                            <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {issue.type.replaceAll('_', ' ')}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {issue.description}
                              </div>
                              {issue.recommendation && (
                                <div className="text-green-600 dark:text-green-400 text-sm mt-1">
                                  {issue.recommendation}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="truncate max-w-[300px]" title={issue.url}>
                              <a
                                href={issue.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                              >
                                {new URL(issue.url).pathname || '/'}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedSeverity || selectedIssueType
                      ? 'No issues match your search criteria.'
                      : 'No issues found in this audit.'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pages" className="space-y-4">
                {filteredPages().length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredPages().map((page) => renderPageDetails(page))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? 'No pages match your search criteria.'
                      : 'No pages in this audit.'}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};