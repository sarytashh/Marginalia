import {
  INVALID_PDF_MESSAGE,
  MAX_PDF_BYTES,
} from "@/lib/pdf/constants";
import { looksLikePdfFilename } from "@/lib/pdf/title";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] as const;

export type PdfFileLike = {
  name: string;
  size: number;
  type: string;
};

export function isPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType === "application/x-pdf";
}

export function isLikelyPdfFile(file: Pick<PdfFileLike, "name" | "type">): boolean {
  return isPdfMimeType(file.type) || looksLikePdfFilename(file.name);
}

export function validatePdfFile(file: PdfFileLike): string | null {
  if (file.size > MAX_PDF_BYTES || !isLikelyPdfFile(file)) {
    return INVALID_PDF_MESSAGE;
  }

  return null;
}

export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_MAGIC.length) {
    return false;
  }

  return PDF_MAGIC.every((value, index) => bytes[index] === value);
}

export function validatePdfBytes(bytes: Uint8Array, file: PdfFileLike): string | null {
  const fileError = validatePdfFile({
    name: file.name,
    type: file.type,
    size: bytes.byteLength,
  });
  if (fileError) {
    return fileError;
  }

  if (!hasPdfMagicBytes(bytes)) {
    return INVALID_PDF_MESSAGE;
  }

  return null;
}
