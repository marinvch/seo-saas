"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "../ui/use-toast";
import { Loader2 } from "lucide-react";

// Form schema for adding keywords
const addKeywordsSchema = z.object({
  keywords: z
    .string()
    .min(1, "Please enter at least one keyword")
    .refine(
      (val) => val.split("\n").filter((k) => k.trim()).length > 0,
      "Please enter at least one valid keyword"
    ),
  countryCode: z.string().optional(),
  device: z.enum(["desktop", "mobile", "all"]).optional(),
  language: z.string().optional(),
});

interface AddKeywordsFormProps {
  projectId: string;
  defaultCountry?: string;
  defaultLanguage?: string;
  onSuccess?: () => void;
}

export default function AddKeywordsForm({
  projectId,
  defaultCountry,
  defaultLanguage,
  onSuccess,
}: AddKeywordsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup form with default values
  const form = useForm<z.infer<typeof addKeywordsSchema>>({
    resolver: zodResolver(addKeywordsSchema),
    defaultValues: {
      keywords: "",
      countryCode: defaultCountry || "us",
      device: "desktop" as const,
      language: defaultLanguage || "en",
    },
  });

  // Submit handler
  async function onSubmit(values: z.infer<typeof addKeywordsSchema>) {
    setIsSubmitting(true);

    try {
      // Transform keywords from string to array
      const keywordArray = values.keywords
        .split("\n")
        .map((kw) => kw.trim())
        .filter(Boolean);

      // Make API call to add keywords
      const response = await fetch(
        `/api/projects/${projectId}/keywords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keywords: keywordArray,
            countryCode: values.countryCode,
            device: values.device,
            language: values.language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add keywords");
      }

      // Show success message
      toast({
        title: "Keywords added successfully",
        description: data.message || `Added ${data.keywordIds?.length || 0} new keywords.`,
      });

      // Reset form and update UI
      form.reset();
      
      // Refresh data
      router.refresh();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding keywords:", error);
      toast({
        title: "Error adding keywords",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Keywords</CardTitle>
        <CardDescription>
          Add keywords to track for this project. Enter one keyword per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter keywords, one per line
e.g. seo software
digital marketing tools
rank tracker
etc."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter each keyword on a new line. You can add up to 100 keywords at once.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="gb">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="es">Spain</SelectItem>
                          <SelectItem value="it">Italy</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The country to track rankings for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="all">All Devices</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The device type to track rankings for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The language to track rankings for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-4">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Keywords...
                </>
              ) : (
                "Add Keywords"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}