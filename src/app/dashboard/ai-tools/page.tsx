import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, FileText, BarChart4, Zap } from "lucide-react";
import KeywordResearchTool from "@/components/keywords/keyword-research-tool";

export const metadata: Metadata = {
  title: "AI Tools | SEO SaaS Platform",
  description:
    "AI-powered SEO tools to enhance your content strategy and keyword research",
};

async function getActiveProject() {
  const session = await getServerSession(auth);

  if (!session?.user) {
    return null;
  }

  // For this demo, we'll just return the first project we find
  // In a real application, you would fetch the active project from user preferences
  const projects = await prisma?.project.findMany({
    where: {
      organization: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    take: 1,
  });

  return projects?.[0] || null;
}

export default async function AiToolsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const activeProject = await getActiveProject();

  if (!activeProject) {
    redirect("/dashboard/projects/new");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI SEO Tools
          </h1>
          <p className="text-muted-foreground">
            Leverage the power of AI to enhance your SEO strategy
          </p>
        </div>
      </div>

      <Tabs defaultValue="keyword-research" className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 h-auto gap-4">
          <TabsTrigger
            value="keyword-research"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="flex items-center gap-2 py-1">
              <Search className="h-4 w-4" />
              <span>Keyword Research</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="content-optimizer"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="flex items-center gap-2 py-1">
              <FileText className="h-4 w-4" />
              <span>Content Optimizer</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="audit-insights"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="flex items-center gap-2 py-1">
              <BarChart4 className="h-4 w-4" />
              <span>Audit Insights</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="seo-assistant"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="flex items-center gap-2 py-1">
              <Zap className="h-4 w-4" />
              <span>SEO Assistant</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keyword-research" className="mt-6">
          <KeywordResearchTool projectId={activeProject.id} />
        </TabsContent>

        <TabsContent value="content-optimizer" className="mt-6">
          <div className="p-12 text-center border rounded-md bg-muted/30">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Optimizer</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Analyze your content and get AI-powered recommendations to improve
              your SEO rankings
            </p>
            <div className="text-sm text-muted-foreground">Coming soon!</div>
          </div>
        </TabsContent>

        <TabsContent value="audit-insights" className="mt-6">
          <div className="p-12 text-center border rounded-md bg-muted/30">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <BarChart4 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Audit Insights</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Get AI-powered insights and recommendations based on your site
              audit results
            </p>
            <div className="text-sm text-muted-foreground">Coming soon!</div>
          </div>
        </TabsContent>

        <TabsContent value="seo-assistant" className="mt-6">
          <div className="p-12 text-center border rounded-md bg-muted/30">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">SEO Assistant</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Chat with our AI assistant to get instant answers to your SEO
              questions
            </p>
            <div className="text-sm text-muted-foreground">Coming soon!</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
