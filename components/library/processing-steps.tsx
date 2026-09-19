"use client";

import { Check } from "lucide-react";

import {
  getProcessingSteps,
  type PipelineStepView,
} from "@/lib/documents/processing";
import type { LibraryDocument } from "@/lib/documents/types";

export function ProcessingSteps({ document }: { document: LibraryDocument }) {
  const steps = getProcessingSteps(document);

  return (
    <ol className="mt-5 space-y-3" aria-label="Processing">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3">
          <StepMarker step={step} />
          <div className="min-w-0">
            <p className={stepLabelClass(step)}>{step.label}</p>
            {step.detail ? (
              <p className="text-muted-ink mt-1 text-[13px] leading-[1.55]">
                {step.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepMarker({ step }: { step: PipelineStepView }) {
  if (step.state === "complete") {
    return (
      <span className="text-ink mt-0.5 flex size-4 items-center justify-center">
        <Check className="size-3.5" aria-hidden />
        <span className="sr-only">Complete</span>
      </span>
    );
  }

  if (step.state === "active") {
    return (
      <span className="mt-2 flex w-4 justify-center" aria-hidden>
        <span className="bg-burgundy block h-px w-3" />
      </span>
    );
  }

  if (step.state === "failed") {
    return (
      <span className="text-state-shaky mt-0.5 text-[13px] leading-none" aria-hidden>
        !
      </span>
    );
  }

  return <span className="mt-2 flex w-4 justify-center" aria-hidden />;
}

function stepLabelClass(step: PipelineStepView): string {
  if (step.state === "active") {
    return "text-burgundy text-[14px] font-medium";
  }
  if (step.state === "failed") {
    return "text-state-shaky text-[14px] font-medium";
  }
  if (step.state === "complete") {
    return "text-ink text-[14px]";
  }
  return "text-muted-ink text-[14px]";
}
