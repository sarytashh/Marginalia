"use client";

import Link from "next/link";
import { useState } from "react";

import {
  formatDifficulty,
  formatEditorialIndex,
  formatLatestResult,
  formatQuestionKind,
  formatSourcePages,
} from "@/lib/documents/format";
import type { DocumentQuestion, DocumentTopic } from "@/lib/documents/types";

type QuestionArchiveProps = {
  documentId: string;
  topics: DocumentTopic[];
};

export function QuestionArchive({ documentId, topics }: QuestionArchiveProps) {
  const questions = topics.flatMap((topic) => topic.questions);
  if (questions.length === 0) {
    return (
      <p className="text-muted-ink mt-6 max-w-[34rem] text-[16px] leading-[1.65]">
        Questions will appear here after Marginalia writes them from the passages
        in this material.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-14">
      {topics.map((topic) =>
        topic.questions.length === 0 ? null : (
          <section key={topic.id} id={`topic-${topic.id}`} className="scroll-mt-24">
            <h3 className="font-serif text-ink text-[26px] leading-[1.25] font-normal">
              {topic.name}
            </h3>
            <ol className="border-rule mt-4 divide-y divide-rule border-y">
              {topic.questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  documentId={documentId}
                  index={index}
                  question={question}
                />
              ))}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}

function QuestionRow({
  documentId,
  index,
  question,
}: {
  documentId: string;
  index: number;
  question: DocumentQuestion;
}) {
  const [open, setOpen] = useState(false);
  const metadata = [
    formatQuestionKind(question.kind),
    formatDifficulty(question.difficulty),
    formatLatestResult(question.latestScore),
    formatSourcePages(question.sourcePages),
  ];

  return (
    <li className="py-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-5 text-left"
      >
        <span className="text-muted-ink mt-1 w-8 shrink-0 font-sans text-[12px] tracking-[0.08em]">
          {formatEditorialIndex(index)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-serif text-ink block text-[20px] leading-[1.4] font-normal">
            {question.prompt}
          </span>
          <span className="text-muted-ink mt-2 block text-[12px] tracking-[0.04em]">
            {metadata.join(" · ")}
          </span>
        </span>
      </button>

      {open ? (
        <div className="mt-5 ml-[3.25rem] max-w-[38rem] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-200 ease-out">
          <p className="label-editorial">A complete answer</p>
          <p className="font-serif text-ink mt-2 text-[17px] leading-[1.55]">
            {question.referenceAnswer}
          </p>

          {question.sourceExcerpt ? (
            <>
              <p className="label-editorial mt-6">From your material</p>
              <blockquote className="border-burgundy text-ink mt-3 border-l-2 pl-4 font-serif text-[16px] leading-[1.6]">
                {question.sourceExcerpt}
              </blockquote>
              <p className="text-muted-ink mt-2 text-[12px] tracking-[0.04em]">
                This question comes from {formatSourcePages(question.sourcePages).toLowerCase()}.
              </p>
            </>
          ) : null}

          <p className="text-muted-ink mt-5 text-[13px]">
            {question.attemptCount === 0
              ? "Not practiced yet."
              : `${question.attemptCount === 1 ? "1 attempt" : `${question.attemptCount} attempts`} · most recent ${formatLatestResult(question.latestScore).toLowerCase()}.`}
          </p>

          <Link
            href={`/study?document=${documentId}&question=${question.id}`}
            className="text-burgundy hover:text-burgundy-hover mt-4 inline-flex min-h-11 items-center text-[14px] font-medium"
          >
            Practice this question
          </Link>
        </div>
      ) : null}
    </li>
  );
}
