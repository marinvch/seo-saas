'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createProject } from '@/store/slices/projects-slice';
import { selectCurrentOrganization, selectOrganizations, setCurrentOrganization } from '@/store/slices/user-slice';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { ProjectType } from '@prisma/client';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  url: z.string().url('Please enter a valid URL'),
  type: z.enum(['WEBSITE', 'BLOG', 'ECOMMERCE', 'SOCIAL_MEDIA']),
  targetCountry: z.string().min(2).optional(),
  targetLanguage: z.string().min(2).optional(),
  organizationId: z.string().uuid(),
});

type FormValues = z.infer<typeof projectSchema>;

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
];

export function CreateProjectForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const organizations = useAppSelector(selectOrganizations);
  const currentOrganization = useAppSelector(selectCurrentOrganization);
  
  // Get organization slug from URL query parameters if provided
  const organizationSlug = searchParams.get('organizationSlug');

  // Find the organization by slug if provided in query params
  useEffect(() => {
    if (organizationSlug && organizations.length > 0) {
      const orgBySlug = organizations.find(org => org.slug === organizationSlug);
      if (orgBySlug) {
        dispatch(setCurrentOrganization(orgBySlug));
      }
    }
  }, [organizationSlug, organizations, dispatch]);

  // Set default organization if there's only one
  useEffect(() => {
    if (organizations.length === 1 && !currentOrganization) {
      dispatch(setCurrentOrganization(organizations[0]));
    }
  }, [organizations, currentOrganization, dispatch]);

  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      url: '',
      type: 'WEBSITE',
      targetCountry: '',
      targetLanguage: '',
      organizationId: currentOrganization?.id || '',
    },
  });

  // Update form when current organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      form.setValue('organizationId', currentOrganization.id);
    }
  }, [currentOrganization, form]);

  // Handle organization change
  const handleOrganizationChange = (orgId: string) => {
    const selectedOrg = organizations.find(org => org.id === orgId);
    if (selectedOrg) {
      dispatch(setCurrentOrganization(selectedOrg));
      form.setValue('organizationId', orgId);
    }
  };

  async function onSubmit(data: FormValues) {
    if (!data.organizationId) {
      toast({
        title: 'Error',
        description: 'Please select an organization for this project.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const project = await dispatch(createProject(data)).unwrap();
      
      toast({
        title: 'Project Created',
        description: 'Your project has been created successfully.',
      });

      // Redirect to the project dashboard
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error('Project creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {organizations.length > 1 && (
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select 
                      onValueChange={handleOrganizationChange} 
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select which organization this project belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {organizations.length === 1 && (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  {organizations[0]?.name || "Your Organization"}
                </div>
                <FormDescription>
                  This project will be created in your organization
                </FormDescription>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Website" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your project a descriptive name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The main URL of your website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type that best matches your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Country (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="US" {...field} />
                  </FormControl>
                  <FormDescription>
                    Two-letter country code (e.g., US, UK, DE)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Language (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="en" {...field} />
                  </FormControl>
                  <FormDescription>
                    Two-letter language code (e.g., en, es, fr)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}