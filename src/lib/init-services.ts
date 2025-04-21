import { initAuditHandlers, setupAuditScheduleChecker } from './queue/audit-handlers';

/**
 * Initialize all background services for the application
 * This should be called when the app starts
 */
export async function initServices() {
  // Check if we're in a server environment
  if (typeof window === 'undefined') {
    console.log('Starting background services...');
    
    try {
      // Initialize audit job handlers
      initAuditHandlers();
      
      // Set up the scheduler for automated audits
      await setupAuditScheduleChecker();
      
      console.log('Background services started successfully');
      
      // Return the workers for proper shutdown (no need with in-memory queue)
      return {};
    } catch (error) {
      console.error('Failed to start background services:', error);
      return {};
    }
  }
  
  return {};
}

/**
 * Call this function to shut down services gracefully
 * Typically used when the server is shutting down
 */
export async function shutdownServices() {
  // No special shutdown needed for in-memory queue
  console.log('Background services shut down');
}