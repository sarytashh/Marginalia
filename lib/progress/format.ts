import type {
  ProgressDashboard,
  ProgressDay,
  ProgressSort,
  ProgressTopic,
} from "@/lib/progress/types";

const SMALL_COUNTS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

const DAY_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "short",
});

export function formatProgressHeading(topics: readonly ProgressTopic[]): string {
  const weakest = topics[0];
  if (weakest === undefined) {
    return "Your first answers will become a study map.";
  }
  if (weakest.masteryState === "solid") {
    return "These ideas are holding.";
  }
  return `${weakest.name} needs another pass.`;
}

export function formatProgressSummary(
  dashboard: Pick<ProgressDashboard, "attemptCount" | "topics">,
): string {
  const dueCount = dashboard.topics.reduce(
    (sum, topic) => sum + topic.dueCount,
    0,
  );
  const topicCount = dashboard.topics.length;
  const answers =
    dashboard.attemptCount === 1
      ? "1 answer recorded."
      : `${dashboard.attemptCount} answers recorded.`;
  const topics =
    topicCount === 1
      ? "1 topic across your material."
      : `${topicCount} topics across your material.`;
  const due =
    dueCount === 0
      ? "Nothing is waiting for review."
      : dueCount === 1
        ? "1 question is due."
        : `${dueCount} questions are due.`;
  return `${answers} ${topics} ${due}`;
}

export function formatStreak(current: number): string {
  if (current <= 0) {
    return "No current streak.";
  }
  if (current === 1) {
    return "One study day so far.";
  }
  return `${capitalize(countWord(current))} study days in a row.`;
}

export function formatStreakMeta(streak: ProgressDashboard["streak"]): string {
  const longest =
    streak.longest <= 0
      ? "No longer stretch yet"
      : streak.longest === 1
        ? "Longest stretch 1 day"
        : `Longest stretch ${streak.longest} days`;
  const total =
    streak.studyDays === 1
      ? "1 study day in total"
      : `${streak.studyDays} study days in total`;
  return `${longest} · ${total}`;
}

export function formatHeatmapSummary(days: readonly ProgressDay[]): string {
  const active = days.filter((day) => day.attemptCount > 0);
  if (active.length === 0) {
    return "No study days in the last 12 weeks.";
  }
  const latest = active[active.length - 1];
  const latestLabel =
    latest === undefined ? "" : ` Most recently ${formatDayLabel(latest.day)}.`;
  if (active.length === 1) {
    return `You answered on 1 day in the last 12 weeks.${latestLabel}`;
  }
  return `You answered on ${active.length} days in the last 12 weeks.${latestLabel}`;
}

export function formatDayLabel(isoDay: string): string {
  return DAY_FORMATTER.format(parseIsoDay(isoDay));
}

export function formatMonthLabel(isoDay: string): string {
  return MONTH_FORMATTER.format(parseIsoDay(isoDay));
}

export function formatDayTooltip(day: ProgressDay): string {
  const date = formatDayLabel(day.day);
  if (day.attemptCount <= 0) {
    return `${date}: no answers`;
  }
  const answers =
    day.attemptCount === 1 ? "1 answer" : `${day.attemptCount} answers`;
  if (day.averageScore === null) {
    return `${date}: ${answers}`;
  }
  return `${date}: ${answers}, average ${Math.round(day.averageScore * 100)}%`;
}

export function heatmapLevel(
  attemptCount: number,
  maxAttempts: number,
): 0 | 1 | 2 | 3 | 4 {
  if (attemptCount <= 0 || maxAttempts <= 0) {
    return 0;
  }
  const ratio = attemptCount / maxAttempts;
  if (ratio <= 0.25) {
    return 1;
  }
  if (ratio <= 0.5) {
    return 2;
  }
  if (ratio <= 0.75) {
    return 3;
  }
  return 4;
}

export function sortProgressTopics(
  topics: readonly ProgressTopic[],
  sort: ProgressSort,
): ProgressTopic[] {
  const copy = [...topics];
  copy.sort((left, right) => {
    if (sort === "due") {
      if (left.dueCount !== right.dueCount) {
        return right.dueCount - left.dueCount;
      }
      return left.masteryValue - right.masteryValue;
    }
    if (sort === "document") {
      const document = left.documentTitle.localeCompare(right.documentTitle);
      if (document !== 0) {
        return document;
      }
      return left.name.localeCompare(right.name);
    }
    if (left.masteryValue !== right.masteryValue) {
      return left.masteryValue - right.masteryValue;
    }
    if (left.dueCount !== right.dueCount) {
      return right.dueCount - left.dueCount;
    }
    return left.name.localeCompare(right.name);
  });
  return copy;
}

export function scoreChartPoints(
  days: readonly ProgressDay[],
): { day: string; label: string; percent: number; attemptCount: number }[] {
  return days.flatMap((day) => {
    if (day.attemptCount <= 0 || day.averageScore === null) {
      return [];
    }
    return [
      {
        attemptCount: day.attemptCount,
        day: day.day,
        label: formatDayLabel(day.day),
        percent: Math.round(day.averageScore * 100),
      },
    ];
  });
}

function parseIsoDay(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map((part) => Number(part));
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function countWord(count: number): string {
  if (count >= 0 && count < SMALL_COUNTS.length) {
    return SMALL_COUNTS[count] ?? String(count);
  }
  return String(count);
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}
