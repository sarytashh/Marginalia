import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Self-hosted via npm rather than next/font/google: Google Fonts is unreachable
// from mainland China, which would break the build wherever this is developed.
import "@fontsource-variable/source-serif-4";
import "./globals.css";

import { AuthHashCatcher } from "@/components/auth/auth-hash-catcher";
import { ConnectionNotice } from "@/components/connection-notice";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSessionUser } from "@/lib/auth/session";
import { countDueQuestions } from "@/lib/documents/due";
import { siteDescription, siteName, siteUrl } from "@/lib/site-metadata";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    locale: "en_US",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

// Typed explicitly rather than with Next's generated `LayoutProps`, so that
// `pnpm typecheck` passes on a clean checkout before anything has been built.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const dueCount = user === null ? 0 : await countDueQuestions().catch(() => 0);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthHashCatcher />
          {user ? (
            <SiteHeader dueCount={dueCount} email={user.email ?? "Account"} />
          ) : null}
          <ConnectionNotice />
          <main className={user ? "flex-1 pb-14 md:pb-0" : "flex-1"}>{children}</main>
          {user ? <MobileNav /> : null}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
