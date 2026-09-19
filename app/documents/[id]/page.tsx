import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";

import { DocumentDetailView } from "@/components/document/document-detail-view";
import { PageShell } from "@/components/page-shell";
import { getDocumentDetail } from "@/lib/documents/detail";
import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import type { DocumentDetail } from "@/lib/documents/types";
import { generateStudyMaterial } from "@/lib/generation/run";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getDocumentDetail(id);
    return { title: detail.document.title };
  } catch {
    return { title: "Material" };
  }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  let detail: DocumentDetail | null = null;
  let errorMessage: string | null = null;

  try {
    detail = await getDocumentDetail(id);
  } catch (error) {
    if (error instanceof DocumentError && error.status === 404) {
      notFound();
    }

    errorMessage =
      error instanceof DocumentError
        ? error.message
        : "Marginalia could not load this material. Try again.";
    if (!(error instanceof DocumentError)) {
      console.error(error);
    }
  }

  if (
    detail !== null &&
    detail.document.status === "generating" &&
    detail.document.topicCount === 0
  ) {
    const ownerId = await getDocumentOwnerId();
    after(() => generateStudyMaterial(id, ownerId));
  }

  if (detail !== null) {
    return (
      <PageShell>
        <DocumentDetailView initialDetail={detail} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="label-editorial">Material</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal md:text-[52px]">
        This material could not be loaded.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {errorMessage}
      </p>
    </PageShell>
  );
}
