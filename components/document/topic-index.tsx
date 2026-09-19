"use client";

import Link from "next/link";

import {
  formatDueCount,
  formatEditorialIndex,
  formatMasteryState,
  formatQuestionCount,
} from "@/lib/documents/format";
import type { DocumentTopic, MasteryState } from "@/lib/documents/types";

type TopicIndexProps = {
  canGenerate: boolean;
  documentId: string;
  generating: boolean;
  onGenerate: (topicId: string) => void;
  sort: "weakest" | "document";
  topics: DocumentTopic[];
};

export function TopicIndex({
  canGenerate,
  documentId,
  generating,
  onGenerate,
  sort,
  topics: unsorted,
}: TopicIndexProps) {
  const topics =
    sort === "weakest" ? [...unsorted].sort(compareWeakest) : unsorted;

  if (topics.length === 0) {
    return (
      <p className="text-muted-ink mt-6 max-w-[34rem] text-[16px] leading-[1.65]">
        Topics will appear here once Marginalia has read across this material.
      </p>
    );
  }

  return (
            <ol className="border-rule mt-6 divide-y divide-rule border-y">
      {topics.map((topic, index) => (
        <li key={topic.id} className="py-6">
          <div className="flex items-start gap-5">
            <span className="text-muted-ink mt-1 w-8 shrink-0 font-sans text-[12px] tracking-[0.08em]">
              {formatEditorialIndex(index)}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={`#topic-${topic.id}`}
                className="font-serif text-ink hover:text-burgundy text-[22px] leading-[1.3] font-normal transition-colors duration-200 ease-out"
              >
                {topic.name}
              </a>
              <p className="text-muted-ink mt-2 max-w-[38rem] text-[15px] leading-[1.6]">
                {topic.summary}
              </p>
              <MasteryLine state={topic.masteryState} value={topic.masteryValue} />
              <p className="text-muted-ink mt-2 text-[12px] tracking-[0.04em]">
                {[
                  formatQuestionCount(topic.questionCount),
                  formatDueCount(topic.dueCount),
                ]
                  .filter((part): part is string => part !== null)
                  .join(" · ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href={`/study?document=${documentId}&topic=${topic.id}`}
                  className="text-burgundy hover:text-burgundy-hover text-[14px] font-medium"
                >
                  Study topic
                </Link>
                {canGenerate ? (
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => onGenerate(topic.id)}
                    className="text-muted-ink hover:text-ink text-[14px] font-medium disabled:opacity-60"
                  >
                    Generate more
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function MasteryLine({
  state,
  value,
}: {
  state: MasteryState;
  value: number;
}) {
  const percent = Math.round(value * 100);
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="bg-rule h-px min-w-0 flex-1">
        <div
          className={`h-px ${masteryFillClass(state)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-muted-ink shrink-0 text-[12px] tabular-nums">
        {percent}% · {formatMasteryState(state)}
      </p>
    </div>
  );
}

function masteryFillClass(state: MasteryState): string {
  switch (state) {
    case "learning":
      return "bg-state-learning";
    case "shaky":
      return "bg-state-shaky";
    case "solid":
      return "bg-state-solid";
    case "new":
      return "bg-state-new";
  }
}

function compareWeakest(left: DocumentTopic, right: DocumentTopic): number {
  if (left.masteryValue !== right.masteryValue) {
    return left.masteryValue - right.masteryValue;
  }
  if (left.dueCount !== right.dueCount) {
    return right.dueCount - left.dueCount;
  }
  return left.name.localeCompare(right.name);
}
