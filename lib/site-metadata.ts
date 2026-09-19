export const siteName = "Marginalia";

export const siteDescription =
  "An AI study tutor that turns lecture-slide PDFs into practice questions grounded in your own material, grades written answers, and schedules what to review next.";

export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured !== undefined && configured !== "") {
    return new URL(configured);
  }
  return new URL("http://localhost:4317");
}
