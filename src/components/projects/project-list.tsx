"use client";

import { useState } from "react";
import Link from "next/link";
import { Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ExternalLink, PlusCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    project.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get project type badge color
  const getProjectTypeBadge = (type: string) => {
    switch(type) {
      case "WEBSITE":
        return <Badge variant="default">Website</Badge>;
      case "BLOG":
        return <Badge variant="secondary">Blog</Badge>;
      case "ECOMMERCE":
        return <Badge className="bg-green-600">E-commerce</Badge>;
      case "SOCIAL_MEDIA":
        return <Badge className="bg-blue-600">Social Media</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <div className="w-full sm:w-auto flex gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 inline-flex rounded-full p-4 mb-4">
            <Search className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-1">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {projects.length === 0 
              ? "Create your first project to start monitoring your website's SEO performance."
              : "No projects match your search. Try a different search term."}
          </p>
          {projects.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Project
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
            <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                  {getProjectTypeBadge(project.type)}
                </div>
                <CardDescription className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-1 truncate flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.url}
                  </a>
                </div>
                {project.targetCountry && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Target Country: {project.targetCountry}
                  </div>
                )}
                {project.targetLanguage && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Target Language: {project.targetLanguage}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="w-full">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Click to view details
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}