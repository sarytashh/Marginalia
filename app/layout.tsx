import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Self-hosted via npm rather than next/font/google: Google Fonts is unreachable
// from mainland China, which would break the build wherever this is developed.
import "@fontsource-variable/source-serif-4";
import "./globals.css";

import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Marginalia",
    template: "%s · Marginalia",
  },
  description:
    "An AI study tutor that turns your lecture slides into practice questions, grades your written answers, and schedules what to review next.",
};

// Typed explicitly rather than with Next's generated `LayoutProps`, so that
// `pnpm typecheck` passes on a clean checkout before anything has been built.
export default function RootLayout({ children }: { children: ReactNode }) {
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
          <SiteHeader />
          <main className="flex-1 pb-14 md:pb-0">{children}</main>
          <MobileNav />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
