import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// This middleware protects all routes under /dashboard and /api
// except for authentication-related API routes
export default withAuth(
  function middleware(req) {
    // Additional custom middleware logic can be added here
    
    // You can modify the response or headers if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    // Only protect these paths
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Match dashboard routes and protected API routes, but exclude public paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/((?!auth|webhooks).*)*',
  ],
};