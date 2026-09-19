import type { Tables } from "@/lib/database.types";
import {
  EMPTY_DOCUMENT_COUNTS,
  type DocumentCounts,
  type LibraryDocument,
} from "@/lib/documents/types";

export function toLibraryDocument(
  row: Tables<"documents">,
  counts: DocumentCounts = EMPTY_DOCUMENT_COUNTS,
): LibraryDocument {
  return {
    id: row.id,
    title: row.title,
    filename: row.filename,
    pageCount: row.page_count,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    chunkCount: counts.chunkCount,
    topicCount: counts.topicCount,
    questionCount: counts.questionCount,
  };
}
