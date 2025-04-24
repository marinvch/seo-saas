"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Keyword, KeywordRanking } from "../../types/keyword-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { toast } from "../ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Tag,
  ArrowUpDown,
  Search,
  X,
  BarChart4,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface KeywordListProps {
  projectId: string;
  initialKeywords?: Keyword[];
}

export default function KeywordList({
  projectId,
  initialKeywords = [],
}: KeywordListProps) {
  const router = useRouter();
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<string>("keyword");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [tagDialogOpen, setTagDialogOpen] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const pageSize = 20;

  // Fetch keywords on component mount and when dependencies change
  useEffect(() => {
    fetchKeywords();
  }, [projectId, searchQuery, sortField, sortDirection, page]);

  // Collect available tags from all keywords
  useEffect(() => {
    const tags = new Set<string>();
    keywords.forEach(keyword => {
      if (keyword.tags) {
        keyword.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags).sort());
  }, [keywords]);

  // Fetch keywords from API
  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        sort: `${sortField}:${sortDirection}`,
        page: page.toString(),
        limit: pageSize.toString(),
      });

      const response = await fetch(
        `/api/projects/${projectId}/keywords?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch keywords");
      }

      const data = await response.json();
      setKeywords(data.keywords || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Error fetching keywords:", error);
      toast({
        title: "Error fetching keywords",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1); // Reset to first page when sort changes
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle selecting all keywords on current page
  const handleSelectAll = () => {
    if (selectedKeywords.length === keywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(keywords.map(k => k.id));
    }
  };

  // Handle selecting a single keyword
  const handleSelectKeyword = (id: string) => {
    setSelectedKeywords(prev =>
      prev.includes(id)
        ? prev.filter(k => k !== id)
        : [...prev, id]
    );
  };

  // Delete selected keywords
  const deleteSelectedKeywords = async () => {
    if (selectedKeywords.length === 0) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywordIds: selectedKeywords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete keywords");
      }

      toast({
        title: "Keywords deleted",
        description: `Successfully deleted ${data.deletedCount} keywords`,
      });

      // Refresh keywords list
      fetchKeywords();
      setSelectedKeywords([]);
    } catch (error) {
      console.error("Error deleting keywords:", error);
      toast({
        title: "Error deleting keywords",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }

    // Close delete dialog
    setDeleteDialogOpen(false);
  };

  // Add tag to selected keywords
  const addTagToSelectedKeywords = async () => {
    if (selectedKeywords.length === 0 || !selectedTag) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywordIds: selectedKeywords,
          tags: [selectedTag],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update keywords");
      }

      toast({
        title: "Keywords updated",
        description: `Added tag "${selectedTag}" to ${selectedKeywords.length} keywords`,
      });

      // Refresh keywords list
      fetchKeywords();
      setSelectedTag("");
    } catch (error) {
      console.error("Error updating keywords:", error);
      toast({
        title: "Error updating keywords",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }

    // Close tag dialog
    setTagDialogOpen(false);
  };

  // Format ranking trend
  const formatRankingTrend = (current?: number, previous?: number) => {
    if (current === undefined || previous === undefined) {
      return null;
    }
    
    const diff = previous - current; // Positive means rank improved (moved up)
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ChevronUp size={16} />
          <span>{diff}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ChevronDown size={16} />
          <span>{Math.abs(diff)}</span>
        </div>
      );
    } else {
      return <span className="text-gray-400">–</span>;
    }
  };

  // Render keyword position
  const renderPosition = (ranking?: KeywordRanking) => {
    if (!ranking || ranking.position === undefined) {
      return <span className="text-gray-400">N/A</span>;
    }
    
    if (ranking.position === 0 || ranking.position > 100) {
      return <span className="text-gray-400">100+</span>;
    }
    
    return <span>{ranking.position}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search keywords..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            disabled={selectedKeywords.length === 0}
          >
            <Tag className="mr-1.5 h-4 w-4" />
            Add Tag
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={selectedKeywords.length === 0}
          >
            <Trash className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedKeywords.length > 0 && selectedKeywords.length === keywords.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all keywords"
                />
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("keyword")}
                >
                  Keyword
                  {sortField === "keyword" && (
                    sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("rankings.position")}
                >
                  Position
                  {sortField === "rankings.position" && (
                    sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </TableHead>
              <TableHead>Change</TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("searchVolume")}
                >
                  Volume
                  {sortField === "searchVolume" && (
                    sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <p>Loading keywords...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : keywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchQuery ? (
                    <p>No keywords match your search</p>
                  ) : (
                    <div className="space-y-2">
                      <p>No keywords found for this project</p>
                      <Button
                        variant="link"
                        onClick={() => router.push(`/dashboard/projects/${projectId}/keywords/add`)}
                      >
                        Add your first keywords
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              keywords.map((keyword) => (
                <TableRow key={keyword.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedKeywords.includes(keyword.id)}
                      onCheckedChange={() => handleSelectKeyword(keyword.id)}
                      aria-label={`Select ${keyword.keyword}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{keyword.keyword}</TableCell>
                  <TableCell>{renderPosition(keyword.latestRanking)}</TableCell>
                  <TableCell>
                    {keyword.latestRanking && keyword.previousRanking &&
                      formatRankingTrend(
                        keyword.latestRanking.position,
                        keyword.previousRanking.position
                      )
                    }
                  </TableCell>
                  <TableCell>
                    {keyword.searchVolume !== undefined
                      ? keyword.searchVolume.toLocaleString()
                      : "N/A"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {keyword.tags && keyword.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="max-w-[100px] truncate">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/projects/${projectId}/keywords/${keyword.id}`)
                          }
                        >
                          <BarChart4 className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKeywords([keyword.id]);
                            setTagDialogOpen(true);
                          }}
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          Add Tag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKeywords([keyword.id]);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keywords</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedKeywords.length} keyword
              {selectedKeywords.length === 1 ? '' : 's'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteSelectedKeywords}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add a tag to {selectedKeywords.length} selected keyword
              {selectedKeywords.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="tag"
                className="text-right text-sm font-medium col-span-1"
              >
                Tag
              </label>
              <div className="col-span-3">
                <Select
                  value={selectedTag}
                  onValueChange={setSelectedTag}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or create a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create__">
                      + Create new tag
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedTag === "__create__" && (
                  <Input
                    id="newTag"
                    placeholder="Enter new tag"
                    className="mt-2"
                    onChange={(e) => setSelectedTag(e.target.value)}
                    value=""
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTagToSelectedKeywords} disabled={!selectedTag || selectedTag === "__create__"}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}