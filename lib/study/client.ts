import { GRADE_FAILED_MESSAGE } from "@/lib/study/constants";
import { parseGradeStreamEvent } from "@/lib/study/events";
import type { GradeFeedback } from "@/lib/study/types";

type ErrorBody = {
  error?: unknown;
};

type SubmitHandlers = {
  onExplanation?: (text: string) => void;
  onStatus?: (message: string) => void;
};

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    if (typeof body.error === "string" && body.error !== "") {
      return body.error;
    }
  } catch {
    // The response may not be JSON.
  }

  return GRADE_FAILED_MESSAGE;
}

export async function submitStudyAttempt(
  input: {
    questionId: string;
    userAnswer: string;
  },
  handlers: SubmitHandlers = {},
): Promise<GradeFeedback> {
  const response = await fetch("/api/study/attempts", {
    method: "POST",
    headers: {
      Accept: "application/x-ndjson",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.body === null) {
    throw new Error(GRADE_FAILED_MESSAGE);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const state: { error: string | null; feedback: GradeFeedback | null } = {
    error: null,
    feedback: null,
  };

  const consumeLine = (line: string) => {
    const event = parseGradeStreamEvent(line);
    if (event === null) {
      return;
    }
    if (event.type === "status") {
      handlers.onStatus?.(event.message);
      return;
    }
    if (event.type === "explanation") {
      handlers.onExplanation?.(event.text);
      return;
    }
    if (event.type === "error") {
      state.error = event.message;
      return;
    }
    state.feedback = event.feedback;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      consumeLine(line);
    }
  }

  if (buffer.trim() !== "") {
    consumeLine(buffer);
  }

  if (state.error !== null) {
    throw new Error(state.error);
  }
  if (state.feedback === null) {
    throw new Error(GRADE_FAILED_MESSAGE);
  }
  return state.feedback;
}
