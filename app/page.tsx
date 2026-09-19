import type { Metadata } from "next";

import { LibraryView } from "@/components/library/library-view";
import { PageShell } from "@/components/page-shell";
import { countDueQuestions } from "@/lib/documents/due";
import { DocumentError } from "@/lib/documents/http";
import { listLibraryDocuments } from "@/lib/documents/repository";
import type { LibraryDocument } from "@/lib/documents/types";

export const metadata: Metadata = {
  title: "Library",
};

export default async function LibraryPage() {
  let documents: LibraryDocument[] = [];
  let dueCount = 0;
  let error: string | null = null;

  try {
    [documents, dueCount] = await Promise.all([
      listLibraryDocuments(),
      countDueQuestions(),
    ]);
  } catch (caught) {
    error =
      caught instanceof DocumentError
        ? caught.message
        : "Marginalia could not load your materials. Try again.";
    if (!(caught instanceof DocumentError)) {
      console.error(caught);
    }
  }

  return (
    <PageShell>
      <LibraryView
        dueCount={dueCount}
        initialDocuments={documents}
        initialError={error}
      />
    </PageShell>
  );
}
