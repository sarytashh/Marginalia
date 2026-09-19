import type { RecordedAttempt } from "@/lib/study/types";

type ErrorBody = {
  error?: unknown;
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

  return "Marginalia could not grade this answer right now. Your response is safe.";
}

export async function submitStudyAttempt(input: {
  questionId: string;
  userAnswer: string;
}): Promise<RecordedAttempt> {
  const response = await fetch("/api/study/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as RecordedAttempt;
}
