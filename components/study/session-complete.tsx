import Link from "next/link";

import { SCORE_CORRECT } from "@/lib/study/constants";
import {
  formatAverageScore,
  formatIdeasHeld,
  formatNextReview,
  formatSessionNote,
  formatVerdict,
  summarizeSessionTopics,
} from "@/lib/study/format";
import { buildStudyHref } from "@/lib/study/params";
import type { SessionTopicResult, StudySessionMeta } from "@/lib/study/types";

type SessionCompleteProps = {
  completedCount: number;
  meta: StudySessionMeta;
  scores: readonly number[];
  topics: readonly SessionTopicResult[];
};

export function SessionComplete({
  completedCount,
  meta,
  scores,
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
  const heldCount = scores.filter((score) => score >= SCORE_CORRECT).length;
  const average = formatAverageScore(scores);
  const summarized = summarizeSessionTopics(topics);

  return (
    <div className="max-w-reading">
      <p className="label-editorial">Session complete</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        {formatIdeasHeld(heldCount, completedCount)}
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {completedCount === 1 ? "1 answer saved." : `${completedCount} answers saved.`}
        {average ? ` ${average}` : ""} {nextReview}
      </p>

      {summarized.length > 0 ? (
        <section className="border-rule mt-10 border-t pt-8" aria-labelledby="topics-practiced">
          <h2
            id="topics-practiced"
            className="font-serif text-ink text-[26px] leading-[1.25] font-normal"
          >
            Topics in this session
          </h2>
          <ul className="mt-4 space-y-3">
            {summarized.map((topic) => (
              <li key={topic.name} className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-ink text-[18px] leading-[1.4]">
                  {topic.name}
                </span>
                <span
                  className={`shrink-0 text-[12px] tracking-[0.04em] ${topicMovementClass(topic.verdict)}`}
                >
                  {formatVerdict(topic.verdict)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted-ink mt-8 max-w-[34rem] text-[15px] leading-[1.65]">
        {formatSessionNote(summarized)}
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

function topicMovementClass(verdict: SessionTopicResult["verdict"]): string {
  switch (verdict) {
    case "correct":
      return "text-state-solid";
    case "partial":
      return "text-state-learning";
    case "incorrect":
      return "text-state-shaky";
  }
}
