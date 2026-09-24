export function magicLinkRedirectTo(origin: string): string {
  return new URL("/auth/callback", origin).toString();
}
