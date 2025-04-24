import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Protects an API route by verifying authentication and optionally checking user roles
 * @param handler The API route handler function
 * @param options Configuration options for route protection
 * @returns Protected API route handler
 */
export function withApiAuth<T>(
  handler: (
    req: NextRequest, 
    context: { params: T }, 
    token: any
  ) => Promise<NextResponse> | NextResponse,
  options: {
    requiredRole?: string | string[];
  } = {}
) {
  return async (
    req: NextRequest,
    context: { params: T }
  ): Promise<NextResponse> => {
    const token = await getToken({ req });

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Check for required role if specified
    if (options.requiredRole) {
      const userRole = token.role as string;
      const requiredRoles = Array.isArray(options.requiredRole)
        ? options.requiredRole
        : [options.requiredRole];

      if (!userRole || !requiredRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // User is authenticated and has the required role, proceed with the handler
    return handler(req, context, token);
  };
}