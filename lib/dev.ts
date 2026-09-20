export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDebugPath(pathname: string): boolean {
  return (
    pathname === "/debug" ||
    pathname.startsWith("/debug/") ||
    pathname === "/api/debug" ||
    pathname.startsWith("/api/debug/")
  );
}
