'use server';

import { initServices } from '@/lib/init-services';

/**
 * This is a server component that initializes background services
 * It should be included in the root layout.tsx to start services when the app starts
 */
export async function ServiceInitializer() {
  try {
    // Only run initialization in production or when explicitly enabled
    if (
      process.env.NODE_ENV === 'production' || 
      process.env.ENABLE_BACKGROUND_SERVICES === 'true'
    ) {
      await initServices();
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Don't throw, we don't want to break the app rendering
  }
  
  // This component doesn't render anything
  return null;
}