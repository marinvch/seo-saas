import { runScheduledRankChecks, checkRankingsForProject } from './automated-rank-tracker';

/**
 * Main scheduler function
 * This would be called by a cron job or a webhook
 */
export async function runScheduler(options: { task?: string; projectId?: string }) {
  const { task, projectId } = options;
  console.log(`Running scheduler with task: ${task || 'all'}`);
  
  try {
    switch (task) {
      case 'rank-tracking':
        // Run rank tracking task for all eligible projects
        await runScheduledRankChecks();
        break;
      
      case 'project-rank-tracking':
        // Run rank tracking for a specific project
        if (!projectId) {
          throw new Error('Project ID is required for project-rank-tracking task');
        }
        await checkRankingsForProject(projectId);
        break;
      
      default:
        // Run all scheduled tasks
        await runScheduledRankChecks();
        break;
    }
    
    console.log('Scheduler completed successfully');
  } catch (error) {
    console.error('Error running scheduler:', error);
  }
}

// This can be called from a script or API endpoint
if (require.main === module) {
  // Called directly from node
  const args = process.argv.slice(2);
  const task = args[0];
  const projectId = args[1];
  
  runScheduler({ task, projectId })
    .then(() => {
      console.log('Scheduler execution complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scheduler execution failed:', error);
      process.exit(1);
    });
}