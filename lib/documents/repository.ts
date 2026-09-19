import "server-only";

import type { Enums, Tables } from "@/lib/database.types";
import { loadCountsForDocuments } from "@/lib/documents/counts";
import { DocumentError } from "@/lib/documents/http";
import { toLibraryDocument } from "@/lib/documents/map";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { pagesStoragePath } from "@/lib/documents/storage-paths";
import {
  DOCUMENTS_BUCKET,
  EMPTY_DOCUMENT_COUNTS,
  type LibraryDocument,
} from "@/lib/documents/types";
import { extractPdf } from "@/lib/pdf/extract";
import { NO_TEXT_PDF_MESSAGE } from "@/lib/pdf/constants";
import { hasExtractableText } from "@/lib/pdf/text";
import { titleFromFilename } from "@/lib/pdf/title";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type DocumentRow = Tables<"documents">;
type DocumentStatus = Enums<"document_status">;

export async function listLibraryDocuments(): Promise<LibraryDocument[]> {
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not load your materials. Try again.", 500);
  }

  return withCounts(data);
}

export async function getOwnedDocument(documentId: string): Promise<DocumentRow> {
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not load that document. Try again.", 500);
  }

  if (data === null) {
    throw new DocumentError("That document is not in your library.", 404);
  }

  return data;
}

export async function getOwnedLibraryDocument(
  documentId: string,
): Promise<LibraryDocument> {
  const row = await getOwnedDocument(documentId);
  const [mapped] = await withCounts([row]);
  return mapped ?? toLibraryDocument(row, EMPTY_DOCUMENT_COUNTS);
}

export async function createDocumentRow(input: {
  filename: string;
  id: string;
  storagePath: string;
  title: string;
  userId: string;
}): Promise<LibraryDocument> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: input.id,
      user_id: input.userId,
      title: input.title,
      filename: input.filename,
      storage_path: input.storagePath,
      status: "uploaded",
    })
    .select("*")
    .single();

  if (error || data === null) {
    console.error(error);
    throw new DocumentError(
      "Marginalia could not save this document. Check that DEV_USER_ID matches a user in Supabase Auth.",
      500,
    );
  }

  const [mapped] = await withCounts([data]);
  return mapped ?? toLibraryDocument(data, EMPTY_DOCUMENT_COUNTS);
}

export async function renameDocument(
  documentId: string,
  title: string,
): Promise<LibraryDocument> {
  const trimmed = title.trim();
  if (trimmed === "") {
    throw new DocumentError("Give this material a title.", 400);
  }
  if (trimmed.length > 200) {
    throw new DocumentError("Titles can be at most 200 characters.", 400);
  }

  await getOwnedDocument(documentId);
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .update({ title: trimmed })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error || data === null) {
    console.error(error);
    throw new DocumentError("Marginalia could not rename this material. Try again.", 500);
  }

  const [mapped] = await withCounts([data]);
  return mapped ?? toLibraryDocument(data, EMPTY_DOCUMENT_COUNTS);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const row = await getOwnedDocument(documentId);
  const supabase = createServiceRoleClient();
  const ownerId = row.user_id;
  const paths = [row.storage_path, pagesStoragePath(ownerId, documentId)];

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove(paths);

  if (storageError) {
    console.error(storageError);
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not delete this material. Try again.", 500);
  }
}

export async function parseUploadedDocument(input: {
  bytes: Uint8Array;
  documentId: string;
  filename: string;
  storagePath: string;
  title: string;
  userId: string;
}): Promise<boolean> {
  await updateDocument(input.documentId, {
    status: "parsing",
    error_message: null,
  });

  try {
    const extracted = await extractPdf(input.bytes);

    if (!hasExtractableText(extracted.pages)) {
      await updateDocument(input.documentId, {
        status: "failed",
        page_count: extracted.pageCount,
        error_message: NO_TEXT_PDF_MESSAGE,
      });
      return false;
    }

    const supabase = createServiceRoleClient();
    const pagesPath = pagesStoragePath(input.userId, input.documentId);
    const { error: pagesError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(
        pagesPath,
        JSON.stringify({
          metadataTitle: extracted.metadataTitle,
          pageCount: extracted.pageCount,
          pages: extracted.pages,
        }),
        {
          contentType: "application/json",
          upsert: true,
        },
      );

    if (pagesError) {
      console.error(pagesError);
      throw new Error("Failed to store extracted pages");
    }

    const nextTitle =
      extracted.metadataTitle && input.title === titleFromFilename(input.filename)
        ? extracted.metadataTitle
        : input.title;

    await updateDocument(input.documentId, {
      status: "embedding",
      page_count: extracted.pageCount,
      title: nextTitle,
      error_message: null,
    });
    return true;
  } catch (error) {
    console.error(error);
    await updateDocument(input.documentId, {
      status: "failed",
      error_message: "Marginalia could not read this PDF. Try this step again.",
    });
    return false;
  }
}

export async function updateDocument(
  documentId: string,
  values: {
    error_message?: string | null;
    page_count?: number | null;
    status?: DocumentStatus;
    title?: string;
  },
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("documents").update(values).eq("id", documentId);

  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not update this document. Try again.", 500);
  }
}

async function withCounts(rows: DocumentRow[]): Promise<LibraryDocument[]> {
  const counts = await loadCountsForDocuments(rows.map((row) => row.id));
  return rows.map((row) =>
    toLibraryDocument(row, counts.get(row.id) ?? EMPTY_DOCUMENT_COUNTS),
  );
}
