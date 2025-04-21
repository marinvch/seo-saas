import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma-client";
import { z } from "zod";
import crypto from "crypto";

// Schema for validating forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const { email } = forgotPasswordSchema.parse(body);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // For security reasons, always return success even if user doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ 
        success: true,
        message: "If your email is registered, you will receive password reset instructions."
      });
    }

    // Generate a token with expiry for the password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour
    
    // In a real implementation, you would:
    // 1. Store the reset token in the database
    // 2. Send an email with a link to reset the password

    /* In a real application, uncomment and implement these:
    
    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    
    // Send email with reset link
    await sendResetEmail({
      email: user.email,
      resetToken,
      name: user.name || 'User',
    });
    */
    
    // Log that we would send an email (for development)
    console.log(`Password reset email would be sent to: ${email} with token: ${resetToken}`);
    
    return NextResponse.json({ 
      success: true,
      message: "Password reset instructions sent to your email"
    });
  } catch (error) {
    console.error("Password reset error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}