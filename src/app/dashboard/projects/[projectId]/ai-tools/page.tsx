import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Brain, Lightbulb, Search } from "lucide-react";
import KeywordResearchTool from "@/components/keywords/keyword-research-tool";
import ContentOptimizer from "@/components/content-audit/content-optimizer";

export const metadata: Metadata = {
  title: "AI SEO Tools | SEO SaaS",
  description: "AI-powered SEO tools to enhance your search engine optimization strategy",
};

interface PageProps {
  params: {
    projectId: string;
  };
}

export default async function AIToolsPage({ params }: PageProps) {
  const { projectId } = params;
  const session = await auth();

  if (!session?.user) {
    return notFound();
  }

  // Get project details
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
  });

  if (!project) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI-Powered SEO Tools
        </h1>
        <p className="text-muted-foreground">
          Leverage artificial intelligence to enhance your SEO strategy for {project.name}
        </p>
      </div>

      <Tabs defaultValue="keyword-research" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="keyword-research" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Keyword Research
          </TabsTrigger>
          <TabsTrigger value="content-optimizer" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Content Optimizer
          </TabsTrigger>
          <TabsTrigger value="seo-recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keyword-research" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">AI Keyword Research</h2>
            <p className="text-muted-foreground">
              Discover relevant keywords for your content strategy using AI-powered suggestions
            </p>
          </div>
          <KeywordResearchTool projectId={projectId} projectUrl={project.url} />
        </TabsContent>

        <TabsContent value="content-optimizer" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Content Optimization</h2>
            <p className="text-muted-foreground">
              Analyze and optimize your content for better search engine rankings
            </p>
          </div>
          <ContentOptimizer />
        </TabsContent>

        <TabsContent value="seo-recommendations" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">AI SEO Insights</h2>
            <p className="text-muted-foreground">
              Get intelligent recommendations based on your site audits
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Select An Audit To View AI Insights</h3>
            <p className="text-muted-foreground mb-4">
              AI insights are generated after completing a technical audit of your site.
            </p>
            <a
              href={`/dashboard/projects/${projectId}/technical-audit`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View Audits
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}