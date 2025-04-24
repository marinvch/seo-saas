'use client';

import { useAuthSync } from '../../hooks/use-auth-sync';

/**
 * Component that initializes global services and state synchronization
 * This component doesn't render anything visible but handles important app-wide initialization
 */
export function ServiceInitializer() {
  // Sync authentication with Redux store
  useAuthSync();
  
  // We could add more initialization here in the future
  // - Real-time connection setup
  // - Analytics initialization
  // - Feature flags
  // - etc.
  
  return null;
}