"use client";

import { useMemo, useState } from "react";

import { ActivityHeatmap } from "@/components/progress/activity-heatmap";
import { ScoreChart } from "@/components/progress/score-chart";
import { StudyStreak } from "@/components/progress/study-streak";
import { ProgressTopicList } from "@/components/progress/topic-list";
import {
  formatProgressHeading,
  formatProgressSummary,
  sortProgressTopics,
} from "@/lib/progress/format";
import type { ProgressDashboard, ProgressSort } from "@/lib/progress/types";

type ProgressViewProps = {
  dashboard: ProgressDashboard;
};

export function ProgressView({ dashboard }: ProgressViewProps) {
  const [sort, setSort] = useState<ProgressSort>("weakest");
  const topics = useMemo(
    () => sortProgressTopics(dashboard.topics, sort),
    [dashboard.topics, sort],
  );

  return (
    <div>
      <p className="label-editorial">Progress</p>
      <h1 className="font-serif text-ink mt-4 max-w-[40rem] text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        {formatProgressHeading(topics)}
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {formatProgressSummary(dashboard)}
      </p>
      <p className="text-muted-ink mt-3 text-[12px] tracking-[0.04em]">
        Last 12 weeks
      </p>

      <section className="mt-16" aria-labelledby="topic-mastery-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="topic-mastery-heading"
            className="font-serif text-ink text-[28px] leading-[1.2] font-normal"
          >
            Topic mastery
          </h2>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <SortButton
              active={sort === "weakest"}
              onClick={() => setSort("weakest")}
            >
              Weakest
            </SortButton>
            <SortButton active={sort === "due"} onClick={() => setSort("due")}>
              Most due
            </SortButton>
            <SortButton
              active={sort === "document"}
              onClick={() => setSort("document")}
            >
              Document
            </SortButton>
          </div>
        </div>
        <div className="mt-6">
          <ProgressTopicList topics={topics} />
        </div>
      </section>

      <section className="border-rule mt-16 border-t pt-10" aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="font-serif text-ink text-[28px] leading-[1.2] font-normal"
        >
          Study activity
        </h2>
        <p className="text-muted-ink mt-3 max-w-[34rem] text-[15px] leading-[1.65]">
          Answers by day. Darker burgundy means more attempts that day.
        </p>
        <div className="mt-6">
          <ActivityHeatmap days={dashboard.days} />
        </div>
      </section>

      <section className="border-rule mt-16 border-t pt-10" aria-labelledby="score-heading">
        <h2
          id="score-heading"
          className="font-serif text-ink text-[28px] leading-[1.2] font-normal"
        >
          Score over time
        </h2>
        <p className="text-muted-ink mt-3 max-w-[34rem] text-[15px] leading-[1.65]">
          Daily average, as a percentage.
        </p>
        <div className="mt-6">
          <ScoreChart days={dashboard.days} />
        </div>
      </section>

      <section className="border-rule mt-16 border-t pt-10" aria-labelledby="streak-heading">
        <h2 id="streak-heading" className="sr-only">
          Study streak
        </h2>
        <StudyStreak streak={dashboard.streak} />
      </section>
    </div>
  );
}

function SortButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "text-burgundy border-burgundy border-b pb-0.5 font-medium"
          : "text-muted-ink hover:text-ink border-b border-transparent pb-0.5"
      }
    >
      {children}
    </button>
  );
}
