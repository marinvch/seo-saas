import { Page } from 'playwright';
import { PerformanceData } from '@/types/audit';

export async function extractPerformanceData(page: Page): Promise<PerformanceData> {
  // Enable performance metrics collection
  await page.setExtraHTTPHeaders({ 'Server-Timing': '*' });
  
  // Get performance metrics using Chrome DevTools Protocol
  const performanceMetrics = await page.evaluate(async () => {
    // Wait for LCP to be calculated
    await new Promise(resolve => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) resolve(undefined);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Fallback after 10 seconds
      setTimeout(resolve, 10000);
    });

    // Get all performance entries
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const lcpEntry = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
    const fidEntry = performance.getEntriesByType('first-input')[0];
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');

    // Calculate CLS
    const cls = layoutShiftEntries.reduce((sum, entry: any) => sum + entry.value, 0);

    // Get resource timing data
    const resources = performance.getEntriesByType('resource');
    const resourceLoadTimes: Record<string, number> = {};
    const resourceSizes: Record<string, number> = {};

    resources.forEach((resource: PerformanceResourceTiming) => {
      const url = resource.name;
      resourceLoadTimes[url] = resource.duration;
      resourceSizes[url] = resource.encodedBodySize;
    });

    return {
      ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
      fcp: (paintEntries.find(entry => entry.name === 'first-contentful-paint') as PerformancePaintTiming)?.startTime || 0,
      lcp: lcpEntry ? (lcpEntry as any).startTime : 0,
      cls,
      fid: fidEntry ? (fidEntry as any).processingStart - (fidEntry as any).startTime : 0,
      speedIndex: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
      resourceLoadTimes,
      resourceSizes,
    };
  });

  // Calculate performance score based on Core Web Vitals thresholds
  const calculateScore = (metrics: typeof performanceMetrics): number => {
    let score = 100;
    
    // LCP thresholds: Good < 2.5s, Poor > 4s
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 15;

    // FID thresholds: Good < 100ms, Poor > 300ms
    if (metrics.fid > 300) score -= 25;
    else if (metrics.fid > 100) score -= 15;

    // CLS thresholds: Good < 0.1, Poor > 0.25
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 15;

    // TTFB thresholds: Good < 600ms, Poor > 1.8s
    if (metrics.ttfb > 1800) score -= 25;
    else if (metrics.ttfb > 600) score -= 15;

    return Math.max(0, score);
  };

  return {
    ...performanceMetrics,
    performanceScore: calculateScore(performanceMetrics),
  };
}