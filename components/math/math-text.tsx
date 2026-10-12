import { Fragment } from "react";

import { parseMathText, type MathSegment } from "@/lib/math/format";

function renderSegments(segments: readonly MathSegment[]) {
  return segments.map((segment, index) =>
    segment.kind === "text" ? (
      <Fragment key={index}>{segment.value}</Fragment>
    ) : (
      <sup key={index} className="text-[0.7em] leading-none">
        {renderSegments(segment.segments)}
      </sup>
    ),
  );
}

/** Plain text with typed math (x^2, x^(1/2), sqrt(x)) shown as math. */
export function MathText({ text }: { text: string }) {
  return <>{renderSegments(parseMathText(text))}</>;
}
