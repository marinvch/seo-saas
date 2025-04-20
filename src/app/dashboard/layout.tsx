"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If the user is not authenticated, show a loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left side - Logo and mobile menu button */}
          <div className="flex items-center">
            <button 
              className="mr-4 md:hidden text-slate-800 dark:text-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/dashboard">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SEOmaster
              </div>
            </Link>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-800 dark:text-slate-100" aria-label="Notifications">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                3
              </span>
            </button>

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {session?.user?.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium dark:text-white">
                  {session?.user?.name || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 transform overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-700 dark:bg-slate-800 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-200">
              Dashboard
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname === "/dashboard"
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Overview</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-200">
                Projects
              </h3>
              <Link
                href="/dashboard/projects/new"
                className="text-xs text-primary hover:underline dark:text-primary dark:hover:text-primary-foreground"
              >
                + Add New
              </Link>
            </div>
            <ul className="space-y-1">
              {/* Project list would be dynamically generated here */}
              <li>
                <Link
                  href="/dashboard/projects"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname === "/dashboard/projects"
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                  <span>All Projects</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-200">
              Tools
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/keywords"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/keywords")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                  <span>Keyword Tracking</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/audits"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/audits")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Site Audits</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/competitors"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/competitors")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Competitor Analysis</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/content"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/content")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Content Optimization</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/ai-assistant"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/ai-assistant")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>AI Assistant</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-200">
              Settings
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/settings/organization"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/settings/organization")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>Organization</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings/team"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/settings/team")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>Team Members</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings/billing"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/settings/billing")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span>Billing</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings/integrations"
                  className={`flex items-center space-x-2 rounded px-2 py-2 ${
                    pathname.startsWith("/dashboard/settings/integrations")
                      ? "bg-primary text-white"
                      : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Integrations</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/auth/signin?signout=true"
              className="flex items-center space-x-2 rounded px-2 py-2 text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign Out</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-0 pt-16 md:ml-64">
        <div className="px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}