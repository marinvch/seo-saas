"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ModeToggle } from "@/components/ui/theme-toggle";

export default function LandingPage() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SEOmaster
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/integrations" className="text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
              Resources
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="mr-1">
              <ModeToggle />
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col md:flex-row py-20 gap-8 items-center">
        <div className="flex-1 space-y-5">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-4 py-1.5 text-sm font-medium inline-flex">
            Launch Offer: 30% off for agencies
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            All-in-One SEO Platform for{" "}
            <span className="text-blue-600 dark:text-blue-400">Digital Agencies</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Streamline your agency's SEO workflows. Audit sites, track keywords,
            monitor backlinks, and deliver beautiful client reports - all in one
            platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-lg border bg-background shadow-lg p-2 dark:shadow-gray-900">
            <div className="rounded overflow-hidden">
              {!imageError ? (
                <div className="relative w-full h-80">
                  <Image
                    src="/images/SEO-master.png"
                    alt="SEOmaster Dashboard"
                    layout="fill"
                    objectFit="cover"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="h-80 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    Dashboard Preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Updated with improved contrast */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Everything agencies need to deliver exceptional SEO results
            </h2>
            <p className="text-xl text-high-contrast max-w-3xl mx-auto">
              Designed with agency workflows in mind, SEOmaster helps you manage multiple clients
              and deliver measurable results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600 dark:text-blue-300"
                >
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">
                Site Auditing & Monitoring
              </h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Comprehensive technical SEO audits with actionable recommendations.
                Monitor site health 24/7 with automated alerts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600 dark:text-blue-300"
                >
                  <path d="m2 2 8 8"></path>
                  <path d="m22 2-8 8"></path>
                  <ellipse cx="12" cy="18" rx="10" ry="4"></ellipse>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Rank Tracking</h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Track keyword rankings across different locations and devices.
                Monitor competitors and identify ranking opportunities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600 dark:text-blue-300"
                >
                  <path d="M12 2v20"></path>
                  <path d="m19 7-7-5-7 5"></path>
                  <path d="M5 17a5 5 0 0 0 10 0c0-3-5-8-5-8s-5 5-5 8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">
                Backlink Analysis
              </h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Discover and analyze your backlink profile. Monitor new and lost links
                and compare against competitors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Agency-specific features section - Updated with improved contrast */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Built for Agencies</h2>
          <p className="text-xl text-high-contrast dark:text-medium-contrast-dark max-w-3xl mx-auto">
            Features designed specifically for digital marketing agencies and consultants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Agency Feature 1 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-300"
              >
                <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4"></path>
                <path d="M3 9v4"></path>
                <path d="M21 9v4"></path>
                <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"></path>
                <path d="M12 6V3"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-foreground">White-Label Reports</h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Customize reports with your agency's branding. Deliver professional
                PDF reports that showcase your work to clients.
              </p>
            </div>
          </div>

          {/* Agency Feature 2 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-300"
              >
                <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z"></path>
                <path d="M12 7v5l2.5 2.5"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Client Time-Saving</h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Reduce reporting time by up to 75%. Automate client reporting with
                scheduled email delivery and customizable dashboards.
              </p>
            </div>
          </div>

          {/* Agency Feature 3 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-300"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Team Collaboration</h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Invite team members, assign roles, and collaborate efficiently
                across all your client projects in one workspace.
              </p>
            </div>
          </div>

          {/* Agency Feature 4 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-300"
              >
                <rect width="20" height="14" x="2" y="3" rx="2"></rect>
                <line x1="8" x2="16" y1="21" y2="21"></line>
                <line x1="12" x2="12" y1="17" y2="21"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Client Portal Access</h3>
              <p className="text-high-contrast dark:text-medium-contrast-dark">
                Give clients secure access to their dedicated portal with
                customized views of their SEO performance and progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Trusted by Agencies Worldwide</h2>
            <p className="text-xl text-high-contrast dark:text-medium-contrast-dark max-w-3xl mx-auto">
              See what agency owners and SEO professionals say about SEOmaster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-high-contrast dark:text-medium-contrast-dark mb-4">
                "SEOmaster has transformed how we deliver SEO services to our clients. The white-label reporting and automated audits have saved us countless hours every month."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">JM</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Jessica Miller</p>
                  <p className="text-sm text-muted-foreground">Digital Spark Agency</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-high-contrast dark:text-medium-contrast-dark mb-4">
                "We've consolidated 3 different tools into just SEOmaster. The ability to manage all our clients in one platform with team collaboration features is a game changer."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">RW</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Robert Wilson</p>
                  <p className="text-sm text-muted-foreground">Growth Partners Ltd</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="text-amber-400 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-high-contrast dark:text-medium-contrast-dark mb-4">
                "The AI-powered content suggestions and technical audit recommendations have improved our client results significantly. Our clients love the interactive dashboards."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">AS</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Amanda Sanchez</p>
                  <p className="text-sm text-muted-foreground">Digital Elevation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Transparent Agency-Friendly Pricing</h2>
          <p className="text-xl text-high-contrast dark:text-medium-contrast-dark max-w-3xl mx-auto">
            Choose the plan that fits your agency's needs. Scale as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-background rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2 text-foreground">Starter</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-foreground">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">For small agencies & freelancers</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Up to 10 projects
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  500 keyword tracking
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Weekly site audits
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Basic white-label reports
                </span>
              </li>
            </ul>
            <Link href="/pricing" className="block w-full">
              <Button variant="outline" size="lg" className="w-full">
                View Details
              </Button>
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="bg-background rounded-lg p-6 shadow-md border-2 border-blue-500 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <div className="text-center mb-6 pt-2">
              <h3 className="text-xl font-bold mb-2 text-foreground">Growth</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-foreground">$199</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">For growing agencies</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Up to 30 projects
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  2,000 keyword tracking
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Daily site audits
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Advanced white-label reports
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Team collaboration (5 users)
                </span>
              </li>
            </ul>
            <Link href="/pricing" className="block w-full">
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                View Details
              </Button>
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="bg-background rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2 text-foreground">Agency</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-foreground">$399</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">For established agencies</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Unlimited projects
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  5,000+ keyword tracking
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Real-time site monitoring
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Premium client portal
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="text-green-500 w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-high-contrast dark:text-medium-contrast-dark">
                  Unlimited team members
                </span>
              </li>
            </ul>
            <Link href="/pricing" className="block w-full">
              <Button variant="outline" size="lg" className="w-full">
                View Details
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Need a custom plan for your enterprise?
          </p>
          <Link href="/contact">
            <Button variant="link">Contact our sales team</Button>
          </Link>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Seamlessly Integrate With Your Tools
            </h2>
            <p className="text-xl text-high-contrast dark:text-medium-contrast-dark max-w-3xl mx-auto">
              Connect SEOmaster with the tools you already use to streamline your workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {/* Integration Logos */}
            <div className="bg-background rounded-lg p-6 flex items-center justify-center shadow-sm">
              <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground font-medium">
                  Google Analytics
                </span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-6 flex items-center justify-center shadow-sm">
              <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground font-medium">
                  Search Console
                </span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-6 flex items-center justify-center shadow-sm">
              <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground font-medium">Slack</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-6 flex items-center justify-center shadow-sm">
              <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground font-medium">Zapier</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/integrations">
              <Button variant="outline">View All Integrations</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-high-contrast dark:text-medium-contrast-dark max-w-3xl mx-auto">
            Everything you need to know about SEOmaster.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* FAQ Item 1 */}
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-foreground">
              How does SEOmaster differ from other SEO tools?
            </h3>
            <p className="text-high-contrast dark:text-medium-contrast-dark">
              SEOmaster is built specifically for agencies with multi-client
              management, white-label reporting, team collaboration, and client
              portal features. We focus on workflow efficiency and client
              management, not just raw data.
            </p>
          </div>

          {/* FAQ Item 2 */}
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-foreground">
              Can I migrate data from other SEO tools?
            </h3>
            <p className="text-high-contrast dark:text-medium-contrast-dark">
              Yes! We offer assisted migration from tools like Ahrefs, SEMrush,
              and Moz. Our onboarding team will help you import your keywords,
              projects, and historical data to ensure a smooth transition.
            </p>
          </div>

          {/* FAQ Item 3 */}
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-foreground">
              Do you offer a free trial?
            </h3>
            <p className="text-high-contrast dark:text-medium-contrast-dark">
              Yes, we offer a 14-day free trial on all plans with full access to
              all features. No credit card required to get started.
            </p>
          </div>

          {/* FAQ Item 4 */}
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-foreground">
              What support options do you provide?
            </h3>
            <p className="text-high-contrast dark:text-medium-contrast-dark">
              We offer live chat support during business hours, email support,
              comprehensive documentation, and video tutorials. Growth and
              Agency plans include dedicated onboarding and priority support.
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/faq">
            <Button variant="link">View All FAQs</Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800 py-20 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to transform your agency's SEO workflow?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
            Join hundreds of digital agencies already using SEOmaster to deliver
            exceptional results for their clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-blue-700"
              >
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 border-t">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  SEOmaster
                </span>
              </Link>
              <p className="mt-4 text-muted-foreground">
                The all-in-one SEO platform designed for digital agencies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    SEO Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/webinars"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Webinars
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-center"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SEOmaster. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link
                href="https://linkedin.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </Link>
              <Link
                href="https://facebook.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}