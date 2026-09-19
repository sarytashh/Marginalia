import { sanitizeStorageFilename } from "@/lib/pdf/title";

export function pdfStoragePath(
  userId: string,
  documentId: string,
  filename: string,
): string {
  return `${userId}/${documentId}/${sanitizeStorageFilename(filename)}`;
}

export function pagesStoragePath(userId: string, documentId: string): string {
  return `${userId}/${documentId}/pages.json`;
}
