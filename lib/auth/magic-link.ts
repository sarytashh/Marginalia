import { safeNextPath } from "@/lib/auth/next-path";

export function magicLinkRedirectTo(origin: string, nextPath: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(nextPath));
  return url.toString();
}
