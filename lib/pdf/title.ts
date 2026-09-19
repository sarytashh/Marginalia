export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? filename;
  const withoutExtension = base.replace(/\.pdf$/i, "");
  const normalized = withoutExtension.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized === "" ? "Untitled material" : normalized;
}

export function sanitizeStorageFilename(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? "document.pdf";
  const cleaned = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
  const withName = cleaned === "" ? "document.pdf" : cleaned;
  return withName.toLowerCase().endsWith(".pdf") ? withName : `${withName}.pdf`;
}

export function looksLikePdfFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith(".pdf");
}
