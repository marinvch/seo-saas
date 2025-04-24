import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// This middleware protects the dashboard routes
export default withAuth(
  function middleware(req) {
    // Get the pathname
    const { pathname } = req.nextUrl;
    // Get the token from the request
    const token = req.nextauth?.token;

    // Allow access to onboarding for authenticated users regardless of role
    if (pathname.startsWith("/onboarding") && token) {
      return NextResponse.next();
    }

    // Admin routes - only accessible to admin users
    if (pathname.startsWith("/dashboard/admin") && token?.role !== "ADMIN") {
      // Redirect to access denied page
      return NextResponse.redirect(new URL("/auth/access-denied", req.url));
    }

    // All other paths under dashboard are already protected by withAuth
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run middleware on authorized routes
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all dashboard routes and API routes that should require authentication
export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/onboarding/:path*"
  ],
};