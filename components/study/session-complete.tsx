import Link from "next/link";

import { formatAnswersRecorded, formatNextReview } from "@/lib/study/format";
import { buildStudyHref } from "@/lib/study/params";
import type { StudySessionMeta } from "@/lib/study/types";

type SessionCompleteProps = {
  completedCount: number;
  meta: StudySessionMeta;
  topics: readonly string[];
};

export function SessionComplete({
  completedCount,
  meta,
  topics,
}: SessionCompleteProps) {
  const nextReview = formatNextReview(
    meta.nextReviewAt === null ? null : new Date(meta.nextReviewAt),
    new Date(),
  );
  const continueHref = buildStudyHref({
    documentId: meta.scope.documentId,
    topicId: meta.scope.topicId,
    ahead: true,
    length: 5,
  });
  const canContinue = meta.remainingCount > 0 || meta.aheadAvailable;

  return (
    <div className="max-w-reading">
      <p className="label-editorial">Session complete</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        {formatAnswersRecorded(completedCount)}
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {completedCount === 1 ? "1 answer saved." : `${completedCount} answers saved.`}{" "}
        {nextReview}
      </p>

      {topics.length > 0 ? (
        <section className="border-rule mt-10 border-t pt-8" aria-labelledby="topics-practiced">
          <h2
            id="topics-practiced"
            className="font-serif text-ink text-[26px] leading-[1.25] font-normal"
          >
            Topics in this session
          </h2>
          <ul className="mt-4 space-y-3">
            {topics.map((topic) => (
              <li key={topic} className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-ink text-[18px] leading-[1.4]">
                  {topic}
                </span>
                <span className="text-muted-ink shrink-0 text-[12px] tracking-[0.04em]">
                  Recorded
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted-ink mt-8 max-w-[34rem] text-[15px] leading-[1.65]">
        Grading is not scoring these yet, so they stay in the review queue.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/"
          className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
        >
          Return to Library
        </Link>
        {canContinue ? (
          <Link
            href={continueHref}
            className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
          >
            Continue with 5 more
          </Link>
        ) : null}
      </div>
    </div>
  );
}
