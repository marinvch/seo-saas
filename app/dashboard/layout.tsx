import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../lib/auth";
import { ModeToggle } from "../../components/ui/theme-toggle";
import { Button } from "../../components/ui/button";

export const metadata: Metadata = {
  title: "SEO SaaS | Dashboard",
  description: "Manage your SEO tasks and view analytics",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SEOmaster
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/keywords"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Keywords
            </Link>
            <Link
              href="/dashboard/site-audit"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Site Audit
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-sm text-muted-foreground mr-2">
                {session.user.name || session.user.email}
              </span>
            </div>
            <ModeToggle />
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Dashboard Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-2 text-center md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SEOmaster. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Shadcn/UI and Prisma
          </p>
        </div>
      </footer>
    </div>
  );
}