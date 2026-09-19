import "server-only";

import { embedTexts } from "@/lib/ai/embed";
import { AiError } from "@/lib/ai/errors";
import { DocumentError } from "@/lib/documents/http";
import { toPgVector } from "@/lib/documents/vector";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type RetrievedChunk = {
  content: string;
  id: string;
  pageNumber: number;
  similarity: number;
  tokenCount: number;
};

const DEFAULT_MATCH_COUNT = 8;
const MAX_MATCH_COUNT = 20;

export async function searchChunks(
  documentId: string,
  query: string,
  limit: number = DEFAULT_MATCH_COUNT,
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim();
  if (trimmed === "") {
    throw new DocumentError("Enter a search query.", 400);
  }

  const matchCount = Math.min(MAX_MATCH_COUNT, Math.max(1, Math.floor(limit)));

  let embedding: number[];
  try {
    const [vector] = await embedTexts([trimmed]);
    if (vector === undefined) {
      throw new DocumentError("Marginalia could not embed that query. Try again.", 500);
    }
    embedding = vector;
  } catch (error) {
    if (error instanceof DocumentError) {
      throw error;
    }
    if (error instanceof AiError) {
      throw new DocumentError(error.message, 502);
    }
    console.error(error);
    throw new DocumentError("Marginalia could not embed that query. Try again.", 500);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("match_chunks", {
    document_id: documentId,
    match_count: matchCount,
    query_embedding: toPgVector(embedding),
  });

  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not search this document. Try again.", 500);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content,
    pageNumber: row.page_number,
    similarity: row.similarity,
    tokenCount: row.token_count,
  }));
}
