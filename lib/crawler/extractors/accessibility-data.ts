import { Page } from 'playwright';
import { AccessibilityData } from '@/types/audit';

export async function extractAccessibilityData(page: Page): Promise<AccessibilityData> {
  // Get accessibility snapshot from Playwright
  const snapshot = await page.accessibility.snapshot();
  
  // Run axe-core for accessibility analysis
  const violations = await page.evaluate(async () => {
    // Dynamically load axe-core
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js';
    document.head.appendChild(script);
    
    // Wait for axe to load
    await new Promise(resolve => script.onload = resolve);
    
    // Run analysis
    const results = await (window as any).axe.run();
    
    return results.violations.map((violation: any) => ({
      impact: violation.impact,
      description: violation.description,
      selector: violation.nodes.map((node: any) => node.target.join(' ')).join(', '),
    }));
  });

  // Calculate accessibility score
  const calculateScore = (violations: typeof violations): number => {
    let score = 100;
    
    // Deduct points based on violation impact
    const impactScores = {
      critical: 25,
      serious: 15,
      moderate: 10,
      minor: 5,
    };

    violations.forEach(violation => {
      score -= impactScores[violation.impact as keyof typeof impactScores] || 0;
    });

    return Math.max(0, score);
  };

  return {
    score: calculateScore(violations),
    violations,
  };
}