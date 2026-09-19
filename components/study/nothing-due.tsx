"use client";

import Link from "next/link";

import {
  formatNextReview,
  formatTodaySummary,
} from "@/lib/study/format";
import { buildStudyHref } from "@/lib/study/params";
import type { StudySessionMeta } from "@/lib/study/types";

type NothingDueProps = {
  meta: StudySessionMeta;
};

export function NothingDue({ meta }: NothingDueProps) {
  const aheadHref = buildStudyHref({
    documentId: meta.scope.documentId,
    topicId: meta.scope.topicId,
    ahead: true,
  });

  if (meta.emptyReason === "no-questions") {
    return (
      <div className="max-w-reading">
        <p className="label-editorial">Study</p>
        <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
          Nothing is ready to study yet.
        </h1>
        <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
          Upload a lecture PDF from the Library. Marginalia will write questions
          from that material, then this page becomes a single question at a time.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Add new material
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

  const nextReview = formatNextReview(
    meta.nextReviewAt === null ? null : new Date(meta.nextReviewAt),
    new Date(),
  );

  return (
    <div className="max-w-reading">
      <p className="label-editorial">All caught up</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        Nothing is waiting for review.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {nextReview} {formatTodaySummary(meta.todayAttemptCount)}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {meta.aheadAvailable ? (
          <Link
            href={aheadHref}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Study ahead
          </Link>
        ) : null}
        <Link
          href="/"
          className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
        >
          Return to Library
        </Link>
        <Link
          href="/"
          className="text-muted-ink hover:text-ink inline-flex min-h-11 items-center text-[14px] font-medium"
        >
          Add new material
        </Link>
      </div>
    </div>
  );
}
