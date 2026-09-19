import type { Tables } from "@/lib/database.types";
import type { LibraryDocument } from "@/lib/documents/types";

export function toLibraryDocument(row: Tables<"documents">): LibraryDocument {
  return {
    id: row.id,
    title: row.title,
    filename: row.filename,
    pageCount: row.page_count,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}
