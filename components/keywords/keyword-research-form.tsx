"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "../ui/use-toast";
import { Loader2, ArrowRight, Plus } from "lucide-react";
import { KeywordResearchResult } from "../../types/keyword-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";

// Form schema for keyword research
const keywordResearchSchema = z.object({
  seed: z.string().min(1, "Please enter a seed keyword"),
  countryCode: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().int().min(5).max(100).optional(),
});

interface KeywordResearchFormProps {
  projectId: string;
  defaultCountry?: string;
  defaultLanguage?: string;
  onAddKeywords?: (keywords: string[]) => void;
}

export default function KeywordResearchForm({
  projectId,
  defaultCountry,
  defaultLanguage,
  onAddKeywords,
}: KeywordResearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<KeywordResearchResult[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Setup form with default values
  const form = useForm<z.infer<typeof keywordResearchSchema>>({
    resolver: zodResolver(keywordResearchSchema),
    defaultValues: {
      seed: "",
      countryCode: defaultCountry || "us",
      language: defaultLanguage || "en",
      limit: 20,
    },
  });

  // Submit handler
  async function onSubmit(values: z.infer<typeof keywordResearchSchema>) {
    setIsLoading(true);
    setResults([]);
    setSelectedKeywords([]);

    try {
      // Make API call to research keywords
      const response = await fetch(
        `/api/projects/${projectId}/keywords/research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to research keywords");
      }

      // Update results
      setResults(data.results || []);

      // Pre-select the first 5 keywords
      if (data.results && data.results.length > 0) {
        setSelectedKeywords(data.results.slice(0, 5).map(r => r.keyword));
      }
    } catch (error) {
      console.error("Error researching keywords:", error);
      toast({
        title: "Error researching keywords",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle adding selected keywords
  const handleAddSelectedKeywords = () => {
    if (selectedKeywords.length === 0) {
      toast({
        title: "No keywords selected",
        description: "Please select at least one keyword to add",
        variant: "destructive",
      });
      return;
    }

    if (onAddKeywords) {
      onAddKeywords(selectedKeywords);
    }
  };

  // Function to handle checkbox toggle
  const handleToggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  // Function to toggle all keywords
  const handleToggleAll = () => {
    if (selectedKeywords.length === results.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(results.map(r => r.keyword));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Research</CardTitle>
        <CardDescription>
          Discover new keyword opportunities for your project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="seed"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Seed Keyword</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. digital marketing"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a keyword to find related terms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="gb">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="es">Spain</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Results</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Number of results" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 keywords</SelectItem>
                          <SelectItem value="20">20 keywords</SelectItem>
                          <SelectItem value="50">50 keywords</SelectItem>
                          <SelectItem value="100">100 keywords</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  Research Keywords
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Research Results ({results.length} keywords)
              </h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleToggleAll}
                >
                  {selectedKeywords.length === results.length ? "Deselect All" : "Select All"}
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAddSelectedKeywords}
                  disabled={selectedKeywords.length === 0}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {selectedKeywords.length} Keywords
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedKeywords.length === results.length && results.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Intent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.keyword}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedKeywords.includes(result.keyword)}
                          onCheckedChange={() => handleToggleKeyword(result.keyword)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{result.keyword}</TableCell>
                      <TableCell>
                        {result.searchVolume !== undefined 
                          ? result.searchVolume.toLocaleString() 
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {result.cpc !== undefined
                          ? `$${result.cpc.toFixed(2)}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {result.difficulty !== undefined 
                          ? (
                              <div className="flex items-center">
                                <span className="mr-2">{result.difficulty}/100</span>
                                <div className="w-16 h-2 rounded-full bg-gray-200">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      result.difficulty < 30
                                        ? "bg-green-500"
                                        : result.difficulty < 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${result.difficulty}%` }}
                                  />
                                </div>
                              </div>
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {result.intent && (
                          <Badge variant={
                            result.intent === "informational" 
                              ? "outline" 
                              : result.intent === "commercial"
                              ? "secondary" 
                              : result.intent === "transactional"
                              ? "default"
                              : "outline"
                          }>
                            {result.intent}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}