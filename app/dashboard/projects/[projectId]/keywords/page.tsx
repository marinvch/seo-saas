"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Loader2, PlusCircle, Wand2 } from "lucide-react";
import KeywordList from "../../components/keywords/keyword-list";
import AddKeywordsForm from "../../components/keywords/add-keywords-form";
import KeywordResearchForm from "../../components/keywords/keyword-research-form";
import { KeywordData } from "@/types/keyword-types";

export default function KeywordsPage() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [showAddKeywords, setShowAddKeywords] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  useEffect(() => {
    const fetchKeywords = async () => {
      if (typeof projectId !== "string") return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/keywords`);
        if (!response.ok) {
          throw new Error("Failed to load keywords");
        }
        const data = await response.json();
        setKeywords(data.keywords || []);
      } catch (error) {
        console.error("Error loading keywords:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeywords();
  }, [projectId]);

  const handleAddKeywordsSuccess = () => {
    setShowAddKeywords(false);
    setActiveTab("list");
    // After adding keywords, refresh happens when the list tab is displayed
    // through the KeywordList component's own useEffect
  };

  const handleResearchAddKeywords = (selectedKeywords: string[]) => {
    setShowAddKeywords(true);
    setShowResearch(false);
    setActiveTab("add");
    // The keywords are passed to the AddKeywordsForm component in its textarea
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Keywords Management</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setShowAddKeywords(true);
              setShowResearch(false);
              setActiveTab("add");
            }}
            variant={showAddKeywords ? "secondary" : "default"}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Keywords
          </Button>
          <Button
            onClick={() => {
              setShowResearch(true);
              setShowAddKeywords(false);
              setActiveTab("research");
            }}
            variant={showResearch ? "secondary" : "outline"}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Research
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Keyword List</TabsTrigger>
          <TabsTrigger value="add">Add Keywords</TabsTrigger>
          <TabsTrigger value="research">Keyword Research</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <KeywordList 
              projectId={projectId as string} 
              initialKeywords={keywords}
            />
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <AddKeywordsForm
            projectId={projectId as string}
            onSuccess={handleAddKeywordsSuccess}
          />
        </TabsContent>

        <TabsContent value="research" className="mt-6">
          <KeywordResearchForm
            projectId={projectId as string}
            onAddKeywords={handleResearchAddKeywords}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}