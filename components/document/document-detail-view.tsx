"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { DeleteMaterialDialog } from "@/components/document/delete-material-dialog";
import { QuestionArchive } from "@/components/document/question-archive";
import { TopicIndex } from "@/components/document/topic-index";
import { ProcessingSteps } from "@/components/library/processing-steps";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  deleteLibraryDocument,
  fetchDocumentDetail,
  generateMoreQuestions,
  renameLibraryDocument,
  replaceStudyMaterial,
  retryLibraryDocument,
} from "@/lib/documents/client";
import {
  formatQuestionCount,
  formatTopicCount,
} from "@/lib/documents/format";
import { isDocumentProcessing, statusLabel } from "@/lib/documents/processing";
import { formatPageCount, formatUploadedOn } from "@/lib/pdf/format";
import { titleFromFilename } from "@/lib/pdf/title";
import type { DocumentDetail } from "@/lib/documents/types";

type DocumentDetailViewProps = {
  initialDetail: DocumentDetail;
};

export function DocumentDetailView({ initialDetail }: DocumentDetailViewProps) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [sort, setSort] = useState<"weakest" | "document">("weakest");
  const [editingTitle, setEditingTitle] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { document, topics } = detail;
  const processing = isDocumentProcessing(document);
  const dueCount = topics.reduce((sum, topic) => sum + topic.dueCount, 0);
  const questionCount = topics.reduce((sum, topic) => sum + topic.questionCount, 0);
  const canStudy = document.status === "ready" && questionCount > 0;
  const writing = generating || replacing || document.status === "generating";
  const canGenerate = document.status === "ready" && !writing;
  const canReplace =
    (document.status === "ready" || document.status === "failed") &&
    document.chunkCount > 0 &&
    !writing;

  useEffect(() => {
    if (!processing) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchDocumentDetail(document.id)
        .then((next) => {
          setDetail(next);
        })
        .catch((error: unknown) => {
          console.error(error);
        });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [document.id, processing]);

  async function handleGenerate(topicId?: string) {
    setActionError(null);
    setGenerating(true);
    try {
      const updated = await generateMoreQuestions(document.id, topicId);
      const next = await fetchDocumentDetail(document.id);
      setDetail({
        ...next,
        document: { ...next.document, ...updated },
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Marginalia could not write more questions.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleReplace() {
    setActionError(null);
    setReplacing(true);
    try {
      const updated = await replaceStudyMaterial(document.id);
      const next = await fetchDocumentDetail(document.id);
      setDetail({
        ...next,
        document: { ...next.document, ...updated },
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Marginalia could not replace topics and questions.",
      );
    } finally {
      setReplacing(false);
    }
  }

  const filenameDiffers =
    titleFromFilename(document.filename).toLowerCase() !== document.title.toLowerCase();
  const metadata = [
    filenameDiffers ? document.filename : null,
    formatPageCount(document.pageCount),
    `Uploaded ${formatUploadedOn(document.createdAt)}`,
    statusLabel(document),
    document.topicCount > 0 ? formatTopicCount(document.topicCount) : null,
    document.questionCount > 0 ? formatQuestionCount(document.questionCount) : null,
  ].filter((part): part is string => part !== null);

  const studyLabel =
    canStudy && dueCount > 0
      ? `Study ${dueCount} due question${dueCount === 1 ? "" : "s"}`
      : "Study this material";

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-muted-ink hover:text-ink text-[13px] transition-colors duration-200 ease-out"
        >
          Library
        </Link>
      </nav>

      <p className="label-editorial mt-8">Material</p>

      {editingTitle ? (
        <TitleEditor
          documentId={document.id}
          title={document.title}
          onCancel={() => setEditingTitle(false)}
          onSaved={(title) => {
            setDetail((current) => ({
              ...current,
              document: { ...current.document, title },
            }));
            setEditingTitle(false);
            toast("The title is updated.");
          }}
        />
      ) : (
        <h1 className="font-serif text-ink mt-4 max-w-reading text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
          {document.title}
        </h1>
      )}

      <p className="text-muted-ink mt-4 text-[12px] tracking-[0.04em]">
        {metadata.join(" · ")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {canStudy ? (
          <Link
            href={`/study?document=${document.id}`}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
          >
            {studyLabel}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="bg-burgundy text-paper inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium opacity-60"
          >
            Study this material
          </button>
        )}
        <button
          type="button"
          disabled={!canGenerate}
          onClick={() => void handleGenerate()}
          className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium disabled:text-muted-ink disabled:opacity-60"
        >
          {generating ? "Writing questions…" : "Generate more questions"}
        </button>
        <button
          type="button"
          disabled={!canReplace}
          onClick={() => void handleReplace()}
          className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium disabled:text-muted-ink disabled:opacity-60"
        >
          {replacing ? "Replacing topics…" : "Replace topics and questions"}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${document.title}`}
            className="text-muted-ink hover:text-ink inline-flex size-11 items-center justify-center rounded-sm sm:ml-auto"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={() => setEditingTitle(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {actionError ? (
        <p className="text-state-shaky mt-5 text-[13px]">{actionError}</p>
      ) : null}

      {document.status !== "ready" ? (
        <div className="mt-10">
          <ProcessingSteps document={document} />
          {document.status === "failed" ? (
            <div className="mt-5 flex flex-col items-start gap-3">
              <button
                type="button"
                disabled={retrying}
                onClick={async () => {
                  setActionError(null);
                  setRetrying(true);
                  try {
                    await retryLibraryDocument(document.id);
                    const next = await fetchDocumentDetail(document.id);
                    setDetail(next);
                  } catch (error) {
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Marginalia could not retry this step.",
                    );
                  } finally {
                    setRetrying(false);
                  }
                }}
                className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out disabled:opacity-60"
              >
                {retrying ? "Trying this step again…" : "Try this step again"}
              </button>
              <p className="text-muted-ink text-[13px]">
                Completed work is kept. You can also delete this material.
              </p>
            </div>
          ) : processing ? (
            <p className="text-muted-ink mt-5 text-[13px]">
              You can leave this page. Processing continues in the background.
            </p>
          ) : null}
        </div>
      ) : null}

      {topics.length > 0 ? (
        <>
          <section className="mt-16" aria-labelledby="topic-index-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="topic-index-heading"
                className="font-serif text-ink text-[28px] leading-[1.2] font-normal"
              >
                Topics
              </h2>
              <div className="flex gap-4 text-[13px]">
                <SortButton
                  active={sort === "weakest"}
                  onClick={() => setSort("weakest")}
                >
                  Weakest first
                </SortButton>
                <SortButton
                  active={sort === "document"}
                  onClick={() => setSort("document")}
                >
                  Document order
                </SortButton>
              </div>
            </div>
            <TopicIndex
              canGenerate={canGenerate}
              documentId={document.id}
              generating={writing}
              onGenerate={(topicId) => void handleGenerate(topicId)}
              sort={sort}
              topics={topics}
            />
          </section>

          <section className="mt-16" aria-labelledby="question-archive-heading">
            <h2
              id="question-archive-heading"
              className="font-serif text-ink text-[28px] leading-[1.2] font-normal"
            >
              Questions
            </h2>
            <QuestionArchive documentId={document.id} topics={topics} />
          </section>
        </>
      ) : document.status === "ready" ? (
        <div className="mt-16 max-w-[34rem]">
          <p className="text-muted-ink text-[16px] leading-[1.65]">
            Marginalia finished reading this file but did not keep any topics.
            Replace the set from the existing search index, or add a different PDF.
          </p>
          {canReplace ? (
            <button
              type="button"
              disabled={writing}
              onClick={() => void handleReplace()}
              className="bg-burgundy text-paper hover:bg-burgundy-hover mt-6 inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium disabled:opacity-60"
            >
              {replacing ? "Replacing topics…" : "Replace topics and questions"}
            </button>
          ) : null}
        </div>
      ) : null}

      <DeleteMaterialDialog
        document={document}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={async (current) => {
          await deleteLibraryDocument(current.id);
          toast(`${current.title} was deleted.`);
          router.push("/");
        }}
      />
    </div>
  );
}

function SortButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "text-burgundy border-burgundy border-b pb-0.5 font-medium"
          : "text-muted-ink hover:text-ink border-b border-transparent pb-0.5"
      }
    >
      {children}
    </button>
  );
}

function TitleEditor({
  documentId,
  onCancel,
  onSaved,
  title,
}: {
  documentId: string;
  onCancel: () => void;
  onSaved: (title: string) => void;
  title: string;
}) {
  const inputId = useId();
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const nextTitle = value.trim();
    if (nextTitle === "") {
      setError("Give this material a title.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await renameLibraryDocument(documentId, nextTitle);
      onSaved(updated.title);
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "Marginalia could not rename this material.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-reading">
      <label htmlFor={inputId} className="sr-only">
        Title
      </label>
      <Input
        id={inputId}
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        className="font-serif text-ink h-auto rounded-sm border-rule px-2 py-2 text-[34px] leading-[1.12] md:text-[52px]"
      />
      {error ? <p className="text-state-shaky mt-2 text-[13px]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="rounded-sm">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
