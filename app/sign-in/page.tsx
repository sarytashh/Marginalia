import type { Metadata } from "next";

import { SignInView } from "@/components/auth/sign-in-view";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  return (
    <SignInView
      initialError={parseLinkError(params.error)}
      nextPath={safeNextPath(params.next)}
    />
  );
}

function parseLinkError(value: string | undefined): "expired" | "invalid" | null {
  if (value === "expired" || value === "invalid") {
    return value;
  }
  return null;
}
