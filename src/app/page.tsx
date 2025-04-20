"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
                    src="/images/dashboard-preview.png"
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

      {/* Features Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Everything agencies need to deliver exceptional SEO results
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed with agency workflows in mind, SEOmaster helps you manage multiple clients
              and deliver measurable results.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                  <path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Site Auditing & Monitoring</h3>
              <p className="text-muted-foreground">
                Comprehensive technical SEO audits with actionable recommendations.
                Monitor site health 24/7 with automated alerts.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                  <path d="m2 2 8 8"></path><path d="m22 2-8 8"></path><ellipse cx="12" cy="18" rx="10" ry="4"></ellipse>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Rank Tracking</h3>
              <p className="text-muted-foreground">
                Track keyword rankings across different locations and devices.
                Monitor competitors and identify ranking opportunities.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                  <path d="M12 2v20"></path><path d="m19 7-7-5-7 5"></path><path d="M5 17a5 5 0 0 0 10 0c0-3-5-8-5-8s-5 5-5 8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Backlink Analysis</h3>
              <p className="text-muted-foreground">
                Discover and analyze your backlink profile. Monitor new and lost links
                and compare against competitors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Agency-specific features section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Built for Agencies</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Features designed specifically for digital marketing agencies and consultants.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Agency Feature 1 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4"></path><path d="M3 9v4"></path><path d="M21 9v4"></path><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"></path><path d="M12 6V3"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">White-Label Reports</h3>
              <p className="text-muted-foreground">
                Customize reports with your agency's branding. Deliver professional
                PDF reports that showcase your work to clients.
              </p>
            </div>
          </div>
          
          {/* Agency Feature 2 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Client Portal</h3>
              <p className="text-muted-foreground">
                Give clients direct access to their results with customizable 
                permission levels and your agency's branding.
              </p>
            </div>
          </div>
          
          {/* Agency Feature 3 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M17 6.1H3"></path><path d="M21 12.1H3"></path><path d="M15.1 18H3"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Bulk Actions</h3>
              <p className="text-muted-foreground">
                Save time with bulk actions across multiple client projects.
                Generate reports, start audits, or add keywords to multiple sites at once.
              </p>
            </div>
          </div>
          
          {/* Agency Feature 4 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Add team members with customized access levels. Track
                work and collaborate efficiently on client projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your agency?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of agencies using SEOmaster to deliver better results for their clients
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-white transition-colors">Guides</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 SEOmaster. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}