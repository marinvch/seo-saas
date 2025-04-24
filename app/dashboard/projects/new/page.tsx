import { Metadata } from "next";
import NewProjectForm from "../../components/projects/new-project-form";

export const metadata: Metadata = {
  title: "Create New Project | SEO SaaS",
  description: "Add a new project to monitor and analyze."
};

export default function NewProjectPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
      <NewProjectForm />
    </div>
  );
}