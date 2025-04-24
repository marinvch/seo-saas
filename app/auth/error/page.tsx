"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("An authentication error occurred");
  
  useEffect(() => {
    const error = searchParams.get("error");
    
    if (error) {
      switch (error) {
        case "CredentialsSignin":
          setErrorMessage("Invalid email or password. Please try again.");
          break;
        case "OAuthAccountNotLinked":
          setErrorMessage("This email is already associated with a different provider. Please sign in using the original provider.");
          break;
        case "AccessDenied":
          setErrorMessage("Access denied. You don't have permission to sign in.");
          break;
        case "EmailSignin":
          setErrorMessage("The email could not be sent. Please try again.");
          break;
        case "Verification":
          setErrorMessage("The verification link is invalid or has expired.");
          break;
        default:
          setErrorMessage(`An authentication error occurred: ${error}`);
          break;
      }
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please try again or contact support if the problem persists.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex space-x-2 w-full">
            <Button asChild variant="outline" className="w-1/2">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild className="w-1/2">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
          
          <Button asChild variant="link" className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}