import { Role } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role: Role;
      emailVerified: Date | null;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types 
   */
  interface User {
    id: string;
    role: Role;
    emailVerified: Date | null;
  }
}

declare module 'next-auth/jwt' {
  /** Extend the built-in JWT types */
  interface JWT {
    id: string;
    email: string;
    role: Role;
    emailVerified?: Date | null;
  }
}