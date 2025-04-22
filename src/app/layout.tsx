import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceInitializer } from "@/components/providers/service-initializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEOmaster - All-in-One SEO Platform for Digital Agencies",
  description: "Streamline your agency's SEO workflows. Audit sites, track keywords, monitor backlinks, and deliver beautiful client reports - all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ServiceInitializer />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
