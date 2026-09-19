"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { scoreChartPoints } from "@/lib/progress/format";
import type { ProgressDay } from "@/lib/progress/types";

type ScoreChartProps = {
  days: readonly ProgressDay[];
};

export function ScoreChart({ days }: ScoreChartProps) {
  const points = scoreChartPoints(days);

  if (points.length === 0) {
    return (
      <p className="text-muted-ink max-w-[34rem] text-[15px] leading-[1.65]">
        Average score will appear here after a few days of study.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--rule)"
            strokeWidth={1}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-ink)", fontSize: 12 }}
            axisLine={{ stroke: "var(--rule)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fill: "var(--muted-ink)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--rule)" }}
            content={ScoreTooltip}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="percent"
            name="Average score"
            stroke="var(--burgundy)"
            strokeWidth={1.5}
            dot={{ r: 3, fill: "var(--burgundy)", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "var(--burgundy)", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const point = asChartPoint(payload[0]?.payload);
  if (point === null) {
    return null;
  }
  const answers =
    point.attemptCount === 1 ? "1 answer" : `${point.attemptCount} answers`;
  return (
    <div className="border-rule bg-paper px-3 py-2 text-[12px] leading-[1.5]">
      <p className="text-ink">{point.label}</p>
      <p className="text-muted-ink">
        Average {point.percent}% · {answers}
      </p>
    </div>
  );
}

function asChartPoint(
  value: unknown,
): { attemptCount: number; label: string; percent: number } | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  if (
    !("attemptCount" in value) ||
    !("label" in value) ||
    !("percent" in value)
  ) {
    return null;
  }
  if (
    typeof value.attemptCount !== "number" ||
    typeof value.label !== "string" ||
    typeof value.percent !== "number"
  ) {
    return null;
  }
  return {
    attemptCount: value.attemptCount,
    label: value.label,
    percent: value.percent,
  };
}
