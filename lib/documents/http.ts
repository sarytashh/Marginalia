export class DocumentError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "DocumentError";
    this.status = status;
  }
}

export function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof DocumentError) {
    return jsonError(error.message, error.status);
  }

  console.error(error);
  return jsonError("Marginalia could not complete that request. Try again.", 500);
}
