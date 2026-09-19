import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/page-intro";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <PageShell>
      <PageIntro
        label="Not in this journal"
        title="That page is not in Marginalia."
        description="The address may be mistyped, or the material may have been removed from this library."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Return to Library
          </Link>
          <Link
            href="/study"
            className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
          >
            Go to Study
          </Link>
        </div>
      </PageIntro>
    </PageShell>
  );
}
