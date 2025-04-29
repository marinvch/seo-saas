import axios from 'axios';
import { log } from 'crawlee';

/**
 * Parse a robots.txt file and extract its rules
 * 
 * @param url - URL to the robots.txt file
 * @returns Object containing allowed and disallowed paths
 */
export async function parseRobotsTxt(url: string): Promise<{ allowed: string[], disallowed: string[] }> {
  try {
    // Fetch the robots.txt file
    const response = await axios.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'SEOMasterBot/1.0 (+https://seo-saas.example.com/bot)'
      }
    });
    
    // Parse the contents
    const content = response.data;
    
    // Extract rules for our user agent and for all agents
    const rules = extractRules(content, ['SEOMasterBot', '*']);
    
    return rules;
  } catch (error) {
    log.warning(`Failed to fetch robots.txt from ${url}: ${error}`);
    return { allowed: [], disallowed: [] };
  }
}

/**
 * Extract rules for specific user agents from robots.txt content
 */
function extractRules(content: string, userAgents: string[]): { allowed: string[], disallowed: string[] } {
  const lines = content.split('\n');
  const allowed: string[] = [];
  const disallowed: string[] = [];
  
  let currentUserAgent: string | null = null;
  let isRelevantUserAgent = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('#') || !trimmedLine) {
      continue;
    }
    
    // Check for User-agent lines
    const userAgentMatch = trimmedLine.match(/^User-agent:\s*(.+)$/i);
    if (userAgentMatch) {
      currentUserAgent = userAgentMatch[1].trim();
      isRelevantUserAgent = userAgents.includes(currentUserAgent);
      continue;
    }
    
    // Skip lines that don't apply to our user agent
    if (!isRelevantUserAgent) {
      continue;
    }
    
    // Check for Allow rules
    const allowMatch = trimmedLine.match(/^Allow:\s*(.+)$/i);
    if (allowMatch) {
      const path = allowMatch[1].trim();
      allowed.push(path);
      continue;
    }
    
    // Check for Disallow rules
    const disallowMatch = trimmedLine.match(/^Disallow:\s*(.+)$/i);
    if (disallowMatch) {
      const path = disallowMatch[1].trim();
      disallowed.push(path);
      continue;
    }
  }
  
  return { allowed, disallowed };
}