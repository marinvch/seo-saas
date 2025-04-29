import { PrismaClient } from '@prisma/client';
import { AuditIssue } from '@/types/audit';

const prisma = new PrismaClient();

/**
 * Simulates an audit process for development purposes
 * In production, this would be replaced by a real crawler
 */
export async function simulateAudit(auditId: string): Promise<void> {
  try {
    // Get the audit
    const audit = await prisma.siteAudit.findUnique({
      where: { id: auditId },
      include: {
        project: true
      }
    });

    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    // Update to in progress status
    await prisma.siteAudit.update({
      where: { id: auditId },
      data: {
        status: 'IN_PROGRESS',
        progressPercentage: 0
      }
    });

    // Simulate crawling delay
    const simulationSteps = 10;
    const delay = 1000; // 1 second per step
    
    for (let i = 1; i <= simulationSteps; i++) {
      // Check if audit has been cancelled
      const checkAudit = await prisma.siteAudit.findUnique({
        where: { id: auditId },
        select: { status: true }
      });
      
      if (checkAudit?.status === 'FAILED') {
        console.log(`Audit ${auditId} was cancelled, stopping simulation`);
        return;
      }
      
      // Update progress
      const progress = Math.floor((i / simulationSteps) * 100);
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          progressPercentage: progress,
          totalPages: i * 10 // Simulate finding more pages
        }
      });
      
      // Wait before next update
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Generate mock issues
    const issues = generateMockIssues(audit.project.url);
    
    // Calculate issue summary
    const issuesSummary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      total: issues.length
    };

    // Mark audit as complete
    await prisma.siteAudit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercentage: 100,
        pageResults: { issues },
        issuesSummary
      }
    });

    // Create audit history entry
    await prisma.auditHistory.create({
      data: {
        projectId: audit.projectId,
        auditId: audit.id,
        totalPages: simulationSteps * 10,
        issuesSummary
      }
    });

    console.log(`Audit ${auditId} completed successfully`);
  } catch (error) {
    console.error(`Error in audit simulation for ${auditId}:`, error);
    
    // Mark audit as failed
    try {
      await prisma.siteAudit.update({
        where: { id: auditId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: `Simulation error: ${(error as Error).message}`
        }
      });
    } catch (updateError) {
      console.error(`Failed to update audit status for ${auditId}:`, updateError);
    }
  }
}

/**
 * Generate mock issues for development purposes
 */
function generateMockIssues(siteUrl: string): AuditIssue[] {
  const baseUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const mockPages = [
    '',
    'about',
    'contact',
    'products',
    'services',
    'blog',
    'blog/post-1',
    'blog/post-2',
    'faq'
  ];

  const issues: AuditIssue[] = [
    {
      message: 'Missing meta description',
      severity: 'warning',
      details: 'Meta descriptions help search engines understand the content of your page and can improve click-through rates in search results.',
      fix: 'Add a descriptive meta description tag between 120-155 characters long.',
      affectedUrls: [baseUrl, `${baseUrl}about`, `${baseUrl}products`]
    },
    {
      message: 'Page title too short',
      severity: 'warning',
      details: 'Short titles may not provide enough information for search engines and users.',
      fix: 'Create a title that is 50-60 characters long and includes your primary keyword.',
      affectedUrls: [`${baseUrl}contact`]
    },
    {
      message: 'Missing H1 heading',
      severity: 'critical',
      details: 'H1 headings are important for page structure and SEO. Every page should have exactly one H1 heading.',
      fix: 'Add a single H1 heading containing your primary keyword to the page.',
      affectedUrls: [`${baseUrl}blog/post-2`, `${baseUrl}faq`]
    },
    {
      message: 'Slow page load time (>3s)',
      severity: 'critical',
      details: 'Slow page load times can negatively impact user experience and search rankings.',
      fix: 'Optimize images, minimize CSS/JS, and consider using a CDN.',
      affectedUrls: [`${baseUrl}products`, `${baseUrl}services`]
    },
    {
      message: 'Images missing alt text',
      severity: 'warning',
      details: 'Alternative text helps visually impaired users and helps search engines understand image content.',
      fix: 'Add descriptive alt text to all images that conveys their purpose and content.',
      affectedUrls: mockPages.map(page => `${baseUrl}${page}`).slice(0, 5)
    },
    {
      message: 'Low word count (<300 words)',
      severity: 'warning',
      details: 'Pages with thin content may not provide enough value to users and may rank poorly.',
      fix: 'Expand the content to at least 300 words while maintaining quality and relevance.',
      affectedUrls: [`${baseUrl}contact`, `${baseUrl}faq`]
    },
    {
      message: 'Mobile viewport not set',
      severity: 'critical',
      details: 'Without a viewport meta tag, mobile devices will render the page at a typical desktop screen width.',
      fix: 'Add a viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">',
      affectedUrls: [`${baseUrl}blog/post-1`]
    },
    {
      message: 'HTTP instead of HTTPS',
      severity: 'critical',
      details: 'HTTPS is important for security and is a ranking factor for search engines.',
      fix: 'Install an SSL certificate and redirect HTTP traffic to HTTPS.',
      affectedUrls: siteUrl.startsWith('http:') ? [siteUrl] : []
    },
    {
      message: 'Duplicate content detected',
      severity: 'warning',
      details: 'Duplicate content can confuse search engines and lead to ranking issues.',
      fix: 'Use canonical tags to indicate the preferred version of the content.',
      affectedUrls: [`${baseUrl}products`, `${baseUrl}services/products`]
    },
    {
      message: 'Broken internal links',
      severity: 'critical',
      details: 'Broken links create a poor user experience and waste crawl budget.',
      fix: 'Fix or remove links to non-existent pages.',
      affectedUrls: [`${baseUrl}blog/post-1`, `${baseUrl}services`]
    },
    {
      message: 'No structured data implemented',
      severity: 'info',
      details: 'Structured data helps search engines understand your content better and can enable rich results.',
      fix: 'Implement relevant Schema.org markup for your content type.',
      affectedUrls: mockPages.map(page => `${baseUrl}${page}`)
    },
    {
      message: 'CSS files not minified',
      severity: 'info',
      details: 'Unminified CSS files increase page load time.',
      fix: 'Use a CSS minifier to reduce the file size of your stylesheets.',
      affectedUrls: [baseUrl]
    },
    {
      message: 'JavaScript not deferred',
      severity: 'info',
      details: 'Non-deferred JavaScript can block page rendering and slow down page load.',
      fix: 'Add the defer attribute to non-critical script tags.',
      affectedUrls: [`${baseUrl}about`, `${baseUrl}products`]
    }
  ];

  // Randomly remove some issues for variety
  return issues.filter(() => Math.random() > 0.3);
}