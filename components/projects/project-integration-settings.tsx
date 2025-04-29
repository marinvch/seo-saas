"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const slackSchema = z.object({
  slackWebhookUrl: z
    .string()
    .url({ message: "Please enter a valid Slack webhook URL" })
    .or(z.string().length(0)),
});

const googleSchema = z.object({
  googleSearchConsoleUrl: z.string().url().or(z.string().length(0)),
  googleAnalyticsId: z.string().or(z.string().length(0)),
});

// Define the expected type for the integrations
interface IntegrationsType {
  googleSearchConsole?: string;
  googleAnalytics?: string;
}

interface ProjectSettingsType {
  id: string;
  projectId: string;
  rankTrackingFreq: string;
  autoAuditFrequency: string;
  emailAlerts: boolean;
  slackWebhookUrl: string | null;
  integrations: IntegrationsType | null | any; // Use 'any' to accept JsonValue from Prisma
}

interface ProjectIntegrationSettingsProps {
  projectId: string;
  settings: ProjectSettingsType;
}

export function ProjectIntegrationSettings({ projectId, settings }: ProjectIntegrationSettingsProps) {
  const [slackLoading, setSlackLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Parse integrations from JsonValue to IntegrationsType
  const integrations: IntegrationsType = settings.integrations 
    ? (typeof settings.integrations === 'object' 
        ? settings.integrations as IntegrationsType 
        : JSON.parse(String(settings.integrations))) 
    : { googleSearchConsole: "", googleAnalytics: "" };

  const slackForm = useForm<z.infer<typeof slackSchema>>({
    resolver: zodResolver(slackSchema),
    defaultValues: {
      slackWebhookUrl: settings.slackWebhookUrl || "",
    },
  });

  const googleForm = useForm<z.infer<typeof googleSchema>>({
    resolver: zodResolver(googleSchema),
    defaultValues: {
      googleSearchConsoleUrl: integrations.googleSearchConsole || "",
      googleAnalyticsId: integrations.googleAnalytics || "",
    },
  });

  async function onSlackSubmit(values: z.infer<typeof slackSchema>) {
    setSlackLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/slack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update Slack integration");
      }

      toast({
        title: "Slack integration updated",
        description: "Your Slack webhook has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Slack integration. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setSlackLoading(false);
    }
  }

  async function onGoogleSubmit(values: z.infer<typeof googleSchema>) {
    setGoogleLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update Google integrations");
      }

      toast({
        title: "Google integrations updated",
        description: "Your Google Search Console and Analytics settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Google integrations. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect your project with other services and tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="google" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="slack">Slack</TabsTrigger>
          </TabsList>
          <TabsContent value="google">
            <Form {...googleForm}>
              <form onSubmit={googleForm.handleSubmit(onGoogleSubmit)} className="space-y-6">
                <FormField
                  control={googleForm.control}
                  name="googleSearchConsoleUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Search Console Property URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.example.com/" />
                      </FormControl>
                      <FormDescription>
                        Connect Google Search Console for enhanced ranking data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={googleForm.control}
                  name="googleAnalyticsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Analytics ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X" />
                      </FormControl>
                      <FormDescription>
                        Connect Google Analytics for traffic data integration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={googleLoading}>
                  {googleLoading ? "Saving..." : "Save Google Integrations"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="slack">
            <Form {...slackForm}>
              <form onSubmit={slackForm.handleSubmit(onSlackSubmit)} className="space-y-6">
                <FormField
                  control={slackForm.control}
                  name="slackWebhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slack Webhook URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://hooks.slack.com/services/..." />
                      </FormControl>
                      <FormDescription>
                        Receive notifications in your Slack channel when audits complete or rankings change
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={slackLoading}>
                  {slackLoading ? "Saving..." : "Save Slack Integration"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Need help setting up integrations? Check out our <a href="/help/integrations" className="underline text-primary">integration guide</a>.
        </p>
      </CardFooter>
    </Card>
  );
}
