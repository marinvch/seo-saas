/**
 * Types for keyword tracking and management
 */

/**
 * Represents a keyword being tracked for a project
 */
export interface Keyword {
  id: string;
  projectId: string;
  keyword: string; // The actual keyword phrase
  volume?: number; // Monthly search volume
  difficulty?: number; // Keyword difficulty score (0-100)
  cpc?: number; // Cost per click (for PPC reference)
  intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'mixed';
  tags?: string[]; // Custom tags for keyword organization
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for adding new keywords
 */
export interface AddKeywordsOptions {
  projectId: string;
  keywords: string[];
  countryCode?: string;
  device?: 'desktop' | 'mobile' | 'all';
  language?: string;
  tags?: string[];
}

/**
 * Represents a keyword ranking position at a specific date
 */
export interface KeywordRanking {
  id: string;
  keywordId: string;
  position: number; // Ranking position
  previousPosition?: number; // Previous ranking position, if available
  change?: number; // Change in position (positive or negative)
  url?: string; // URL of the ranking page
  date: Date; // Date when this ranking was fetched
}

/**
 * Represents a search engine result page entry
 */
export interface SerpResult {
  position: number;
  url: string;
  title: string;
  description?: string;
  domain: string;
  isOwnSite?: boolean;
}

/**
 * Status of a keyword tracking job
 */
export type KeywordTrackingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Response from keyword research API
 */
export interface KeywordResearchResult {
  keyword: string;
  searchVolume?: number;
  cpc?: number;
  competition?: number;
  difficulty?: number;
  relatedKeywords?: string[];
  intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'mixed';
}

/**
 * Options for keyword research
 */
export interface KeywordResearchOptions {
  seed: string;
  countryCode?: string;
  language?: string;
  limit?: number;
}

/**
 * Keyword group for organization
 */
export interface KeywordGroup {
  id: string;
  name: string;
  projectId: string;
  keywordIds: string[];
  createdAt: Date;
  updatedAt: Date;
}