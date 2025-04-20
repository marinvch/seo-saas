"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Mock data for demo purposes
// In a real application, this would come from API calls
const mockMetrics = {
  totalProjects: 3,
  totalKeywords: 127,
  averagePosition: 12.4,
  keywordsInTop10: 23,
  crawlErrors: 14,
  organicTraffic: 2467,
  organicTrafficChange: 12.3,
};

const mockRecentActivity = [
  { id: 1, type: "rank_change", project: "Agency Website", keyword: "digital marketing agency", oldRank: 12, newRank: 8, date: "2025-04-18T10:30:00Z" },
  { id: 2, type: "crawl_completed", project: "E-commerce Client", pagesScanned: 237, issuesFound: 16, date: "2025-04-17T15:45:00Z" },
  { id: 3, type: "keyword_added", project: "SaaS Client", keyword: "project management software", date: "2025-04-16T09:15:00Z" },
  { id: 4, type: "content_opportunity", project: "Agency Website", keyword: "seo for small business", gap: "Missing H1 tag", date: "2025-04-15T14:20:00Z" },
];

const mockProjects = [
  { id: 1, name: "Agency Website", url: "https://agencywebsite.com", health: 86, rankings: "Improving", status: "active" },
  { id: 2, name: "E-commerce Client", url: "https://ecommerce-client.com", health: 72, rankings: "Stable", status: "active" },
  { id: 3, name: "SaaS Client", url: "https://saas-client.com", health: 91, rankings: "Improving", status: "active" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("Good day");
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your SEO projects today.
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <Button asChild variant="outline">
            <Link href="/dashboard/projects/new">
              Add New Project
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/keywords/new">
              Track New Keywords
            </Link>
          </Button>
        </div>
      </div>

      {/* Key metrics section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Project count */}
          <div className="rounded-lg border bg-white p-4 dark:bg-slate-800">
            <div className="text-sm font-medium text-muted-foreground">
              Active Projects
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-2xl font-bold">
                {mockMetrics.totalProjects}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="rounded-lg border bg-white p-4 dark:bg-slate-800">
            <div className="text-sm font-medium text-muted-foreground">
              Keywords Tracked
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-2xl font-bold">
                {mockMetrics.totalKeywords}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">
                {mockMetrics.keywordsInTop10}
              </span>{" "}
              in top 10 positions
            </div>
          </div>

          {/* Average rank */}
          <div className="rounded-lg border bg-white p-4 dark:bg-slate-800">
            <div className="text-sm font-medium text-muted-foreground">
              Average Position
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-2xl font-bold">
                {mockMetrics.averagePosition}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Organic traffic */}
          <div className="rounded-lg border bg-white p-4 dark:bg-slate-800">
            <div className="text-sm font-medium text-muted-foreground">
              Monthly Organic Traffic
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-2xl font-bold">
                {mockMetrics.organicTraffic.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs">
              <span className="text-green-500 font-medium">
                +{mockMetrics.organicTrafficChange}%
              </span>{" "}
              vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout for projects and activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Projects section */}
        <div className="lg:col-span-2 rounded-lg border bg-white p-6 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Health</th>
                  <th className="pb-3">Rankings</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockProjects.map(project => (
                  <tr key={project.id}>
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.url}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full max-w-[100px] rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-2 rounded-full ${
                              project.health > 85
                                ? "bg-green-500"
                                : project.health > 70
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${project.health}%` }}
                          />
                        </div>
                        <span className="text-sm">{project.health}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          project.rankings === "Improving"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : project.rankings === "Declining"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {project.rankings}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/projects/${project.id}`}>
                            View
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/projects/${project.id}/audits/new`}>
                            Audit
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mockProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6 text-muted-foreground"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first project.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/projects/new">Add Project</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Activity section */}
        <div className="rounded-lg border bg-white p-6 dark:bg-slate-800">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="border-l-2 border-primary pl-4"
              >
                {activity.type === "rank_change" && (
                  <>
                    <p className="font-medium">
                      Keyword position change for "{activity.keyword}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      From position {activity.oldRank} to{" "}
                      <span
                        className={
                          activity.oldRank > activity.newRank
                            ? "text-green-500 font-medium"
                            : "text-red-500 font-medium"
                        }
                      >
                        {activity.newRank}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.project} ∙{" "}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </>
                )}

                {activity.type === "crawl_completed" && (
                  <>
                    <p className="font-medium">Site audit completed</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.pagesScanned} pages scanned,{" "}
                      <span className="text-amber-500 font-medium">
                        {activity.issuesFound} issues
                      </span>{" "}
                      found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.project} ∙{" "}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </>
                )}

                {activity.type === "keyword_added" && (
                  <>
                    <p className="font-medium">New keyword added</p>
                    <p className="text-sm text-muted-foreground">
                      Now tracking "{activity.keyword}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.project} ∙{" "}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </>
                )}

                {activity.type === "content_opportunity" && (
                  <>
                    <p className="font-medium">Content opportunity detected</p>
                    <p className="text-sm text-muted-foreground">
                      For keyword "{activity.keyword}": {activity.gap}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.project} ∙{" "}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            ))}

            {mockRecentActivity.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6 text-muted-foreground"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium">No recent activity</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Activity will appear here as you use the platform.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Link
            href="/dashboard/audits/new"
            className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 text-center transition-all hover:border-primary hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium">Run Site Audit</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Check your site for SEO issues
            </p>
          </Link>

          <Link
            href="/dashboard/keywords/new"
            className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 text-center transition-all hover:border-primary hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium">Add Keywords</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Track new keyword rankings
            </p>
          </Link>

          <Link
            href="/dashboard/content/ideas"
            className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 text-center transition-all hover:border-primary hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium">Content Ideas</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Get AI suggestions for content
            </p>
          </Link>

          <Link
            href="/dashboard/reports/generate"
            className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 text-center transition-all hover:border-primary hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium">Generate Report</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create client-ready reports
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}