'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function AccessDeniedPage() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-red-600 dark:text-red-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {session ? (
              <p>
                You're signed in as <span className="font-medium">{session.user?.email}</span>, but
                you don't have the required permissions to access this page.
              </p>
            ) : (
              <p>
                You need to be signed in with appropriate permissions to access this page.
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            <Button asChild variant="default">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            
            {session ? (
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}