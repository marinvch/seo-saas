import { prisma } from '@/lib/db/prisma-client';
import { checkKeywordRankings } from './rank-tracker';
import { RankTrackingFrequency } from '@prisma/client';

/**
 * Check rankings for all projects scheduled for today
 * This function would be called by a cron job or scheduler
 */
export async function runScheduledRankChecks(): Promise<void> {
  try {
    // Get current date for comparison
    const now = new Date();
    
    // Find all projects with rank tracking settings
    const projects = await prisma.project.findMany({
      where: {
        projectSettings: {
          rankTrackingFreq: {
            not: null,
          }
        },
      },
      include: {
        projectSettings: true,
      }
    });

    // Check each project to see if it needs ranking updates today
    for (const project of projects) {
      const settings = project.projectSettings;
      
      // Skip projects with no settings
      if (!settings) continue;
      
      // Check when rankings were last checked
      const lastRankingCheck = await prisma.rankTracking.findFirst({
        where: {
          projectId: project.id,
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Determine if we should check rankings based on frequency
      let shouldCheck = false;
      
      if (!lastRankingCheck) {
        // First-time check
        shouldCheck = true;
      } else {
        const lastCheckDate = lastRankingCheck.date;
        const daysSinceLastCheck = Math.floor(
          (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        switch (settings.rankTrackingFreq) {
          case RankTrackingFrequency.DAILY:
            shouldCheck = daysSinceLastCheck >= 1;
            break;
          case RankTrackingFrequency.WEEKLY:
            shouldCheck = daysSinceLastCheck >= 7;
            break;
          case RankTrackingFrequency.MONTHLY:
            shouldCheck = daysSinceLastCheck >= 30;
            break;
          default:
            shouldCheck = false;
        }
      }
      
      if (shouldCheck) {
        // Get keywords for this project (limit to 30 to prevent overloading)
        const keywords = await prisma.keyword.findMany({
          where: {
            projectId: project.id,
          },
          take: 30,
        });
        
        if (keywords.length === 0) continue;
        
        // Log the check
        console.log(`Checking rankings for project: ${project.name} (${project.id}) - ${keywords.length} keywords`);
        
        // Check rankings
        const rankingResults = await checkKeywordRankings({
          projectUrl: project.url,
          keywords: keywords.map(k => ({ 
            id: k.id, 
            keyword: k.keyword 
          })),
          searchEngine: 'google',
        });
        
        // Store the results in the database
        await Promise.all(
          rankingResults.map(async (result) => {
            // Get the previous rank for this keyword (if any)
            const previousRanking = await prisma.rankTracking.findFirst({
              where: {
                keywordId: result.keywordId,
                projectId: project.id,
              },
              orderBy: {
                date: 'desc',
              },
              select: {
                rank: true,
              },
            });

            // Calculate the change in ranking
            const previousRank = previousRanking?.rank || null;
            const change = result.rank !== null && previousRank !== null
              ? previousRank - result.rank
              : null;

            // Store the new ranking
            return prisma.rankTracking.create({
              data: {
                projectId: project.id,
                keywordId: result.keywordId,
                rank: result.rank,
                previousRank,
                change,
                url: result.url,
                searchEngine: 'google',
              },
            });
          })
        );
        
        // Create notification for significant ranking changes
        const significantChanges = rankingResults.filter(r => {
          // Check if entered top 10
          const enteredTop10 = r.rank !== null && r.rank <= 10 && (r.page || 0) <= 1;
          // Check if big position improvement 
          const previousRanking = r.position ? r.position : 0;
          const bigImprovement = previousRanking > 0 && r.rank !== null && (previousRanking - r.rank >= 10);
          
          return enteredTop10 || bigImprovement;
        });
        
        if (significantChanges.length > 0) {
          // Get project owner
          const projectOwner = await prisma.user.findFirst({
            where: {
              id: project.createdById,
            },
          });
          
          if (projectOwner) {
            // Create notification
            await prisma.notification.create({
              data: {
                userId: projectOwner.id,
                title: 'Significant Ranking Changes',
                message: `${significantChanges.length} keywords for "${project.name}" have significant ranking improvements!`,
                type: 'SUCCESS',
                link: `/dashboard/projects/${project.id}/keywords?tab=tracking`,
              },
            });
          }
        }
      }
    }
    
    console.log('Scheduled rank checks complete');
  } catch (error) {
    console.error('Error running scheduled rank checks:', error);
  }
}

/**
 * Check rankings for a specific project
 * @param projectId Project to check rankings for
 */
export async function checkRankingsForProject(projectId: string): Promise<void> {
  try {
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { keywords: true },
    });
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // Get keywords for this project (limit to 30 to prevent overloading)
    const keywords = await prisma.keyword.findMany({
      where: {
        projectId,
      },
      take: 30,
    });
    
    if (keywords.length === 0) {
      console.log(`No keywords found for project: ${project.name} (${projectId})`);
      return;
    }
    
    // Check rankings
    const rankingResults = await checkKeywordRankings({
      projectUrl: project.url,
      keywords: keywords.map(k => ({ 
        id: k.id, 
        keyword: k.keyword 
      })),
      searchEngine: 'google',
    });
    
    // Store the results in the database
    await Promise.all(
      rankingResults.map(async (result) => {
        // Get the previous rank for this keyword (if any)
        const previousRanking = await prisma.rankTracking.findFirst({
          where: {
            keywordId: result.keywordId,
            projectId,
          },
          orderBy: {
            date: 'desc',
          },
          select: {
            rank: true,
          },
        });

        // Calculate the change in ranking
        const previousRank = previousRanking?.rank || null;
        const change = result.rank !== null && previousRank !== null
          ? previousRank - result.rank
          : null;

        // Store the new ranking
        return prisma.rankTracking.create({
          data: {
            projectId,
            keywordId: result.keywordId,
            rank: result.rank,
            previousRank,
            change,
            url: result.url,
            searchEngine: 'google',
          },
        });
      })
    );
    
    console.log(`Rank check for project ${project.name} (${projectId}) complete`);
  } catch (error) {
    console.error(`Error checking rankings for project ${projectId}:`, error);
  }
}