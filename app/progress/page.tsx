import type { Metadata } from "next";
import Link from "next/link";

import { EmptyProgress } from "@/components/progress/empty-progress";
import { ProgressView } from "@/components/progress/progress-view";
import { PageShell } from "@/components/page-shell";
import { DocumentError } from "@/lib/documents/http";
import { loadProgressDashboard } from "@/lib/progress/load";
import type { ProgressDashboard } from "@/lib/progress/types";

export const metadata: Metadata = {
  title: "Progress",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  let dashboard: ProgressDashboard | null = null;
  let errorMessage: string | null = null;

  try {
    dashboard = await loadProgressDashboard();
  } catch (error) {
    errorMessage =
      error instanceof DocumentError
        ? error.message
        : "Marginalia could not load your progress. Try again.";
    if (!(error instanceof DocumentError)) {
      console.error(error);
    }
  }

  if (dashboard !== null && dashboard.attemptCount === 0) {
    return (
      <PageShell>
        <EmptyProgress hasQuestions={dashboard.hasQuestions} />
      </PageShell>
    );
  }

  if (dashboard !== null) {
    return (
      <PageShell>
        <ProgressView dashboard={dashboard} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="label-editorial">Progress</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal md:text-[52px]">
        Your progress could not be loaded.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {errorMessage}
      </p>
      <Link
        href="/progress"
        className="bg-burgundy text-paper hover:bg-burgundy-hover mt-8 inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
      >
        Try loading again
      </Link>
    </PageShell>
  );
}
