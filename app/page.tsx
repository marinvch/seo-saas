"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { ModeToggle } from "../components/ui/theme-toggle";
import {
  BarChart3,
  Search,
  LineChart,
  MonitorSmartphone,
  Award,
  ArrowUpRight,
  Check,
  ChevronRight,
  BarChart4,
  Zap,
  Star,
  Gauge,
  LinkIcon,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LandingPage() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SEOmaster
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/integrations"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Integrations
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
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
      <section className="bg-gradient-to-b from-slate-900 to-blue-900 text-white py-20">
        <div className="container flex flex-col md:flex-row py-12 gap-8 items-center">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              One platform
              <br />
              <span className="text-orange-400">All of SEO</span>
            </h1>
            <p className="text-xl text-slate-300">
              Powerful SEO tools to grow your search traffic, research your
              competitors, and monitor your market niche.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-black hover:bg-white/10 hover:text-white"
                >
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-lg border bg-white/10 backdrop-blur-sm shadow-lg p-3 dark:shadow-blue-900/30">
              <div className="rounded overflow-hidden">
                {!imageError ? (
                  <div className="relative w-full h-80">
                    <Image
                      src="/images/SEO-master.png"
                      alt="SEOmaster Dashboard"
                      fill
                      style={{ objectFit: "cover" }}
                      onError={() => setImageError(true)}
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <div className="h-80 bg-gradient-to-br from-blue-800 to-indigo-900 rounded-md flex items-center justify-center">
                    <p className="text-center text-white">Dashboard Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By / Logos Section */}
      <section className="py-10 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <p className="text-center text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
            Trusted by 2,500+ agencies and businesses
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-80">
            {[
              "Google",
              "Microsoft",
              "Shopify",
              "Salesforce",
              "Amazon",
              "Spotify",
            ].map((brand) => (
              <div key={brand} className="h-8 flex items-center">
                <span className="text-xl font-bold text-slate-400">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* One-stop SEO solution features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">
              One-stop SEO software for every challenge
            </h2>
            <p className="text-lg text-muted-foreground">
              Our comprehensive toolkit helps you optimize your site, track your
              rankings, and outperform your competitors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-8 w-8 text-blue-500" />,
                title: "Keyword Research",
                description:
                  "Find the most valuable keywords for your business",
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
                title: "Rank Tracking",
                description: "Monitor your rankings across search engines",
              },
              {
                icon: <MonitorSmartphone className="h-8 w-8 text-green-500" />,
                title: "Site Auditing",
                description:
                  "Find and fix SEO issues that affect your rankings",
              },
              {
                icon: <LineChart className="h-8 w-8 text-purple-500" />,
                title: "Competitor Analysis",
                description: "Spy on your competitors' strategies and keywords",
              },
              {
                icon: <LinkIcon className="h-8 w-8 text-cyan-500" />,
                title: "Backlink Monitoring",
                description: "Track your backlinks and find new opportunities",
              },
              {
                icon: <Award className="h-8 w-8 text-amber-500" />,
                title: "White-Label Reports",
                description: "Create custom reports with your branding",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-none shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Outrank your competitors section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold">
                Outrank your competitors with top features
              </h2>
              <p className="text-lg text-muted-foreground">
                Get a complete overview of your site's performance and
                actionable insights to improve your SEO strategy.
              </p>

              <ul className="space-y-4">
                {[
                  "Track unlimited keywords across 170+ countries",
                  "Audit your site for 100+ technical SEO issues",
                  "Discover your competitors' best-performing content",
                  "Monitor your backlinks and find new opportunities",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/features">
                <Button
                  variant="link"
                  className="pl-0 flex items-center text-blue-600 font-semibold"
                >
                  Learn more about features{" "}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="lg:w-1/2 border rounded-xl overflow-hidden shadow-xl">
              <div className="relative w-full h-96">
                {!imageError ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-6">
                    <div className="w-full max-w-md mx-auto">
                      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Rankings Overview
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Keywords in top 3</span>
                            <span className="font-bold text-green-500">
                              +24%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: "65%" }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Organic traffic</span>
                            <span className="font-bold text-green-500">
                              +18%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: "48%" }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Backlinks</span>
                            <span className="font-bold text-amber-500">
                              +7%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                            <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{ width: "32%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      Performance Chart
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              See SEO PowerSuite in action
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our all-in-one platform gives you everything you need to improve
              your search rankings
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-8 rounded-xl">
              <div className="mb-4">
                <div className="bg-blue-500 text-white rounded-md w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Rank Tracker</h3>
                <p className="text-muted-foreground mt-2">
                  Monitor your keyword rankings across all major search engines
                </p>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-md">
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          seomaster.io
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          /blog/seo-guide
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-500">
                        +3 ↑
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "82%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 mt-5 text-center border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Position</p>
                      <p className="font-medium">4</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Search Volume
                      </p>
                      <p className="font-medium">5.4K</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Competition
                      </p>
                      <p className="font-medium">Medium</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-8 rounded-xl">
              <div className="mb-4">
                <div className="bg-orange-500 text-white rounded-md w-12 h-12 flex items-center justify-center mb-4">
                  <MonitorSmartphone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Website Auditor</h3>
                <p className="text-muted-foreground mt-2">
                  Find and fix technical SEO issues that affect your rankings
                </p>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-md">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Technical Audit Issues
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-500 flex items-center">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Critical Issues
                      </span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-500 flex items-center">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                        Warnings
                      </span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-500 flex items-center">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Notices
                      </span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-500 flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Passed Checks
                      </span>
                      <span className="font-medium">186</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 p-8 rounded-xl">
              <div className="mb-4">
                <div className="bg-green-500 text-white rounded-md w-12 h-12 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">SEO SpyGlass</h3>
                <p className="text-muted-foreground mt-2">
                  Analyze your backlinks and discover new link building
                  opportunities
                </p>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-md">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Backlink Analysis
                  </h4>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Total backlinks</span>
                      <span className="text-sm font-medium">1,248</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Referring domains</span>
                      <span className="text-sm font-medium">342</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Domain authority</span>
                      <span className="text-sm font-medium">56</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-muted-foreground">
                        71% Dofollow
                      </span>
                    </div>
                    <div className="flex items-center text-sm mt-1">
                      <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 mr-2"></div>
                      <span className="text-muted-foreground">
                        29% Nofollow
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-8 rounded-xl">
              <div className="mb-4">
                <div className="bg-purple-500 text-white rounded-md w-12 h-12 flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Link Assistant</h3>
                <p className="text-muted-foreground mt-2">
                  Find quality link prospects and manage outreach campaigns
                </p>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-md">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Link Opportunity Finder
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Guest posting opportunities
                      </span>
                      <span className="font-medium text-green-500">48</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resource pages</span>
                      <span className="font-medium text-green-500">35</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Competitor backlinks</span>
                      <span className="font-medium text-green-500">126</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Broken links</span>
                      <span className="font-medium text-amber-500">17</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-blue-900 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Powerful SEO software with unique, built-in data
            </h2>
            <p className="text-lg text-slate-300">
              We process billions of search results to provide you with accurate
              and actionable data
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "550+", label: "Million keywords in database" },
              { number: "100%", label: "Accurate rank tracking" },
              { number: "6.5T", label: "Backlinks indexed" },
              { number: "400M", label: "Domains analyzed" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <p className="text-sm md:text-base text-slate-300">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Why SEO Professionals Trust Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Hear from the agencies and in-house teams who use our platform to
              grow their search traffic
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-8 rounded-xl shadow-lg">
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div>
                  <blockquote className="text-lg mb-4">
                    "Since implementing SEOmaster, we've seen a 43% increase in
                    organic traffic and improved our client reporting process.
                    The automated audits and rank tracking save us hours each
                    week."
                  </blockquote>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">
                      SEO Director, Digital Marketing Agency
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about our SEO platform
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-slate-200 dark:divide-slate-700">
            {[
              {
                question: "What is SEOmaster software?",
                answer:
                  "SEOmaster is an all-in-one SEO software platform that helps digital agencies and businesses improve their search engine rankings. Our toolkit includes site auditing, rank tracking, keyword research, competitor analysis, and backlink monitoring tools.",
              },
              {
                question: "Can I use SEOmaster with my clients?",
                answer:
                  "Absolutely! SEOmaster is designed with agencies in mind. You can add multiple client websites, create white-labeled reports with your own branding, and provide client access to customized dashboards.",
              },
              {
                question: "How does your pricing work?",
                answer:
                  "We offer tiered pricing plans based on your needs, from our Starter plan for individuals and small businesses to our Agency plan for digital marketing agencies. All plans include our core features, with higher tiers offering more projects, keywords, and advanced features.",
              },
              {
                question: "Do you have a free trial?",
                answer:
                  "Yes, we offer a 14-day free trial of our platform with no credit card required. You'll get full access to test all our features and see how SEOmaster can help grow your search traffic.",
              },
            ].map((faq, index) => (
              <div key={index} className="py-5">
                <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/faq">
              <Button variant="outline">View all FAQs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Download SEO PowerSuite tools for free
            </h2>
            <p className="text-lg mb-8">
              Start improving your search rankings today
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white  hover:bg-white/10"
                >
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="hover:text-white transition-colors"
                  >
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="hover:text-white transition-colors"
                  >
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documentation"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="hover:text-white transition-colors"
                  >
                    SEO Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="hover:text-white transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal"
                    className="hover:text-white transition-colors"
                  >
                    Legal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/twitter"
                    className="hover:text-white transition-colors"
                  >
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/linkedin"
                    className="hover:text-white transition-colors"
                  >
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link
                    href="/facebook"
                    className="hover:text-white transition-colors"
                  >
                    Facebook
                  </Link>
                </li>
                <li>
                  <Link
                    href="/youtube"
                    className="hover:text-white transition-colors"
                  >
                    YouTube
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  SEOmaster
                </span>
              </Link>
            </div>
            <div className="text-sm text-slate-400">
              © {new Date().getFullYear()} SEOmaster. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
