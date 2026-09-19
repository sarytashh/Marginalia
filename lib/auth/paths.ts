const PUBLIC_EXACT_PATHS = new Set(["/sign-in"]);
const PUBLIC_PREFIXES = ["/auth/"];

export function isPublicAuthPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}
