import { DocumentError, handleRouteError, jsonError } from "@/lib/documents/http";
import { gradeAndRecordAttempt } from "@/lib/study/attempts";
import { GRADE_FAILED_MESSAGE, MAX_ANSWER_CHARS } from "@/lib/study/constants";
import { encodeGradeStreamEvent } from "@/lib/study/events";
import type { GradeStreamEvent } from "@/lib/study/events";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const questionId =
      typeof body === "object" && body !== null && "questionId" in body
        ? body.questionId
        : undefined;
    const userAnswer =
      typeof body === "object" && body !== null && "userAnswer" in body
        ? body.userAnswer
        : undefined;

    if (typeof questionId !== "string" || questionId.trim() === "") {
      return jsonError("That question is not in your library.", 400);
    }
    if (typeof userAnswer !== "string") {
      return jsonError("Write a few words before checking your answer.", 400);
    }
    if (userAnswer.length > MAX_ANSWER_CHARS) {
      return jsonError(
        `Answers can be at most ${MAX_ANSWER_CHARS.toLocaleString("en-US")} characters. Shorten it and try again.`,
        400,
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: GradeStreamEvent) => {
          controller.enqueue(encoder.encode(encodeGradeStreamEvent(event)));
        };

        try {
          send({ type: "status", message: "Reading your answer…" });
          const feedback = await gradeAndRecordAttempt(
            {
              questionId: questionId.trim(),
              userAnswer,
            },
            {
              onExplanation: (text) => {
                send({ type: "explanation", text });
              },
              onStatus: (message) => {
                send({ type: "status", message });
              },
            },
          );
          send({ type: "result", feedback });
        } catch (error) {
          console.error(error);
          send({
            type: "error",
            message: streamErrorMessage(error),
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

function streamErrorMessage(error: unknown): string {
  if (error instanceof DocumentError && error.message.trim() !== "") {
    return error.message;
  }
  return GRADE_FAILED_MESSAGE;
}
