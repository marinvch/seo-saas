"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  BarChart3,
  Search,
  Settings,
  LineChart,
  Link2,
  FileText,
  Layers,
  Globe,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  CreditCard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ModeToggle } from "../../components/ui/theme-toggle";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not authenticated, redirect to login page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // We're still checking authentication status
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Authentication check passed, render dashboard
  const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: <BarChart3 size={20} /> },
    { label: "Projects", href: "/dashboard/projects", icon: <Layers size={20} /> },
    { label: "Keywords", href: "/dashboard/keywords", icon: <LineChart size={20} /> },
    { label: "Backlinks", href: "/dashboard/backlinks", icon: <Link2 size={20} /> },
    { label: "Content", href: "/dashboard/content", icon: <FileText size={20} /> },
    { label: "Competitors", href: "/dashboard/competitors", icon: <Globe size={20} /> },
    { label: "AI Tools", href: "/dashboard/ai-tools", icon: <Search size={20} /> },
    { label: "Team", href: "/dashboard/team", icon: <Users size={20} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="fixed hidden md:flex flex-col w-64 h-screen bg-background border-r">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center font-semibold text-lg">
            <img
              src="/images/SEO-master.png"
              alt="SEO Master"
              className="h-8 w-auto mr-2"
            />
            <span>SEOmaster</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar>
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback>
                {session?.user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.email || ""}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed z-10 md:hidden w-full bg-background border-b h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            className="block md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/dashboard" className="flex items-center font-semibold">
            <img
              src="/images/SEO-master.png"
              alt="SEO Master"
              className="h-8 w-auto mr-2"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 text-center text-sm text-muted-foreground">
                No new notifications.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{session?.user?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background md:hidden transform transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-16">
          <div className="p-6">
            <Link
              href="/dashboard"
              className="flex items-center font-semibold text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src="/images/SEO-master.png"
                alt="SEO Master"
                className="h-8 w-auto mr-2"
              />
              <span>SEOmaster</span>
            </Link>
          </div>

          <nav className="flex flex-col gap-1 px-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage
                  src={session?.user?.image || undefined}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>
                  {session?.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session?.user?.email || ""}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}