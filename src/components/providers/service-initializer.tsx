"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initServices } from "@/lib/init-services";

/**
 * ServiceInitializer component
 * Initializes application services when the app loads
 * Only runs initialization once the user is authenticated
 */
export function ServiceInitializer() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      // Initialize services only when authenticated
      initServices();
    }
  }, [status]);

  return null;
}