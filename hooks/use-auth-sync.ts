'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setUserData, clearUserData, fetchUserOrganizations, Role } from '../store/slices/user-slice';

/**
 * Hook to synchronize NextAuth session with Redux store
 * This ensures that the user state in Redux is always in sync with the auth session
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // When session loads or changes, update Redux state
    if (status === 'authenticated' && session?.user) {
      // Map session user to our Redux user structure
      const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email as string,
        image: session.user.image,
        role: session.user.role as unknown as Role, // Cast to our Redux store Role enum
        emailVerified: session.user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update user data in Redux
      dispatch(setUserData(user));
      
      // Fetch user's organizations
      dispatch(fetchUserOrganizations());
    } else if (status === 'unauthenticated') {
      // Clear user data when session ends
      dispatch(clearUserData());
    }
  }, [session, status, dispatch]);
  
  return { session, status };
}