"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

// Define our onboarding steps
type OnboardingStep = "welcome" | "agency" | "first-project" | "integrations" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  
  // Agency profile form data
  const [agencyData, setAgencyData] = useState({
    name: "",
    website: "",
    logo: null as File | null,
    industry: "",
    size: "",
  });
  
  // Project form data
  const [projectData, setProjectData] = useState({
    name: "",
    url: "",
    type: "WEBSITE",
    targetCountry: "US",
    targetLanguage: "en",
    competitors: [] as string[],
    competitor: "", // Temporary field for adding competitors
  });
  
  // Integrations data
  const [integrations, setIntegrations] = useState({
    googleSearch: false,
    googleAnalytics: false,
  });

  // Handle agency form field changes
  const handleAgencyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAgencyData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle project form field changes
  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload for logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAgencyData((prev) => ({ ...prev, logo: e.target.files![0] }));
    }
  };
  
  // Add competitor to list
  const addCompetitor = () => {
    if (projectData.competitor && !projectData.competitors.includes(projectData.competitor)) {
      setProjectData(prev => ({
        ...prev,
        competitors: [...prev.competitors, prev.competitor],
        competitor: ""
      }));
    }
  };
  
  // Remove competitor from list
  const removeCompetitor = (competitor: string) => {
    setProjectData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }));
  };
  
  // Handle integration toggle
  const toggleIntegration = (integration: "googleSearch" | "googleAnalytics") => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: !prev[integration]
    }));
  };

  // Update agency profile
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("name", agencyData.name);
      formData.append("website", agencyData.website);
      formData.append("industry", agencyData.industry);
      formData.append("size", agencyData.size);
      if (agencyData.logo) {
        formData.append("logo", agencyData.logo);
      }
      
      const response = await fetch("/api/organizations/update", {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update agency profile");
      }
      
      toast({
        title: "Agency profile updated",
        description: "Your agency profile has been updated successfully.",
        variant: "success",
      });
      
      // Move to next step
      setCurrentStep("first-project");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create first project
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...projectData,
          // Remove temporary field
          competitor: undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      
      toast({
        title: "Project created",
        description: "Your first project has been created successfully.",
        variant: "success",
      });
      
      // Move to next step
      setCurrentStep("integrations");
    } catch (error: any) {
      toast({
        title: "Project creation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up integrations
  const handleIntegrationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep("complete");
    
    // We'll just navigate directly since setting up integrations usually involves OAuth
    // which we'd handle separately in the dashboard
  };
  
  // Handle completion - redirect to dashboard
  const handleComplete = () => {
    router.push("/dashboard");
  };

  // Render welcome step
  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <h1 className="text-3xl font-bold">Welcome to SEOmaster!</h1>
      <p className="text-xl text-muted-foreground max-w-md mx-auto">
        Let's set up your agency profile, first project and integrations to get you started.
      </p>
      
      <div className="flex justify-center mt-8">
        <Button size="lg" onClick={() => setCurrentStep("agency")}>
          Get Started
        </Button>
      </div>
    </div>
  );
  
  // Render agency profile form
  const renderAgencyForm = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Set Up Your Agency Profile</h1>
      <p className="text-muted-foreground">
        Tell us more about your agency to personalize your experience.
      </p>
      
      <form onSubmit={handleAgencySubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Agency Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={agencyData.name}
            onChange={handleAgencyChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium">
            Agency Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            placeholder="https://youragency.com"
            value={agencyData.website}
            onChange={handleAgencyChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="logo" className="text-sm font-medium">
            Agency Logo
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            Recommended size: 300x300px, max 2MB
          </p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="industry" className="text-sm font-medium">
            Industry Focus
          </label>
          <select
            id="industry"
            name="industry"
            value={agencyData.industry}
            onChange={handleAgencyChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select an industry</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="saas">SaaS</option>
            <option value="local">Local Business</option>
            <option value="b2b">B2B</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="travel">Travel & Hospitality</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="size" className="text-sm font-medium">
            Agency Size
          </label>
          <select
            id="size"
            name="size"
            value={agencyData.size}
            onChange={handleAgencyChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select agency size</option>
            <option value="1">Solo Consultant</option>
            <option value="2-10">2-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201+">201+ employees</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save and Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
  
  // Render first project form
  const renderProjectForm = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Your First Project</h1>
      <p className="text-muted-foreground">
        Set up your first project to start tracking and improving your SEO.
      </p>
      
      <form onSubmit={handleProjectSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="My Website"
            value={projectData.name}
            onChange={handleProjectChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Website URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com"
            value={projectData.url}
            onChange={handleProjectChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Project Type
          </label>
          <select
            id="type"
            name="type"
            value={projectData.type}
            onChange={handleProjectChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="WEBSITE">Website</option>
            <option value="ECOMMERCE">E-Commerce</option>
            <option value="BLOG">Blog</option>
            <option value="LOCAL">Local Business</option>
            <option value="SAAS">SaaS</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="targetCountry" className="text-sm font-medium">
              Target Country
            </label>
            <select
              id="targetCountry"
              name="targetCountry"
              value={projectData.targetCountry}
              onChange={handleProjectChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="JP">Japan</option>
              <option value="IN">India</option>
              <option value="GLOBAL">Global</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="targetLanguage" className="text-sm font-medium">
              Target Language
            </label>
            <select
              id="targetLanguage"
              name="targetLanguage"
              value={projectData.targetLanguage}
              onChange={handleProjectChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Competitors (Optional)
          </label>
          <div className="flex gap-2">
            <input
              name="competitor"
              type="url"
              placeholder="https://competitor.com"
              value={projectData.competitor}
              onChange={handleProjectChange}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="button" variant="secondary" onClick={addCompetitor}>
              Add
            </Button>
          </div>
          
          {projectData.competitors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Added competitors:</p>
              <ul className="space-y-2">
                {projectData.competitors.map((competitor, index) => (
                  <li key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    <span className="text-sm truncate">{competitor}</span>
                    <button
                      type="button"
                      onClick={() => removeCompetitor(competitor)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => setCurrentStep("agency")}>
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
  
  // Render integrations form
  const renderIntegrationsForm = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Set Up Integrations</h1>
      <p className="text-muted-foreground">
        Connect your accounts to get the most out of SEOmaster.
      </p>
      
      <form onSubmit={handleIntegrationsSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 flex items-center justify-center rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <path d="m21 21-6-6m4-7a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Google Search Console</h3>
                  <p className="text-sm text-muted-foreground">Connect to see search analytics and performance</p>
                </div>
              </div>
              <Button
                type="button"
                variant={integrations.googleSearch ? "default" : "outline"}
                onClick={() => toggleIntegration("googleSearch")}
              >
                {integrations.googleSearch ? "Connected" : "Connect"}
              </Button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Google Analytics</h3>
                  <p className="text-sm text-muted-foreground">Connect to see website traffic and user behavior</p>
                </div>
              </div>
              <Button
                type="button"
                variant={integrations.googleAnalytics ? "default" : "outline"}
                onClick={() => toggleIntegration("googleAnalytics")}
              >
                {integrations.googleAnalytics ? "Connected" : "Connect"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => setCurrentStep("first-project")}>
            Back
          </Button>
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
  
  // Render completion step
  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold">You're all set!</h1>
      <p className="text-xl text-muted-foreground max-w-md mx-auto">
        Your SEO journey with SEOmaster starts now. Let's optimize your website and grow your online presence.
      </p>
      
      <div className="flex justify-center mt-8">
        <Button size="lg" onClick={handleComplete}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
  
  // Render progress bar
  const renderProgressBar = () => {
    const steps = ["welcome", "agency", "first-project", "integrations", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    const progressPercentage = (currentIndex / (steps.length - 1)) * 100;
    
    return (
      <div className="w-full mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            {currentStep !== "welcome" && currentStep !== "complete" ? 
              `Step ${currentIndex} of ${steps.length - 2}` : 
              ""}
          </span>
          <span className="text-sm font-medium">
            {currentStep !== "welcome" && currentStep !== "complete" ?
              `${Math.round(progressPercentage)}%` :
              ""}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            SEOmaster
          </div>
          {session?.user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <main className="flex-1 container max-w-3xl mx-auto pt-24 px-4 pb-16">
        {renderProgressBar()}
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow">
          {currentStep === "welcome" && renderWelcomeStep()}
          {currentStep === "agency" && renderAgencyForm()}
          {currentStep === "first-project" && renderProjectForm()}
          {currentStep === "integrations" && renderIntegrationsForm()}
          {currentStep === "complete" && renderCompleteStep()}
        </div>
      </main>
    </div>
  );
}