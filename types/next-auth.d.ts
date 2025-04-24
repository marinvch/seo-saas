import { DefaultSession } from "next-auth";

// Define the Role enum directly in this file to avoid circular dependencies
// Make sure these values match exactly with your Prisma schema enum Role
export enum Role {
  USER = "USER",
  AGENCY_OWNER = "AGENCY_OWNER",
  AGENCY_MEMBER = "AGENCY_MEMBER",
  CLIENT = "CLIENT",
  ADMIN = "ADMIN"
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: string;
      /** The user's unique identifier. */
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    /** The user's role. */
    role?: string;
    /** The user's unique identifier. */
    id: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's role. */
    role?: string;
    /** The user's unique identifier. */
    id?: string;
  }
}
