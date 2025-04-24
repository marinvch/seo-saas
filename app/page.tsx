"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from '../components/ui/button';
import { useState } from "react";
import { ModeToggle } from '../components/ui/theme-toggle';

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
                    fill
                    style={{ objectFit: "cover" }}
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
    </div>
  );
}
