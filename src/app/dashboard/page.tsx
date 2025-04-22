"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, BarChart3, Search, Globe, Link2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  url: string;
  type: string;
  organizationId: string;
}

interface DashboardStats {
  totalProjects: number;
  totalKeywords: number;
  totalAudits: number;
  totalBacklinks: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalKeywords: 0,
    totalAudits: 0,
    totalBacklinks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch actual data
    // For now, we'll simulate loading data
    const timer = setTimeout(() => {
      setProjects([
        {
          id: "1",
          name: "Company Website",
          url: "https://example.com",
          type: "WEBSITE",
          organizationId: "1",
        },
        {
          id: "2",
          name: "E-commerce Store",
          url: "https://store-example.com",
          type: "ECOMMERCE",
          organizationId: "1",
        },
      ]);
      setStats({
        totalProjects: 2,
        totalKeywords: 145,
        totalAudits: 8,
        totalBacklinks: 382,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "User"}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                stats.totalProjects
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active websites being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keywords Tracked
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                formatNumber(stats.totalKeywords)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              +7 new keywords this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Audits</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                stats.totalAudits
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last audit 2 days ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Backlinks Monitored
            </CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                formatNumber(stats.totalBacklinks)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              +23 new backlinks discovered
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      {project.type === "ECOMMERCE" ? "E-commerce" : "Website"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>{project.url}</p>
                    <div className="mt-4 flex items-center">
                      <div className="mr-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          Keywords
                        </div>
                        <div className="font-medium">48</div>
                      </div>
                      <div className="mr-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          Audits
                        </div>
                        <div className="font-medium">3</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Issues
                        </div>
                        <div className="font-medium">12</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="flex items-center">
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No projects yet</CardTitle>
                  <CardDescription>
                    Create your first project to start tracking SEO performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/projects/new">
                    <Button className="w-full sm:w-auto">
                      Create Your First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Add project card */}
            {projects.length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Add New Project</CardTitle>
                  <CardDescription>
                    Set up a new website to track
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <Link href="/dashboard/projects/new">
                    <Button variant="outline" size="lg">
                      + Add Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                View your most recent SEO reports and analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-6">
                No reports generated yet. Run an audit to create your first report.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/audits/new">
                <Button>
                  Run New Audit
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your team's recent actions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-6">
                No recent activity to display
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}