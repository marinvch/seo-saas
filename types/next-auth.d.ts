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