import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';

// Extend NextRequest to include auth property
declare module 'next/server' {
  interface NextRequest {
    auth: {
      userId: string;
      email: string;
      role: Role;
    };
  }
}

export function withApiAuth(handler: Function) {
  return async (req: NextRequest, params: any) => {
    try {
      const token = await getToken({ req });

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Add auth data to request
      req.auth = {
        userId: token.id || token.sub!,
        email: token.email as string,
        role: token.role as Role,
      };

      return handler(req, params);
    } catch (error) {
      console.error('API Auth Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}