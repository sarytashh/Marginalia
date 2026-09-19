import "server-only";

import {
  EMPTY_DOCUMENT_COUNTS,
  type DocumentCounts,
} from "@/lib/documents/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function loadCountsForDocuments(
  documentIds: readonly string[],
): Promise<Map<string, DocumentCounts>> {
  const counts = new Map<string, DocumentCounts>();
  for (const documentId of documentIds) {
    counts.set(documentId, { ...EMPTY_DOCUMENT_COUNTS });
  }

  if (documentIds.length === 0) {
    return counts;
  }

  const ids = [...documentIds];
  const supabase = createServiceRoleClient();

  const [chunks, topics, questions] = await Promise.all([
    supabase.from("chunks").select("document_id").in("document_id", ids),
    supabase.from("topics").select("document_id").in("document_id", ids),
    supabase.from("questions").select("document_id").in("document_id", ids),
  ]);

  if (chunks.error) {
    console.error(chunks.error);
  }
  if (topics.error) {
    console.error(topics.error);
  }
  if (questions.error) {
    console.error(questions.error);
  }

  tally(counts, chunks.data, "chunkCount");
  tally(counts, topics.data, "topicCount");
  tally(counts, questions.data, "questionCount");

  return counts;
}

function tally(
  counts: Map<string, DocumentCounts>,
  rows: { document_id: string }[] | null,
  field: keyof DocumentCounts,
): void {
  if (rows === null) {
    return;
  }

  for (const row of rows) {
    const current = counts.get(row.document_id);
    if (current === undefined) {
      continue;
    }
    current[field] += 1;
  }
}
