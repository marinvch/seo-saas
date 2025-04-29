"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RankTrackingFrequency } from "@prisma/client";

const formSchema = z.object({
  rankTrackingFreq: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  autoAuditFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  emailAlerts: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectSettingsType {
  id: string;
  projectId: string;
  rankTrackingFreq: RankTrackingFrequency;
  autoAuditFrequency: RankTrackingFrequency;
  emailAlerts: boolean;
  slackWebhookUrl: string | null;
  integrations: any | null;
}

interface ProjectAuditSettingsProps {
  projectId: string;
  settings: ProjectSettingsType;
}

export function ProjectAuditSettings({ projectId, settings }: ProjectAuditSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rankTrackingFreq: settings.rankTrackingFreq,
      autoAuditFrequency: settings.autoAuditFrequency,
      emailAlerts: settings.emailAlerts,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update audit settings");
      }

      toast({
        title: "Audit settings updated",
        description: "Your audit settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update audit settings. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const frequencyOptions = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Settings</CardTitle>
        <CardDescription>
          Configure how often your site is audited and when you receive updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="autoAuditFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Automatic Audit Frequency</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    How often should we automatically audit your site?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rankTrackingFreq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rank Tracking Frequency</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    How often should we check your keyword rankings?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Email Alerts
                    </FormLabel>
                    <FormDescription>
                      Receive email notifications when audits complete or rankings change
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
