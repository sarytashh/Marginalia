import type { Metadata } from "next";
import Link from "next/link";

import { StudyView } from "@/components/study/study-view";
import { DocumentError } from "@/lib/documents/http";
import { loadStudySession } from "@/lib/study/queue";
import type { StudySearchParams } from "@/lib/study/params";
import type { StudySessionPayload } from "@/lib/study/types";

export const metadata: Metadata = {
  title: "Study",
};

export const dynamic = "force-dynamic";

type StudyPageProps = {
  searchParams: Promise<StudySearchParams>;
};

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const params = await searchParams;
  let payload: StudySessionPayload | null = null;
  let errorMessage: string | null = null;

  try {
    payload = await loadStudySession(params);
  } catch (error) {
    errorMessage =
      error instanceof DocumentError
        ? error.message
        : "Marginalia could not load your study session. Try again.";
    if (!(error instanceof DocumentError)) {
      console.error(error);
    }
  }

  if (payload !== null) {
    return <StudyView initial={payload} />;
  }

  return (
    <div className="max-w-app mx-auto w-full px-5 py-10 md:px-8 md:py-20 lg:px-12">
      <p className="label-editorial">Study</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal md:text-[52px]">
        This session could not be loaded.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {errorMessage}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/study"
          className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
        >
          Try loading again
        </Link>
        <Link
          href="/"
          className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
        >
          Return to Library
        </Link>
      </div>
    </div>
  );
}
