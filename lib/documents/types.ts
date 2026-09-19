import type { Enums } from "@/lib/database.types";

export type DocumentStatus = Enums<"document_status">;

export type LibraryDocument = {
  createdAt: string;
  errorMessage: string | null;
  filename: string;
  id: string;
  pageCount: number | null;
  status: DocumentStatus;
  title: string;
};

export const DOCUMENTS_BUCKET = "documents";
