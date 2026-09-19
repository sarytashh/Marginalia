export function safeNextPath(value: string | null | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "/";
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  if (value.includes("://") || value.includes("\\")) {
    return "/";
  }
  return value;
}

export function signInHref(nextPath: string): string {
  const safe = safeNextPath(nextPath);
  if (safe === "/") {
    return "/sign-in";
  }
  return `/sign-in?next=${encodeURIComponent(safe)}`;
}
