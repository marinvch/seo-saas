import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import ProjectList from "@/components/projects/project-list";
import { prisma } from "@/lib/db/prisma-client";

export const metadata: Metadata = {
  title: "Dashboard | SEO SaaS",
  description: "Your SEO performance dashboard"
};

// Mock data for demo purposes - in a real application these will come from API calls
const mockMetrics = {
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

export default async function DashboardPage() {
  // Get user's session
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session expired</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get user's projects
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organizations: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">We couldn't find your account. Please sign in again.</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get organization IDs the user belongs to
  const organizationIds = user.organizations.map(org => org.organizationId);

  // Get projects for these organizations
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { organizationId: { in: organizationIds } },
        { createdById: user.id }
      ]
    },
  });

  // Set greeting based on time of day
  const hour = new Date().getHours();
  let greeting = "Good day";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {firstName}!
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
                {projects.length}
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

      {/* Projects Section */}
      <ProjectList projects={projects} />

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
                        (activity.oldRank ?? Infinity) > (activity.newRank ?? Infinity)
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

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Link
            href="/dashboard/projects/new"
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium">New Project</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a website to track
            </p>
          </Link>

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