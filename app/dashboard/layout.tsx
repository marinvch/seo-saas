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
    { label: "Site Audits", href: "/dashboard/audits", icon: <Globe size={20} /> },
    { label: "Keywords", href: "/dashboard/keywords", icon: <Search size={20} /> },
    { label: "Rank Tracking", href: "/dashboard/rank-tracking", icon: <LineChart size={20} /> },
    { label: "Backlinks", href: "/dashboard/backlinks", icon: <Link2 size={20} /> },
    { label: "Content Audit", href: "/dashboard/content", icon: <FileText size={20} /> },
    { label: "Team", href: "/dashboard/team", icon: <Users size={20} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const initialsFromName = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 lg:hidden">
          <div className="fixed left-0 top-0 h-screen w-4/5 max-w-sm bg-background p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SEOmaster
              </Link>
              <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                <X size={20} />
              </Button>
            </div>
            <nav className="space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r">
        <div className="flex items-center gap-2 px-6 py-4 border-b h-16">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            SEOmaster
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent group",
                item.href === "/dashboard" && "bg-accent"
              )}
            >
              <div className="text-muted-foreground group-hover:text-foreground">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b h-16 px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </Button>

          <div className="flex items-center ml-auto gap-4">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-2 px-3 text-sm text-center text-muted-foreground">
                  No new notifications
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>{initialsFromName(session?.user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}