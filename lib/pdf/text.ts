import type { ExtractedPage } from "@/lib/pdf/types";

export function hasExtractableText(pages: ExtractedPage[]): boolean {
  return pages.some((page) => page.content.replace(/\s+/g, "").length > 0);
}

export function readPdfInfoTitle(info: unknown): string | null {
  if (typeof info !== "object" || info === null || !("Title" in info)) {
    return null;
  }

  const title = info.Title;
  if (typeof title !== "string") {
    return null;
  }

  const trimmed = title.trim();
  return trimmed === "" ? null : trimmed;
}
