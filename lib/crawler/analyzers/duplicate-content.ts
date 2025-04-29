import { log } from 'crawlee';

/**
 * Simple implementation of Jaccard similarity for text comparison
 * Jaccard similarity = intersection size / union size
 * 
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns Similarity score between 0 (different) and 1 (identical)
 */
function jaccardSimilarity(text1: string, text2: string): number {
  // Convert texts to sets of words
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(Boolean));
  
  // Skip if either set is too small (likely not enough content to compare)
  if (words1.size < 10 || words2.size < 10) {
    return 0;
  }
  
  // Calculate intersection
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  
  // Calculate union
  const union = new Set([...words1, ...words2]);
  
  // Return Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Check if content is a duplicate of any previously crawled page
 * 
 * @param url URL of the current page
 * @param content Text content of the page
 * @param duplicateMap Map of URL to content for already processed pages
 * @returns URL of duplicate page if found, null otherwise
 */
export async function detectDuplicateContent(
  url: string, 
  content: string, 
  duplicateContentMap: Map<string, string[]>
): Promise<string | null> {
  // Skip if content is too short
  if (content.length < 500) {
    return null;
  }
  
  // Clean up content for comparison (remove extra spaces, normalize)
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Fingerprint the content - create a small signature for fast comparison
  const contentFingerprint = createContentFingerprint(cleanContent);
  
  // Compare against existing pages
  for (const [existingUrl, fingerprints] of duplicateContentMap.entries()) {
    // Skip comparing a page to itself
    if (existingUrl === url) {
      continue;
    }
    
    // Quick check using content fingerprints
    const hasSimilarFingerprint = fingerprints.some(fingerprint => 
      fingerprintSimilarity(fingerprint, contentFingerprint) > 0.7
    );
    
    if (hasSimilarFingerprint) {
      // Full content comparison is only done for potential matches
      const storedContent = await retrievePageContent(existingUrl);
      
      if (storedContent) {
        const similarity = jaccardSimilarity(cleanContent, storedContent);
        
        // If similarity is above threshold, consider it a duplicate
        if (similarity > 0.85) {
          log.info(`Found duplicate content: ${url} is similar to ${existingUrl} (${Math.round(similarity * 100)}%)`);
          return existingUrl;
        }
      }
    }
  }
  
  // Store this page's content fingerprint for future comparisons
  const currentFingerprints = duplicateContentMap.get(url) || [];
  currentFingerprints.push(contentFingerprint);
  duplicateContentMap.set(url, currentFingerprints);
  
  // Also store full content for potential future comparisons
  storePageContent(url, cleanContent);
  
  return null;
}

/**
 * Create a content fingerprint (simplified shingle-based approach)
 * Used for quick comparisons before doing full Jaccard similarity
 */
function createContentFingerprint(content: string): string {
  // Create a simplified fingerprint based on selected words
  const words = content.split(/\s+/).filter(Boolean);
  
  // Skip if too few words
  if (words.length < 20) {
    return '';
  }
  
  // Take words at specific positions for the fingerprint
  // This creates a sparse representation of the content
  const positions = [
    0, // first word
    5, 
    10,
    25,
    50,
    75,
    100,
    Math.floor(words.length / 2), // middle
    words.length - 1, // last word
  ];
  
  // Filter out positions that are beyond the content length
  const validPositions = positions.filter(pos => pos < words.length);
  
  // Create fingerprint from words at those positions
  return validPositions.map(pos => words[pos]).join(' ');
}

/**
 * Compare two content fingerprints for similarity
 */
function fingerprintSimilarity(fp1: string, fp2: string): number {
  if (!fp1 || !fp2) return 0;
  
  const words1 = fp1.split(' ');
  const words2 = fp2.split(' ');
  
  const intersection = words1.filter(word => words2.includes(word));
  
  return intersection.length / Math.max(words1.length, words2.length);
}

// Simple in-memory storage for page content
// In a production system, this would be backed by a database or external storage
const pageContentCache: Map<string, string> = new Map();

/**
 * Store page content for future comparisons
 */
function storePageContent(url: string, content: string): void {
  pageContentCache.set(url, content);
  
  // Simple cache management to prevent memory issues
  if (pageContentCache.size > 1000) {
    // Remove a random entry if cache gets too large
    const randomKey = Array.from(pageContentCache.keys())[0];
    pageContentCache.delete(randomKey);
  }
}

/**
 * Retrieve stored page content
 */
async function retrievePageContent(url: string): Promise<string | null> {
  return pageContentCache.get(url) || null;
}