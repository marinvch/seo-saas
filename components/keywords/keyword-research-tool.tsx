"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { KeywordSuggestion } from "../../lib/ai/gemini-service";
import { useAppDispatch } from "../../store/hooks";
import { addKeywords } from "../../store/slices/keywords-slice";

// Define country options for keyword research
const COUNTRIES = [
  { value: "global", label: "Global" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "br", label: "Brazil" },
  { value: "in", label: "India" },
];

// Categories for keyword tabs
const KEYWORD_CATEGORIES = [
  { id: "mainKeywords", label: "Main Keywords" },
  { id: "relatedKeywords", label: "Related Keywords" },
  { id: "longTailKeywords", label: "Long-Tail Keywords" },
  { id: "questions", label: "Questions" },
];

interface KeywordResearchToolProps {
  projectId: string;
  projectName?: string;
  projectUrl?: string;
}

export default function KeywordResearchTool({
  projectId,
  projectName,
}: KeywordResearchToolProps) {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("global");
  const [activeTab, setActiveTab] = useState("mainKeywords");
  const [keywordResults, setKeywordResults] = useState<
    Record<string, KeywordSuggestion[]>
  >({
    mainKeywords: [],
    relatedKeywords: [],
    longTailKeywords: [],
    questions: [],
  });
  const [selectedKeywords, setSelectedKeywords] = useState<
    Record<string, Set<string>>
  >({
    mainKeywords: new Set(),
    relatedKeywords: new Set(),
    longTailKeywords: new Set(),
    questions: new Set(),
  });
  const [progress, setProgress] = useState(0);

  // Get currently active keywords list based on selected tab
  const activeKeywords =
    keywordResults[activeTab as keyof typeof keywordResults] || [];

  // Handle keyword selection
  const toggleKeywordSelection = (keyword: string, category: string) => {
    setSelectedKeywords((prev) => {
      const newSelection = { ...prev };
      const categorySet = new Set(
        newSelection[category as keyof typeof newSelection]
      );

      if (categorySet.has(keyword)) {
        categorySet.delete(keyword);
      } else {
        categorySet.add(keyword);
      }

      newSelection[category as keyof typeof newSelection] = categorySet;
      return newSelection;
    });
  };

  // Count total selected keywords across all categories
  const getTotalSelectedCount = () => {
    return Object.values(selectedKeywords).reduce(
      (sum, set) => sum + set.size,
      0
    );
  };

  // Simulated progress for better UX during AI generation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90% to simulate waiting for API
          const increment = prev < 30 ? 5 : prev < 70 ? 3 : prev < 85 ? 1 : 0.5;
          const newValue = Math.min(prev + increment, 90);
          return newValue;
        });
      }, 200);
    } else {
      setProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword or topic to research",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setKeywordResults({
      mainKeywords: [],
      relatedKeywords: [],
      longTailKeywords: [],
      questions: [],
    });

    try {
      const response = await fetch("/api/keyword-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          country,
          projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to generate keyword suggestions"
        );
      }

      const data = await response.json();

      if (data?.results) {
        setKeywordResults(data.results);

        // Reset selections
        setSelectedKeywords({
          mainKeywords: new Set(),
          relatedKeywords: new Set(),
          longTailKeywords: new Set(),
          questions: new Set(),
        });

        toast({
          title: "Success",
          description: "Keyword suggestions generated successfully",
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to generate keywords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save selected keywords to the project
  const handleSaveKeywords = async () => {
    const totalSelected = getTotalSelectedCount();

    if (totalSelected === 0) {
      toast({
        title: "No keywords selected",
        description: "Please select at least one keyword to save",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare keywords to save
      const keywordsToSave = Object.entries(selectedKeywords).flatMap(
        ([category, keywordSet]) => {
          return Array.from(keywordSet).map((keyword) => {
            const keywordData = keywordResults[
              category as keyof typeof keywordResults
            ].find((k) => k.keyword === keyword);

            return {
              keyword: keywordData?.keyword || "",
              volume: keywordData?.searchVolume,
              difficulty: keywordData?.competition,
              cpc: keywordData?.cpc,
              intent: keywordData?.category,
            };
          });
        }
      );

      // Call API to add keywords to project
      const response = await fetch(
        `/api/projects/${projectId}/keywords/bulk-add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keywords: keywordsToSave,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save keywords");
      }

      // Update Redux state
      if (data.keywords) {
        dispatch(
          addKeywords({
            projectId,
            keywords: data.keywords,
          })
        );
      }

      toast({
        title: "Keywords saved",
        description: `Successfully added ${keywordsToSave.length} keywords to your project`,
      });

      // Reset selections
      setSelectedKeywords({
        mainKeywords: new Set(),
        relatedKeywords: new Set(),
        longTailKeywords: new Set(),
        questions: new Set(),
      });

      // Optionally navigate to keywords page
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to save keywords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Keyword Research</CardTitle>
          <CardDescription>
            Generate keyword ideas for{" "}
            {projectName ? `"${projectName}"` : "your project"} using advanced
            AI. Our system analyzes search patterns and competition to suggest
            the most valuable keywords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <div className="md:col-span-3">
                <Input
                  placeholder="Enter a topic or seed keyword"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div>
                <Select
                  value={country}
                  onValueChange={setCountry}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full"
            >
              {isLoading ? "Generating..." : "Generate Keyword Ideas"}
            </Button>

            {isLoading && (
              <div className="w-full space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Analyzing topic and generating keyword suggestions...
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {!isLoading && activeKeywords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Keyword Suggestions</CardTitle>
            <CardDescription>
              Found {Object.values(keywordResults).flat().length} keywords
              across 4 categories. Select keywords to add to your project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="mainKeywords"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                {KEYWORD_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="relative"
                  >
                    {category.label}
                    {selectedKeywords[
                      category.id as keyof typeof selectedKeywords
                    ].size > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {
                          selectedKeywords[
                            category.id as keyof typeof selectedKeywords
                          ].size
                        }
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {KEYWORD_CATEGORIES.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="border rounded-md p-4"
                >
                  <h3 className="font-medium text-sm mb-2">{category.label}</h3>
                  <ScrollArea className="h-[350px]">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-medium">
                            Select
                          </th>
                          <th className="text-left py-2 px-3 text-xs font-medium">
                            Keyword
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            Volume
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            Difficulty
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            CPC ($)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywordResults[category.id]?.map((keyword, idx) => (
                          <tr
                            key={`${category.id}-${idx}`}
                            className="border-b border-muted hover:bg-muted/50"
                          >
                            <td className="py-2 px-3">
                              <Checkbox
                                checked={selectedKeywords[
                                  category.id as keyof typeof selectedKeywords
                                ].has(keyword.keyword)}
                                onCheckedChange={() =>
                                  toggleKeywordSelection(
                                    keyword.keyword,
                                    category.id
                                  )
                                }
                                id={`${category.id}-${idx}`}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <label
                                htmlFor={`${category.id}-${idx}`}
                                className="cursor-pointer hover:underline"
                              >
                                {keyword.keyword}
                              </label>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {keyword.searchVolume?.toLocaleString() || "N/A"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`inline-block w-12 text-center rounded-full px-2 py-0.5 text-xs ${
                                  (keyword.competition || 0) < 0.3
                                    ? "bg-green-100 text-green-800"
                                    : (keyword.competition || 0) < 0.7
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {typeof keyword.competition === "number"
                                  ? Math.round(keyword.competition * 100)
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              $
                              {typeof keyword.cpc === "number"
                                ? keyword.cpc.toFixed(2)
                                : "N/A"}
                            </td>
                          </tr>
                        ))}

                        {keywordResults[category.id]?.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No keywords found in this category
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {getTotalSelectedCount()} keywords selected
            </div>
            <Button
              onClick={handleSaveKeywords}
              disabled={getTotalSelectedCount() === 0}
            >
              Save Selected Keywords
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
