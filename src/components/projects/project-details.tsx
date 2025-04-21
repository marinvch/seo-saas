"use client";

import { useState } from "react";
import Link from "next/link";
import { Project } from "@prisma/client";
import { format } from "date-fns";
import { ExternalLink, Settings, BarChart2, FileText, Search, Globe, Users, PieChart, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectDetailsProps {
  project: Project;
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to get project type badge
  const getProjectTypeBadge = (type: string) => {
    switch(type) {
      case "WEBSITE":
        return <Badge variant="default">Website</Badge>;
      case "BLOG":
        return <Badge variant="secondary">Blog</Badge>;
      case "ECOMMERCE":
        return <Badge className="bg-green-600">E-commerce</Badge>;
      case "SOCIAL_MEDIA":
        return <Badge className="bg-blue-600">Social Media</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {getProjectTypeBadge(project.type)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline dark:text-blue-400"
            >
              {project.url} <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created on {format(new Date(project.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/projects/${project.id}/settings`}>
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/projects/${project.id}/technical-audit/new`}>
              <Search className="mr-1 h-4 w-4" />
              Run Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground">+2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No tracked keywords yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Run your first audit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backlinks</CardTitle>
                <Rss className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Set up backlinks module</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Basic information about your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <div className="font-medium">Website URL</div>
                  <div className="col-span-2">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {project.url}
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <div className="font-medium">Project Type</div>
                  <div className="col-span-2">{getProjectTypeBadge(project.type)}</div>
                </div>
                {project.targetCountry && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">Target Country</div>
                    <div className="col-span-2">{project.targetCountry}</div>
                  </div>
                )}
                {project.targetLanguage && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">Target Language</div>
                    <div className="col-span-2">{project.targetLanguage}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 items-center gap-4">
                  <div className="font-medium">Created</div>
                  <div className="col-span-2">{format(new Date(project.createdAt), "MMMM d, yyyy")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Complete these tasks to set up your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                <li className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/projects/${project.id}/technical-audit/new`}>
                      Run Technical Audit
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Analyze your website for SEO issues
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/projects/${project.id}/keywords/new`}>
                      Add Keywords
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Track your target keywords
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/projects/${project.id}/competitors/new`}>
                      Add Competitors
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Monitor your competitors
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder for other tabs */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keywords Tracking</CardTitle>
              <CardDescription>
                Manage and analyze keywords for this project
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No keywords tracked yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start tracking your target keywords to monitor your rankings
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${project.id}/keywords/new`}>
                  Add Keywords
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
              <CardDescription>
                Analyze technical aspects of your website
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No audits performed yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Run a technical audit to identify SEO issues on your site
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${project.id}/technical-audit/new`}>
                  Run Technical Audit
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>
                Analyze and optimize your content
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">Content analysis not set up</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Analyze your content to find optimization opportunities
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${project.id}/content-audit/new`}>
                  Set Up Content Analysis
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlinks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backlinks</CardTitle>
              <CardDescription>
                Monitor your backlinks profile
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Rss className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">Backlinks not tracked yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start monitoring your backlinks to track your link profile
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${project.id}/backlinks/setup`}>
                  Set Up Backlinks Tracking
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitors</CardTitle>
              <CardDescription>
                Monitor your competitors performance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No competitors added</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add competitors to compare your SEO performance
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${project.id}/competitors/new`}>
                  Add Competitors
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}