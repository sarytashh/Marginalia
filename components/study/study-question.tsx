"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StudyFeedback } from "@/components/study/study-feedback";
import { SourceDisclosure } from "@/components/study/source-disclosure";
import { Textarea } from "@/components/ui/textarea";
import { GRADE_FAILED_MESSAGE } from "@/lib/study/constants";
import { formatVerdict } from "@/lib/study/format";
import type { GradeFeedback, StudyQuestion } from "@/lib/study/types";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type QuestionPhase = "answering" | "submitting" | "feedback";

type StudyQuestionPanelProps = {
  error: string | null;
  feedback: GradeFeedback | null;
  firstQuestion: boolean;
  liveExplanation: string;
  onSkip: () => void;
  onSubmit: (answer: string) => void;
  phase: QuestionPhase;
  question: StudyQuestion;
  savedAnswer: string;
  shortcutsPaused: boolean;
  statusMessage: string;
};

export function StudyQuestionPanel({
  error,
  feedback,
  firstQuestion,
  liveExplanation,
  onSkip,
  onSubmit,
  phase,
  question,
  savedAnswer,
  shortcutsPaused,
  statusMessage,
}: StudyQuestionPanelProps) {
  const [draft, setDraft] = useState(savedAnswer);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const locked = phase !== "answering";

  useEffect(() => {
    if (question.kind !== "short_answer" || phase !== "answering") {
      return;
    }
    if (window.matchMedia("(min-width: 768px)").matches) {
      textareaRef.current?.focus();
    }
  }, [question.id, question.kind, phase]);

  const submitCurrent = useCallback(() => {
    const answer = draft.trim();
    if (answer === "") {
      setEmptyHint(
        question.kind === "multiple_choice"
          ? "Choose an option before checking your answer."
          : "Write a few words before checking your answer.",
      );
      return;
    }
    setEmptyHint(null);
    onSubmit(answer);
  }, [draft, onSubmit, question.kind]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (shortcutsPaused || event.defaultPrevented) {
        return;
      }

      const key = event.key;
      const shortcutSubmit = (event.metaKey || event.ctrlKey) && key === "Enter";
      if (shortcutSubmit && phase === "answering") {
        event.preventDefault();
        submitCurrent();
        return;
      }

      if (phase === "feedback" && (key === "Enter" || key === " ")) {
        if (isTypingTarget(event.target) || event.target instanceof HTMLButtonElement) {
          return;
        }
        event.preventDefault();
        onSkip();
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if ((key === "s" || key === "S") && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setSourceOpen((current) => !current);
        return;
      }

      if (phase !== "answering" || question.kind !== "multiple_choice") {
        return;
      }

      const optionIndex = optionIndexFromKey(key);
      const option = question.options?.[optionIndex];
      if (option !== undefined) {
        event.preventDefault();
        setDraft(option.id);
        setEmptyHint(null);
        return;
      }

      if (key === "Enter" && draft.trim() !== "") {
        event.preventDefault();
        submitCurrent();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft, onSkip, onSubmit, phase, question, shortcutsPaused, submitCurrent]);

  const submitLabel =
    phase === "submitting"
      ? "Reading your answer…"
      : "Check answer";

  const liveMessage = liveStatus({
    emptyHint,
    error,
    feedback,
    phase,
    statusMessage,
  });

  return (
    <article className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 duration-200 ease-out">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
      <p className="label-editorial">{question.topicName}</p>
      <h1 className="font-serif text-ink mt-4 max-w-[40rem] text-[25px] leading-[1.4] font-normal text-pretty md:text-[34px] md:leading-[1.4]">
        {question.prompt}
      </h1>

      <SourceDisclosure
        documentTitle={question.documentTitle}
        excerpt={question.sourceExcerpt}
        open={sourceOpen}
        pages={question.sourcePages}
        onOpenChange={setSourceOpen}
      />

      {question.kind === "multiple_choice" &&
      question.options &&
      question.options.length > 0 ? (
        <MultipleChoice
          correctChoiceId={phase === "feedback" ? feedback?.correctChoiceId ?? null : null}
          disabled={locked}
          name={question.id}
          options={question.options}
          selectedId={draft}
          onSelect={(id) => {
            setDraft(id);
            setEmptyHint(null);
          }}
        />
      ) : (
        <div className="mt-8">
          <label htmlFor={`answer-${question.id}`} className="sr-only">
            Your answer
          </label>
          <Textarea
            ref={textareaRef}
            id={`answer-${question.id}`}
            value={draft}
            readOnly={locked}
            onChange={(event) => {
              setDraft(event.target.value);
              if (emptyHint) {
                setEmptyHint(null);
              }
            }}
            placeholder="Write what you understand in your own words…"
            className="bg-paper border-rule text-ink min-h-36 w-full rounded-sm border px-3 py-3 font-sans text-[16px] leading-[1.65] placeholder:text-muted-ink"
          />
        </div>
      )}

      {emptyHint ? (
        <p className="text-muted-ink mt-3 text-[13px]">{emptyHint}</p>
      ) : null}

      {error ? (
        <div className="border-rule mt-8 border-t pt-6">
          <p className="text-ink text-[15px] leading-[1.65]">
            {GRADE_FAILED_MESSAGE}
          </p>
          {error !== GRADE_FAILED_MESSAGE ? (
            <p className="text-muted-ink mt-2 text-[13px]">{error}</p>
          ) : null}
        </div>
      ) : null}

      {phase === "submitting" ? (
        <div className="border-rule mt-8 border-t pt-6">
          <p className="text-muted-ink text-[15px]">{statusMessage}</p>
          {liveExplanation ? (
            <p className="text-ink mt-4 max-w-[36rem] text-[15px] leading-[1.65]">
              {liveExplanation}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "feedback" && feedback !== null ? (
        <StudyFeedback feedback={feedback} />
      ) : null}

      <div className="border-rule bg-canvas/95 fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:z-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:px-0 md:pt-8 md:pb-0">
        {phase === "feedback" ? (
          <button
            type="button"
            onClick={onSkip}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Next question
          </button>
        ) : (
          <button
            type="button"
            disabled={phase === "submitting"}
            onClick={submitCurrent}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium disabled:opacity-60"
          >
            {submitLabel}
          </button>
        )}
        {error ? (
          <>
            <button
              type="button"
              onClick={submitCurrent}
              className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
            >
              Try grading again
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-ink hover:text-ink inline-flex min-h-11 items-center text-[14px] font-medium"
            >
              Skip for now
            </button>
          </>
        ) : null}
        {firstQuestion && phase === "answering" ? (
          <p className="text-muted-ink hidden text-[12px] tracking-[0.02em] md:ml-auto md:block">
            {question.kind === "multiple_choice"
              ? "⌘/Ctrl Enter checks · 1–4 select · S shows the source · Esc ends"
              : "⌘/Ctrl Enter checks · S shows the source · Esc ends"}
          </p>
        ) : null}
        {phase === "feedback" && firstQuestion ? (
          <p className="text-muted-ink hidden text-[12px] tracking-[0.02em] md:ml-auto md:block">
            Enter or Space for the next question
          </p>
        ) : null}
      </div>
    </article>
  );
}

function MultipleChoice({
  correctChoiceId,
  disabled,
  name,
  onSelect,
  options,
  selectedId,
}: {
  correctChoiceId: string | null;
  disabled: boolean;
  name: string;
  onSelect: (id: string) => void;
  options: readonly { id: string; text: string }[];
  selectedId: string;
}) {
  return (
    <fieldset className="mt-8 space-y-2" disabled={disabled}>
      <legend className="sr-only">Answer choices</legend>
      {options.map((option, index) => {
        const selected = selectedId === option.id;
        const letter = optionLetter(option.id, index);
        const isCorrect = correctChoiceId !== null && option.id === correctChoiceId;
        const showResult = correctChoiceId !== null;
        return (
          <label
            key={option.id}
            className={`flex min-h-14 cursor-pointer items-start gap-3 border px-4 py-3 duration-200 ease-out ${
              selected
                ? "border-rule bg-selection border-l-burgundy border-l-2"
                : "border-rule bg-paper hover:bg-selection/60"
            } ${disabled ? "cursor-default" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => onSelect(option.id)}
              className="sr-only"
            />
            <span
              className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                selected
                  ? "border-burgundy bg-burgundy"
                  : "border-rule bg-paper"
              }`}
              aria-hidden
            >
              {selected ? (
                <span className="bg-paper block size-1.5 rounded-sm" />
              ) : null}
            </span>
            <span
              className={`mt-0.5 w-5 shrink-0 font-sans text-[13px] font-medium ${
                selected ? "text-burgundy" : "text-muted-ink"
              }`}
            >
              {letter}
            </span>
            <span className="text-ink min-w-0 flex-1 text-[16px] leading-[1.55]">
              {option.text}
            </span>
            {showResult && isCorrect ? (
              <span className="text-state-solid mt-0.5 shrink-0 font-sans text-[12px] tracking-[0.04em]">
                Correct
              </span>
            ) : null}
            {showResult && selected && !isCorrect ? (
              <span className="text-state-shaky mt-0.5 shrink-0 font-sans text-[12px] tracking-[0.04em]">
                Your answer
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}

function optionLetter(id: string, index: number): string {
  if (id.length <= 2) {
    return id.toUpperCase();
  }
  return OPTION_LETTERS[index] ?? String(index + 1);
}

function optionIndexFromKey(key: string): number {
  if (key === "1" || key === "2" || key === "3" || key === "4") {
    return Number.parseInt(key, 10) - 1;
  }
  return -1;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function liveStatus({
  emptyHint,
  error,
  feedback,
  phase,
  statusMessage,
}: {
  emptyHint: string | null;
  error: string | null;
  feedback: GradeFeedback | null;
  phase: QuestionPhase;
  statusMessage: string;
}): string {
  if (emptyHint) {
    return emptyHint;
  }
  if (error) {
    return GRADE_FAILED_MESSAGE;
  }
  if (phase === "submitting") {
    return statusMessage;
  }
  if (phase === "feedback" && feedback !== null) {
    return `${formatVerdict(feedback.verdict)}. ${Math.round(feedback.score * 100)} percent.`;
  }
  return "";
}
