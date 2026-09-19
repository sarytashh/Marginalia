"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PageIntro } from "@/components/page-intro";
import { PageShell } from "@/components/page-shell";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <PageIntro
        label="Interrupted"
        title="This page could not be shown."
        description="Your materials and answers are still saved. Try again, or return to the Library."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => retry()}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
          >
            Return to Library
          </Link>
        </div>
      </PageIntro>
    </PageShell>
  );
}
