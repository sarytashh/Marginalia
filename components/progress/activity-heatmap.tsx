import {
  formatDayTooltip,
  formatHeatmapSummary,
  formatMonthLabel,
  heatmapLevel,
} from "@/lib/progress/format";
import type { ProgressDay } from "@/lib/progress/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type ActivityHeatmapProps = {
  days: readonly ProgressDay[];
};

export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  const maxAttempts = days.reduce(
    (max, day) => Math.max(max, day.attemptCount),
    0,
  );
  const weeks = chunkWeeks(days);

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        <div
          className="text-muted-ink mt-6 grid shrink-0 grid-rows-7 gap-1 text-[10px] leading-none tracking-[0.04em]"
          aria-hidden
        >
          {WEEKDAYS.map((label) => (
            <span key={label} className="flex h-3 items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="mb-1 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0.75rem, 1fr))` }}
            aria-hidden
          >
            {weeks.map((week, index) => (
              <span
                key={week[0]?.day ?? index}
                className="text-muted-ink truncate text-[10px] tracking-[0.04em]"
              >
                {monthLabelForWeek(weeks, index)}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col grid-rows-7 gap-1"
            role="img"
            aria-label={formatHeatmapSummary(days)}
          >
            {days.map((day) => {
              const level = heatmapLevel(day.attemptCount, maxAttempts);
              return (
                <div
                  key={day.day}
                  title={formatDayTooltip(day)}
                  aria-label={formatDayTooltip(day)}
                  className={`h-3 w-full min-w-3 rounded-[1px] ${levelClass(level)}`}
                />
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-muted-ink mt-4 max-w-[34rem] text-[13px] leading-[1.6]">
        {formatHeatmapSummary(days)}
      </p>
      <p className="text-muted-ink mt-2 text-[12px] tracking-[0.04em]">
        Empty · Light · Active · Heavy
      </p>
    </div>
  );
}

function chunkWeeks(days: readonly ProgressDay[]): ProgressDay[][] {
  const weeks: ProgressDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push([...days.slice(index, index + 7)]);
  }
  return weeks;
}

function monthLabelForWeek(
  weeks: readonly ProgressDay[][],
  index: number,
): string {
  const monday = weeks[index]?.[0];
  if (monday === undefined) {
    return "";
  }
  const previous = weeks[index - 1]?.[0];
  if (previous === undefined) {
    return formatMonthLabel(monday.day);
  }
  return formatMonthLabel(monday.day) === formatMonthLabel(previous.day)
    ? ""
    : formatMonthLabel(monday.day);
}

function levelClass(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0:
      return "bg-rule/50";
    case 1:
      return "bg-burgundy/25";
    case 2:
      return "bg-burgundy/45";
    case 3:
      return "bg-burgundy/70";
    case 4:
      return "bg-burgundy";
  }
}
