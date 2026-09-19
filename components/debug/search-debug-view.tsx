"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { statusLabel } from "@/lib/documents/processing";
import type { LibraryDocument } from "@/lib/documents/types";

type RetrievedChunk = {
  content: string;
  id: string;
  pageNumber: number;
  similarity: number;
  tokenCount: number;
};

type SearchDebugViewProps = {
  documents: LibraryDocument[];
  initialDocumentId: string;
  loadError: string | null;
};

export function SearchDebugView({
  documents,
  initialDocumentId,
  loadError,
}: SearchDebugViewProps) {
  const indexedDocuments = documents.filter(
    (document) => document.status === "generating" || document.status === "ready",
  );
  const pendingDocuments = documents.filter(
    (document) => document.status !== "generating" && document.status !== "ready",
  );

  const [chunks, setChunks] = useState<RetrievedChunk[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const documentId = String(form.get("documentId") ?? "").trim();
    const query = String(form.get("query") ?? "").trim();

    if (documentId === "") {
      setError("Choose a document with a search index.");
      return;
    }
    if (query === "") {
      setError("Enter a search query.");
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const response = await fetch("/api/debug/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, query }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setChunks(null);
        setError(errorFromBody(body));
        return;
      }

      const nextChunks = chunksFromBody(body);
      if (nextChunks === null) {
        setChunks(null);
        setError("Marginalia could not search this document. Try again.");
        return;
      }
      setChunks(nextChunks);
    } catch {
      setChunks(null);
      setError("Marginalia could not search this document. Try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="max-w-reading">
      <p className="label-editorial">Debug</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        See what retrieval finds.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        Type a query against one document. Marginalia embeds it and returns the
        nearest chunks with similarity scores, so you can judge the index before
        questions are written.
      </p>

      {loadError ? (
        <p className="border-state-shaky text-state-shaky mt-8 border-l-2 pl-4 text-[14px] leading-[1.6]">
          {loadError}
        </p>
      ) : null}

      {documents.length === 0 && loadError === null ? (
        <div className="mt-10">
          <p className="text-ink text-[16px] leading-[1.65]">
            Add a lecture PDF in the Library, then come back once Preparing search
            index is complete.
          </p>
          <Link
            href="/"
            className="text-burgundy hover:text-burgundy-hover mt-4 inline-flex min-h-11 items-center text-[14px] font-medium"
          >
            Return to Library
          </Link>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="debug-document">Document</Label>
            <select
              id="debug-document"
              name="documentId"
              defaultValue={initialDocumentId}
              className="border-rule bg-paper text-ink focus-visible:border-burgundy h-11 w-full rounded-sm border px-3 text-[14px]"
            >
              {indexedDocuments.length === 0 ? (
                <option value="">No indexed document yet</option>
              ) : null}
              {indexedDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
              {pendingDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title} · {statusLabel(document)}
                </option>
              ))}
            </select>
            {indexedDocuments.length === 0 ? (
              <p className="text-muted-ink text-[13px] leading-[1.55]">
                Wait until the Library shows the search index as ready. Finding
                topics stays muted until the next step.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="debug-query">Query</Label>
            <Textarea
              id="debug-query"
              name="query"
              placeholder="shortest paths with non-negative weights"
              className="min-h-28 rounded-sm"
            />
          </div>

          {error ? (
            <p className="text-state-shaky text-[14px] leading-[1.6]">{error}</p>
          ) : null}

          <Button type="submit" disabled={searching} className="rounded-sm">
            {searching ? "Searching…" : "Search chunks"}
          </Button>
        </form>
      ) : null}

      {searching ? <ResultSkeletons /> : null}

      {!searching && chunks !== null && chunks.length === 0 ? (
        <p className="text-muted-ink mt-10 text-[16px] leading-[1.65]">
          No chunks matched this query. If the document is still processing, wait
          until Preparing search index is complete.
        </p>
      ) : null}

      {!searching && chunks !== null && chunks.length > 0 ? (
        <ol className="mt-12">
          {chunks.map((chunk, index) => (
            <li key={chunk.id} className="border-rule border-t py-6">
              <p className="text-muted-ink text-[12px] tracking-[0.04em] uppercase">
                {String(index + 1).padStart(2, "0")} · Page {chunk.pageNumber} ·{" "}
                {chunk.similarity.toFixed(3)} similarity · {chunk.tokenCount} tokens
              </p>
              <p className="font-serif text-ink mt-3 text-[17px] leading-[1.55]">
                {chunk.content}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ResultSkeletons() {
  return (
    <div className="mt-12" aria-hidden>
      <Skeleton className="h-3 w-40 rounded-sm" />
      <Skeleton className="mt-4 h-16 w-full rounded-sm" />
      <Skeleton className="mt-8 h-3 w-36 rounded-sm" />
      <Skeleton className="mt-4 h-16 w-full rounded-sm" />
    </div>
  );
}

function errorFromBody(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error !== ""
  ) {
    return body.error;
  }
  return "Marginalia could not search this document. Try again.";
}

function chunksFromBody(body: unknown): RetrievedChunk[] | null {
  if (typeof body !== "object" || body === null || !("chunks" in body)) {
    return null;
  }
  const { chunks } = body;
  if (!Array.isArray(chunks)) {
    return null;
  }

  const parsed: RetrievedChunk[] = [];
  for (const item of chunks) {
    const chunk = readChunk(item);
    if (chunk === null) {
      return null;
    }
    parsed.push(chunk);
  }
  return parsed;
}

function readChunk(item: unknown): RetrievedChunk | null {
  if (!isRecord(item)) {
    return null;
  }

  if (
    typeof item.id !== "string" ||
    typeof item.content !== "string" ||
    typeof item.pageNumber !== "number" ||
    typeof item.similarity !== "number" ||
    typeof item.tokenCount !== "number"
  ) {
    return null;
  }

  return {
    id: item.id,
    content: item.content,
    pageNumber: item.pageNumber,
    similarity: item.similarity,
    tokenCount: item.tokenCount,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
