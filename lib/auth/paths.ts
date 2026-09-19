const PUBLIC_EXACT_PATHS = new Set(["/sign-in"]);
const PUBLIC_PREFIXES = ["/auth/"];
const PUBLIC_METADATA_EXACT = new Set([
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/twitter-image",
  "/robots.txt",
  "/sitemap.xml",
]);

export function isPublicAuthPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
}

export function isPublicMetadataPath(pathname: string): boolean {
  if (PUBLIC_METADATA_EXACT.has(pathname)) {
    return true;
  }
  return (
    pathname.startsWith("/icon.") ||
    pathname.startsWith("/apple-icon.") ||
    pathname.startsWith("/opengraph-image.") ||
    pathname.startsWith("/twitter-image.")
  );
}

export function isPublicPath(pathname: string): boolean {
  return isPublicAuthPath(pathname) || isPublicMetadataPath(pathname);
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}
