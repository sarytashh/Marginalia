import Link from "next/link";

import {
  formatDueCount,
  formatEditorialIndex,
  formatMasteryState,
  formatQuestionCount,
} from "@/lib/documents/format";
import type { MasteryState } from "@/lib/scheduler";
import { buildStudyHref } from "@/lib/study/params";
import type { ProgressTopic } from "@/lib/progress/types";

type ProgressTopicListProps = {
  topics: readonly ProgressTopic[];
};

export function ProgressTopicList({ topics }: ProgressTopicListProps) {
  return (
    <ol className="border-rule divide-y divide-rule border-y">
      {topics.map((topic, index) => (
        <li key={topic.id} className="py-6">
          <div className="flex items-start gap-5">
            <span className="text-muted-ink mt-1 w-8 shrink-0 font-sans text-[12px] tracking-[0.08em]">
              {formatEditorialIndex(index)}
            </span>
            <div
              className={`min-w-0 flex-1 ${
                index < 3 ? "border-burgundy border-l pl-4" : ""
              }`}
            >
              <h3 className="font-serif text-ink text-[22px] leading-[1.3] font-normal">
                {topic.name}
              </h3>
              <p className="text-muted-ink mt-1 text-[13px]">
                {topic.documentTitle}
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
              <div className="mt-4">
                <Link
                  href={buildStudyHref({
                    documentId: topic.documentId,
                    topicId: topic.id,
                  })}
                  className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
                >
                  Study
                </Link>
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
