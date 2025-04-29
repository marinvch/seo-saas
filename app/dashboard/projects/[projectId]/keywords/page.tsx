"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchKeywords,
  selectAllKeywords,
  selectKeywordsLoading,
} from "@/store/slices/keywords-slice";
import {
  fetchProjectById,
  selectSelectedProject,
} from "@/store/slices/projects-slice";
import {
  fetchRankings,
  checkRankings,
  selectAllRankings,
  selectRankingSummary,
  selectRankTrackingLoading,
  selectCheckingRankings,
} from "@/store/slices/rank-tracking-slice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChevronLeft,
  Plus,
  Upload,
  Search,
  BarChart2,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddKeywordDialog } from "@/components/keywords/add-keyword-dialog";
import { KeywordsTable } from "@/components/keywords/keywords-table";
import { KeywordResearchTool } from "@/components/keywords/keyword-research-tool";
import { BulkImportKeywords } from "@/components/keywords/bulk-import-keywords";
import { KeywordDataSummary } from "@/components/keywords/keyword-data-summary";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface KeywordsPageProps {
  params: {
    projectId: string;
  };
}

export default function KeywordsPage({ params }: KeywordsPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manage");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const project = useAppSelector(selectSelectedProject);
  const keywords = useAppSelector(selectAllKeywords);
  const loading = useAppSelector(selectKeywordsLoading);
  
  const rankings = useAppSelector(selectAllRankings);
  const rankingSummary = useAppSelector(selectRankingSummary);
  const rankingsLoading = useAppSelector(selectRankTrackingLoading);
  const checkingRankings = useAppSelector(selectCheckingRankings);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project data if not already loaded
        if (!project || project.id !== params.projectId) {
          await dispatch(fetchProjectById(params.projectId)).unwrap();
        }

        // Load keywords for this project
        await dispatch(fetchKeywords(params.projectId)).unwrap();
        
        // Load rankings data
        await dispatch(fetchRankings(params.projectId)).unwrap();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load project data",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [dispatch, params.projectId, project, toast]);

  const handleAddKeyword = () => {
    setIsDialogOpen(true);
  };

  const handleBulkImport = () => {
    setIsBulkImportOpen(true);
  };
  
  // Handle checking keyword rankings
  const handleCheckRankings = async () => {
    if (!keywords.length) {
      toast({
        title: "No Keywords",
        description: "Please add keywords before checking rankings",
        variant: "destructive",
      });
      return;
    }

    try {
      // Only check rankings for up to 10 keywords at a time to prevent overloading
      const keywordsToCheck = keywords.slice(0, 10);
      
      toast({
        title: "Checking Rankings",
        description: `Checking rankings for ${keywordsToCheck.length} keywords. This may take a minute...`,
      });

      await dispatch(checkRankings({ 
        projectId: params.projectId,
        keywordIds: keywordsToCheck.map(k => k.id)
      })).unwrap();

      toast({
        title: "Success",
        description: "Keyword rankings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to check keyword rankings",
        variant: "destructive",
      });
    }
  };
  
  // Find ranking data for a keyword
  const findRankingForKeyword = (keywordId: string) => {
    return rankings.find(r => r.keywordId === keywordId);
  };

  // Format a date string to a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not checked";
    
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  // Format the average position
  const formatAvgPosition = (position: number | null) => {
    if (position === null) return "--";
    return position.toFixed(1);
  };
  
  // Render a change indicator with appropriate icon
  const renderChangeIndicator = (change: number | null) => {
    if (change === null) return <span>--</span>;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="mr-1 h-4 w-4" />
          <span>+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="mr-1 h-4 w-4" />
          <span>{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="mr-1 h-4 w-4" />
          <span>0</span>
        </div>
      );
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          className="w-fit p-0 h-auto"
          onClick={() => router.push(`/dashboard/projects/${params.projectId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        <h1 className="text-3xl font-bold">Keywords</h1>
        <p className="text-muted-foreground">
          Track and manage keywords for {project?.name || "this project"}.
        </p>
      </div>

      <KeywordDataSummary projectId={params.projectId} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="manage">Manage Keywords</TabsTrigger>
            <TabsTrigger value="research">Keyword Research</TabsTrigger>
            <TabsTrigger value="tracking">Rank Tracking</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            {activeTab === "manage" && (
              <>
                <Button variant="outline" onClick={handleBulkImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
                <Button onClick={handleAddKeyword}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Keyword
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="manage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Keywords</CardTitle>
              <CardDescription>
                Manage your target keywords for this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordsTable
                projectId={params.projectId}
                keywords={keywords}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <KeywordResearchTool projectId={params.projectId} />
        </TabsContent>

        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Keyword Rankings</CardTitle>
                  <CardDescription>
                    Track your position in search results over time.
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleCheckRankings}
                    disabled={checkingRankings || keywords.length === 0}
                  >
                    {checkingRankings ? (
                      <>
                        <span className="animate-spin mr-2">⋯</span>
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check Rankings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Keywords to Track</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    Add keywords in the "Manage Keywords" tab to start tracking their rankings
                    in search results over time.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab("manage")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Keywords
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Position</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatAvgPosition(rankingSummary.averagePosition)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rankingSummary.averagePosition === null 
                            ? "No data available yet" 
                            : "Average position across all keywords"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Keywords in Top 10</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{rankingSummary.keywordsInTop10}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Out of {keywords.length} keywords
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {rankingSummary.lastUpdated 
                            ? new Date(rankingSummary.lastUpdated).toLocaleDateString() 
                            : "--"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rankingSummary.lastUpdated 
                            ? new Date(rankingSummary.lastUpdated).toLocaleTimeString() 
                            : "Rankings not checked yet"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Keyword Rankings</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead className="text-center">Current Position</TableHead>
                            <TableHead className="text-center">Previous</TableHead>
                            <TableHead className="text-center">Change</TableHead>
                            <TableHead className="text-center">URL</TableHead>
                            <TableHead className="text-right">Last Checked</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keywords.map((keyword) => {
                            const rankingData = findRankingForKeyword(keyword.id);
                            return (
                              <TableRow key={keyword.id}>
                                <TableCell className="font-medium">{keyword.keyword}</TableCell>
                                <TableCell className="text-center">
                                  {rankingData?.rank !== null && rankingData?.rank !== undefined
                                    ? (
                                        <Badge variant={rankingData.rank <= 10 ? "default" : "secondary"}>
                                          {rankingData.rank}
                                        </Badge>
                                      )
                                    : "--"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {rankingData?.previousRank || "--"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {renderChangeIndicator(rankingData?.change || null)}
                                </TableCell>
                                <TableCell className="text-center max-w-[150px] truncate">
                                  {rankingData?.url ? (
                                    <a 
                                      href={rankingData.url}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="text-blue-600 hover:underline truncate block"
                                    >
                                      {new URL(rankingData.url).pathname}
                                    </a>
                                  ) : "--"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {rankingData ? formatDate(rankingData.date) : "Not checked"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddKeywordDialog
        projectId={params.projectId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <BulkImportKeywords
        projectId={params.projectId}
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />
    </div>
  );
}
