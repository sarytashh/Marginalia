import { handleRouteError, jsonError, jsonOk } from "@/lib/documents/http";
import { recordStubAttempt } from "@/lib/study/attempts";

export const runtime = "nodejs";

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

    const attempt = await recordStubAttempt({
      questionId: questionId.trim(),
      userAnswer,
    });
    return jsonOk(attempt, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
