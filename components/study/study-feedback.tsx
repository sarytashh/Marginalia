"use client";

import { Check, Minus, X } from "lucide-react";
import { useState } from "react";

import { formatVerdict } from "@/lib/study/format";
import type { GradeFeedback, GradeVerdict } from "@/lib/study/types";

type StudyFeedbackProps = {
  feedback: GradeFeedback;
};

export function StudyFeedback({ feedback }: StudyFeedbackProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  const colorClass = verdictColor(feedback.verdict);
  const collapseReference = feedback.verdict === "correct";

  return (
    <section className="border-rule mt-8 border-t pt-6 motion-safe:animate-in motion-safe:fade-in duration-200 ease-out">
      <h2 className="flex items-center gap-2 font-sans text-[14px] font-medium">
        <VerdictIcon className={`size-4 shrink-0 ${colorClass}`} verdict={feedback.verdict} />
        <span className={colorClass}>{formatVerdict(feedback.verdict)}</span>
        <span className="text-muted-ink font-normal tabular-nums">
          · {Math.round(feedback.score * 100)}%
        </span>
      </h2>

      <p className="text-ink mt-4 max-w-[36rem] text-[15px] leading-[1.65]">
        {feedback.explanation}
      </p>

      {feedback.whatYouGotRight.length > 0 ? (
        <FeedbackList heading="What you understood" items={feedback.whatYouGotRight} />
      ) : null}

      {feedback.whatYouMissed.length > 0 ? (
        <FeedbackList heading="What to revisit" items={feedback.whatYouMissed} />
      ) : null}

      {collapseReference ? (
        <div className="mt-6">
          <button
            type="button"
            aria-expanded={compareOpen}
            onClick={() => setCompareOpen((current) => !current)}
            className="text-burgundy hover:text-burgundy-hover min-h-11 text-[14px] font-medium"
          >
            {compareOpen ? "Hide comparison" : "Compare answers"}
          </button>
          {compareOpen ? <ReferenceAnswer text={feedback.referenceAnswer} /> : null}
        </div>
      ) : (
        <ReferenceAnswer text={feedback.referenceAnswer} />
      )}

      {feedback.sourceExcerpt ? (
        <div className="mt-6">
          <p className="label-editorial">From your material</p>
          <blockquote className="bg-paper border-burgundy text-ink mt-3 border-l-2 px-4 py-3 font-serif text-[16px] leading-[1.6]">
            <HighlightedExcerpt
              excerpt={feedback.sourceExcerpt}
              sentence={feedback.supportingSentence}
            />
          </blockquote>
        </div>
      ) : null}
    </section>
  );
}

function FeedbackList({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <div className="mt-6">
      <p className="label-editorial">{heading}</p>
      <ul className="text-ink mt-2 max-w-[36rem] list-disc space-y-1 pl-5 text-[15px] leading-[1.65]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReferenceAnswer({ text }: { text: string }) {
  if (text.trim() === "") {
    return null;
  }
  return (
    <div className="mt-6">
      <p className="label-editorial">A complete answer</p>
      <p className="font-serif text-ink mt-2 max-w-[36rem] text-[17px] leading-[1.55]">
        {text}
      </p>
    </div>
  );
}

export function HighlightedExcerpt({
  excerpt,
  sentence,
}: {
  excerpt: string;
  sentence: string | null;
}) {
  if (sentence === null || sentence === "" || !excerpt.includes(sentence)) {
    return <>{excerpt}</>;
  }
  const index = excerpt.indexOf(sentence);
  return (
    <>
      {excerpt.slice(0, index)}
      <mark className="bg-selection text-ink rounded-sm px-0.5">{sentence}</mark>
      {excerpt.slice(index + sentence.length)}
    </>
  );
}

function VerdictIcon({
  className,
  verdict,
}: {
  className: string;
  verdict: GradeVerdict;
}) {
  switch (verdict) {
    case "correct":
      return <Check className={className} aria-hidden />;
    case "partial":
      return <Minus className={className} aria-hidden />;
    case "incorrect":
      return <X className={className} aria-hidden />;
  }
}

function verdictColor(verdict: GradeVerdict): string {
  switch (verdict) {
    case "correct":
      return "text-state-solid";
    case "partial":
      return "text-state-learning";
    case "incorrect":
      return "text-state-shaky";
  }
}
