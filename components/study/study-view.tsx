"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EndSessionDialog } from "@/components/study/end-session-dialog";
import { NothingDue } from "@/components/study/nothing-due";
import { SessionComplete } from "@/components/study/session-complete";
import { StudyMasthead } from "@/components/study/study-masthead";
import { StudyQuestionPanel } from "@/components/study/study-question";
import { submitStudyAttempt } from "@/lib/study/client";
import { GRADE_FAILED_MESSAGE, SESSION_LENGTH_STORAGE_KEY } from "@/lib/study/constants";
import { browserDraftStorage, clearDraft, pruneDrafts } from "@/lib/study/drafts";
import type {
  GradeFeedback,
  SessionTopicResult,
  StudySessionPayload,
} from "@/lib/study/types";

type StudyViewProps = {
  initial: StudySessionPayload;
};

export function StudyView({ initial }: StudyViewProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"answering" | "submitting" | "feedback">(
    "answering",
  );
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<GradeFeedback | null>(null);
  const [liveExplanation, setLiveExplanation] = useState("");
  const [statusMessage, setStatusMessage] = useState("Reading your answer…");
  const [completedCount, setCompletedCount] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [topicResults, setTopicResults] = useState<SessionTopicResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const submittingRef = useRef(false);

  const questions = initial.questions;
  const question = questions[index];
  const inSession = questions.length > 0 && !finished;

  useEffect(() => {
    if (questions.length === 0) {
      return;
    }
    try {
      window.localStorage.setItem(
        SESSION_LENGTH_STORAGE_KEY,
        String(initial.meta.scope.lengthLabel),
      );
    } catch {
      // Private browsing may block storage.
    }
  }, [initial.meta.scope.lengthLabel, questions.length]);

  useEffect(() => {
    const storage = browserDraftStorage();
    if (storage === null) {
      return;
    }
    try {
      pruneDrafts(storage);
    } catch {
      // Storage may be blocked; drafts are a convenience, not a requirement.
    }
  }, []);

  useEffect(() => {
    if (!inSession) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || endOpen) {
        return;
      }
      if (event.defaultPrevented) {
        return;
      }
      event.preventDefault();
      setEndOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [endOpen, inSession]);

  async function handleSubmit(answer: string) {
    if (question === undefined || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDrafts((current) => ({ ...current, [question.id]: answer }));
    setError(null);
    setFeedback(null);
    setLiveExplanation("");
    setStatusMessage("Reading your answer…");
    setPhase("submitting");

    try {
      const result = await submitStudyAttempt(
        {
          questionId: question.id,
          userAnswer: answer,
        },
        {
          onExplanation: setLiveExplanation,
          onStatus: setStatusMessage,
        },
      );
      const storage = browserDraftStorage();
      if (storage !== null) {
        try {
          clearDraft(storage, question.id);
        } catch {
          // Storage may be blocked; the attempt itself is already saved.
        }
      }
      setFeedback(result);
      setCompletedCount((count) => count + 1);
      setScores((current) => [...current, result.score]);
      setTopicResults((current) => [
        ...current,
        { name: question.topicName, verdict: result.verdict },
      ]);
      setPhase("feedback");
    } catch (caught) {
      submittingRef.current = false;
      setError(
        caught instanceof Error && caught.message.trim() !== ""
          ? caught.message
          : GRADE_FAILED_MESSAGE,
      );
      setPhase("answering");
    }
  }

  function goToNext() {
    submittingRef.current = false;
    setFeedback(null);
    setLiveExplanation("");
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setPhase("answering");
    setError(null);
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-app mx-auto w-full px-5 py-10 md:px-8 md:py-20 lg:px-12">
        <NothingDue meta={initial.meta} />
      </div>
    );
  }

  if (finished || question === undefined) {
    return (
      <div data-study-frame>
        <StudyMasthead
          completedCount={completedCount}
          currentIndex={Math.max(questions.length - 1, 0)}
          total={questions.length}
        />
        <div className="mx-auto w-full max-w-[45rem] px-5 py-10 md:px-8 md:py-16">
          <SessionComplete
            completedCount={completedCount}
            meta={initial.meta}
            scores={scores}
            topics={topicResults}
          />
        </div>
      </div>
    );
  }

  return (
    <div data-study-frame>
      <StudyMasthead
        completedCount={completedCount}
        currentIndex={index}
        total={questions.length}
        onEnd={() => setEndOpen(true)}
      />
      <div className="mx-auto w-full max-w-[45rem] px-5 pt-8 pb-28 md:px-8 md:pt-12 md:pb-16">
        <div className="hidden md:block">
          <p className="text-muted-ink text-[12px] tracking-[0.08em] uppercase">
            {question.documentTitle}
          </p>
        </div>
        <StudyQuestionPanel
          key={question.id}
          error={error}
          feedback={feedback}
          firstQuestion={index === 0}
          liveExplanation={liveExplanation}
          phase={phase}
          question={question}
          savedAnswer={drafts[question.id] ?? ""}
          shortcutsPaused={endOpen}
          statusMessage={statusMessage}
          onSkip={goToNext}
          onSubmit={(answer) => {
            void handleSubmit(answer);
          }}
        />
      </div>
      <EndSessionDialog
        completedCount={completedCount}
        open={endOpen}
        onOpenChange={setEndOpen}
        onConfirm={() => {
          setEndOpen(false);
          router.push("/");
        }}
      />
    </div>
  );
}
