"use server";

import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma-client";

/**
 * Server-side function to validate user credentials
 * This keeps bcrypt usage on the server only
 */
export async function validateCredentials(email: string, password: string) {
  if (!email || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.password) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

/**
 * Hash a password using bcrypt (server-side only)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}
