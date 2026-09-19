import "server-only";

import { batchItems } from "@/lib/ai/batch";
import { embedTexts } from "@/lib/ai/embed";
import { AiError } from "@/lib/ai/errors";
import { chunkPages, type SourceChunk } from "@/lib/chunker";
import { SEARCH_INDEX_FAILED_MESSAGE } from "@/lib/documents/constants";
import { DocumentError } from "@/lib/documents/http";
import { toLibraryDocument } from "@/lib/documents/map";
import { getFailedStepId } from "@/lib/documents/processing";
import {
  getOwnedDocument,
  parseUploadedDocument,
  updateDocument,
} from "@/lib/documents/repository";
import { loadStoredPages } from "@/lib/documents/stored-pages";
import { DOCUMENTS_BUCKET, type LibraryDocument } from "@/lib/documents/types";
import { toPgVector } from "@/lib/documents/vector";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const CHUNK_INSERT_BATCH_SIZE = 40;

type ProcessDocumentInput = {
  bytes: Uint8Array;
  documentId: string;
  filename: string;
  storagePath: string;
  title: string;
  userId: string;
};

export async function processUploadedDocument(input: ProcessDocumentInput): Promise<void> {
  const readyToEmbed = await parseUploadedDocument(input);
  if (!readyToEmbed) {
    return;
  }

  await embedStoredPages(input.documentId, input.userId);
}

export async function embedStoredPages(documentId: string, userId: string): Promise<void> {
  await updateDocument(documentId, {
    status: "embedding",
    error_message: null,
  });

  try {
    const stored = await loadStoredPages(userId, documentId);
    if (stored === null) {
      throw new DocumentError(
        "Marginalia could not find the extracted pages. Try this step again.",
        500,
      );
    }

    const chunks = chunkPages(stored.pages);
    if (chunks.length === 0) {
      await updateDocument(documentId, {
        status: "failed",
        error_message: SEARCH_INDEX_FAILED_MESSAGE,
      });
      return;
    }

    const vectors = await embedTexts(chunks.map((chunk) => chunk.content));
    if (vectors.length !== chunks.length) {
      throw new Error("Embedding count did not match chunk count");
    }

    await replaceDocumentChunks(documentId, chunks, vectors);
    await updateDocument(documentId, {
      status: "generating",
      error_message: null,
    });
  } catch (error) {
    console.error(error);
    await updateDocument(documentId, {
      status: "failed",
      error_message: embeddingErrorMessage(error),
    });
  }
}

export async function prepareDocumentRetry(documentId: string): Promise<{
  document: LibraryDocument;
  job: () => Promise<void>;
}> {
  const row = await getOwnedDocument(documentId);
  if (row.status !== "failed") {
    throw new DocumentError("This document is not waiting for a retry.", 400);
  }

  const failedStep = getFailedStepId(toLibraryDocument(row));

  if (failedStep === "reading") {
    const bytes = await downloadPdfBytes(row.storage_path);
    await updateDocument(row.id, {
      status: "uploaded",
      error_message: null,
    });
    return {
      document: toLibraryDocument(await getOwnedDocument(row.id)),
      job: () =>
        processUploadedDocument({
          bytes,
          documentId: row.id,
          filename: row.filename,
          storagePath: row.storage_path,
          title: row.title,
          userId: row.user_id,
        }),
    };
  }

  const stored = await loadStoredPages(row.user_id, row.id);
  if (stored === null) {
    const bytes = await downloadPdfBytes(row.storage_path);
    await updateDocument(row.id, {
      status: "uploaded",
      error_message: null,
    });
    return {
      document: toLibraryDocument(await getOwnedDocument(row.id)),
      job: () =>
        processUploadedDocument({
          bytes,
          documentId: row.id,
          filename: row.filename,
          storagePath: row.storage_path,
          title: row.title,
          userId: row.user_id,
        }),
    };
  }

  await updateDocument(row.id, {
    status: "embedding",
    error_message: null,
  });
  return {
    document: toLibraryDocument(await getOwnedDocument(row.id)),
    job: () => embedStoredPages(row.id, row.user_id),
  };
}

async function downloadPdfBytes(storagePath: string): Promise<Uint8Array> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(storagePath);

  if (error || data === null) {
    console.error(error);
    throw new DocumentError(
      "Marginalia could not find the original PDF. Upload the file again.",
      500,
    );
  }

  return new Uint8Array(await data.arrayBuffer());
}

async function replaceDocumentChunks(
  documentId: string,
  chunks: SourceChunk[],
  vectors: number[][],
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: existingError } = await supabase
    .from("chunks")
    .select("id")
    .eq("document_id", documentId);

  if (existingError) {
    console.error(existingError);
    throw new Error("Failed to load existing chunks");
  }

  const rows = chunks.map((chunk, index) => {
    const embedding = vectors[index];
    if (embedding === undefined) {
      throw new Error("Missing embedding for a chunk");
    }
    return {
      id: crypto.randomUUID(),
      document_id: documentId,
      content: chunk.content,
      page_number: chunk.pageNumber,
      token_count: chunk.tokenCount,
      embedding: toPgVector(embedding),
    };
  });

  for (const batch of batchItems(rows, CHUNK_INSERT_BATCH_SIZE)) {
    const { error } = await supabase.from("chunks").insert(batch);
    if (error) {
      console.error(error);
      throw new Error("Failed to store chunk embeddings");
    }
  }

  const staleIds = (existing ?? []).map((row) => row.id);
  if (staleIds.length > 0) {
    const { error } = await supabase.from("chunks").delete().in("id", staleIds);
    if (error) {
      console.error(error);
      throw new Error("Failed to replace previous chunks");
    }
  }
}

function embeddingErrorMessage(error: unknown): string {
  if (error instanceof DocumentError) {
    return error.message;
  }
  if (error instanceof AiError) {
    return error.message;
  }
  return SEARCH_INDEX_FAILED_MESSAGE;
}
