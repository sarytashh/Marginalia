import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SearchDebugView } from "@/components/debug/search-debug-view";
import { PageShell } from "@/components/page-shell";
import { isProductionRuntime } from "@/lib/dev";
import { DocumentError } from "@/lib/documents/http";
import { listLibraryDocuments } from "@/lib/documents/repository";
import type { LibraryDocument } from "@/lib/documents/types";

export const metadata: Metadata = {
  title: "Retrieval debug",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function DebugSearchPage() {
  if (isProductionRuntime()) {
    notFound();
  }

  let documents: LibraryDocument[] = [];
  let error: string | null = null;

  try {
    documents = await listLibraryDocuments();
  } catch (caught) {
    error =
      caught instanceof DocumentError
        ? caught.message
        : "Marginalia could not load your materials. Try again.";
    if (!(caught instanceof DocumentError)) {
      console.error(caught);
    }
  }

  const indexed = documents.filter(
    (document) => document.status === "generating" || document.status === "ready",
  );

  return (
    <PageShell>
      <SearchDebugView
        documents={documents}
        initialDocumentId={indexed[0]?.id ?? ""}
        loadError={error}
      />
    </PageShell>
  );
}
