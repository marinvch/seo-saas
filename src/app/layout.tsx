import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { ReduxProvider } from "@/store/redux-provider";
import { ServiceInitializer } from "@/components/providers/service-initializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEO SaaS | Complete SEO Platform for Digital Agencies",
  description:
    "All-in-one SEO platform for digital agencies with site auditing, rank tracking, keyword research, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReduxProvider>
              <ServiceInitializer />
              {children}
              <Toaster />
            </ReduxProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
