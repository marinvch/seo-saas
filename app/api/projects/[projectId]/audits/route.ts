import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma-client';
import { SiteCrawler } from '@/lib/crawler/site-crawler';

interface RouteParams {
    projectId: string;
}

export const POST = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
    try {
        const { projectId } = params;
        const { maxPages, ignoreRobotsTxt, customHeaders } = await req.json();

        // Get the project to verify existence and get the URL
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { url: true, id: true }
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Create a new audit record
        const audit = await prisma.siteAudit.create({
            data: {
                projectId,
                siteUrl: project.url,
                status: 'PENDING',
                totalPages: 0,
                progressPercentage: 0,
                options: {
                    maxPages: maxPages || 1000,
                    ignoreRobotsTxt: ignoreRobotsTxt || false,
                    customHeaders: customHeaders || {}
                },
                issuesSummary: {}
            }
        });

        // Initialize and start the crawler
        const crawler = new SiteCrawler(project.url, {
            projectId,
            auditId: audit.id,
            maxPages,
            ignoreRobotsTxt,
            customHeaders
        });

        // Start the crawler in the background
        crawler.start().catch(async (error: Error) => {
            console.error('Crawler error:', error);
            await prisma.siteAudit.update({
                where: { id: audit.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message
                }
            });
        });

        return NextResponse.json({ auditId: audit.id }, { status: 201 });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: RouteParams }) => {
    try {
        const { projectId } = params;
        const searchParams = new URL(req.url).searchParams;
        const auditId = searchParams.get('auditId');

        const whereClause = auditId 
            ? { projectId, id: auditId }
            : { projectId };

        const audits = await prisma.siteAudit.findMany({
            where: whereClause,
            orderBy: { startedAt: 'desc' }
        });

        return NextResponse.json(audits);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});