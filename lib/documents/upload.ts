import "server-only";

import { after } from "next/server";

import { DocumentError } from "@/lib/documents/http";
import { createDocumentRow, parseUploadedDocument } from "@/lib/documents/repository";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { pdfStoragePath } from "@/lib/documents/storage-paths";
import { DOCUMENTS_BUCKET, type LibraryDocument } from "@/lib/documents/types";
import { MAX_PDF_BYTES } from "@/lib/pdf/constants";
import { titleFromFilename } from "@/lib/pdf/title";
import { validatePdfBytes } from "@/lib/pdf/validate";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const MAX_TITLE_LENGTH = 200;

export async function uploadPdfDocument(formData: FormData): Promise<LibraryDocument> {
  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) {
    throw new DocumentError("Choose a PDF to add.", 400);
  }

  if (fileValue.size > MAX_PDF_BYTES) {
    throw new DocumentError(
      "Marginalia currently reads text-based PDFs up to 20 MB.",
      400,
    );
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const validationError = validatePdfBytes(bytes, {
    name: fileValue.name,
    type: fileValue.type,
    size: fileValue.size,
  });
  if (validationError) {
    throw new DocumentError(validationError, 400);
  }

  const requestedTitle = readTitle(formData.get("title"), fileValue.name);
  const userId = await getDocumentOwnerId();
  const documentId = crypto.randomUUID();
  const storagePath = pdfStoragePath(userId, documentId, fileValue.name);

  const supabase = createServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error(uploadError);
    throw new DocumentError("Marginalia could not store this PDF. Try again.", 500);
  }

  try {
    const document = await createDocumentRow({
      id: documentId,
      userId,
      title: requestedTitle,
      filename: fileValue.name,
      storagePath,
    });

    after(() =>
      parseUploadedDocument({
        bytes,
        documentId,
        filename: fileValue.name,
        storagePath,
        title: requestedTitle,
        userId,
      }),
    );

    return document;
  } catch (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    throw error;
  }
}

function readTitle(value: FormDataEntryValue | null, filename: string): string {
  if (typeof value !== "string") {
    return titleFromFilename(filename);
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return titleFromFilename(filename);
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new DocumentError("Titles can be at most 200 characters.", 400);
  }

  return trimmed;
}
