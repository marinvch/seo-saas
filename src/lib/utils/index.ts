import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind CSS classes properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with -
    .replace(/&/g, "-and-")   // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-")   // Replace multiple - with single -
    .replace(/^-+/, "")       // Trim - from start of text
    .replace(/-+$/, "");      // Trim - from end of text
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format a date to a human readable format
 */
export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Truncate a string to a specific length and add ellipsis
 */
export function truncate(str: string, length: number): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  if (!url) return "";
  try {
    const domain = new URL(url).hostname;
    return domain.startsWith("www.") ? domain.substring(4) : domain;
  } catch (e) {
    return url;
  }
}