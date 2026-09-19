import type { LibraryDocument } from "@/lib/documents/types";

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
    // Fall through to a generic message. The response may not be JSON.
  }

  return "Marginalia could not complete that request. Try again.";
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

export async function fetchLibraryDocuments(): Promise<LibraryDocument[]> {
  const response = await fetch("/api/documents", { cache: "no-store" });
  const body = await readJson<{ documents: LibraryDocument[] }>(response);
  return body.documents;
}

export async function renameLibraryDocument(
  documentId: string,
  title: string,
): Promise<LibraryDocument> {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const body = await readJson<{ document: LibraryDocument }>(response);
  return body.document;
}

export async function deleteLibraryDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(response);
}

export async function retryLibraryDocument(
  documentId: string,
): Promise<LibraryDocument> {
  const response = await fetch(`/api/documents/${documentId}/retry`, {
    method: "POST",
  });
  const body = await readJson<{ document: LibraryDocument }>(response);
  return body.document;
}

export function uploadLibraryDocument(input: {
  file: File;
  onProgress: (percent: number) => void;
  title: string;
}): Promise<LibraryDocument> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("title", input.title);

    xhr.open("POST", "/api/documents");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) {
        return;
      }
      input.onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = xhr.response as { document?: LibraryDocument } | null;
        if (body?.document) {
          input.onProgress(100);
          resolve(body.document);
          return;
        }
      }

      const body = xhr.response as ErrorBody | string | null;
      const message =
        typeof body === "object" && body !== null && typeof body.error === "string"
          ? body.error
          : "Marginalia could not upload this PDF. Your file is still selected.";
      reject(new Error(message));
    };

    xhr.onerror = () => {
      reject(
        new Error("Marginalia could not upload this PDF. Your file is still selected."),
      );
    };

    xhr.send(formData);
  });
}
