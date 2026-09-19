# Marginalia

An AI study tutor that turns your lecture slides into practice questions grounded in your own material, grades your written answers, and schedules what you should review next.

## Screenshots

_Coming soon._

## Live demo

_Coming soon._

## Stack

_Coming soon._

## Setup

_Coming soon._

## How it works

The Progress route is live. Upload, parsing, chunking, retrieval, topic extraction, grounded question generation, the study session, AI grading, spaced-repetition scheduling, and the progress dashboard are in place.

- **Library.** Drop a text-based PDF (20 MB max) on `/`. The file is stored in the private `documents` bucket under the owner’s user id, a `documents` row is created with status `uploaded`, and a background job extracts text **per page** with `unpdf`, then chunks and embeds it. Page numbers stay on every chunk for later citations. Scanned image PDFs are rejected. After embedding, Marginalia extracts topics and writes questions. The row is polled so the processing steps update in place instead of showing a spinner. Until auth lands, uploads belong to `DEV_USER_ID` if set, otherwise a `local-dev@marginalia.invalid` auth user created via the service-role admin API. Use a small PDF (the `fixtures/sample-lecture.pdf` fixture, a few pages) on a local embedding box — skip huge textbooks.
- **Chunking and retrieval.** Pages are split to about 800 tokens with about 100 tokens of overlap, on paragraph and sentence boundaries, using `js-tiktoken` (`cl100k_base`). Chunks are embedded with `embedTexts` and stored on `chunks.embedding`. `searchChunks` embeds a query and calls the `match_chunks` RPC. A dev-only page at `/debug/search` shows retrieved passages and scores.
- **Topics and questions.** After the search index is ready, Marginalia samples passages across the document and asks the chat model for **5–12** specific topics (name + one-sentence summary). For each topic it retrieves the nearest chunks, then asks the model to write **4–8** questions using **only those passages**, mixed short answer with some multiple choice. Duplicate or near-duplicate prompts are dropped. The system prompt forbids using general knowledge; questions that cite unknown chunks are dropped before insert. Each question stores `source_chunk_ids` and a `review_state` row due immediately. Generation runs across topics with a concurrency limit of 2. To replace an existing topic/question set without re-embedding, `POST /api/documents/[id]/generate` with `{"replace":true}`.
- **Document detail.** `/documents/[id]` is the course-reader spread: title and metadata, the processing pipeline while work is in progress, a numbered topic index, and an expandable question archive. Each question shows its type, difficulty, source page, reference answer, and a passage excerpt. Primary action starts study for that material; Generate more writes another grounded batch; **Replace topics and questions** deletes the current set and extracts again from the existing search index (no re-embed).
- **Study.** `/study` presents one due question at a time (default 10), weakest topics first, then never-seen items. `/study?document=<id>` restricts to one document; topic and question query params narrow further. Short answers use a textarea; multiple choice uses A–D rows. A source disclosure expands the cited passage without affecting grading. Keyboard: `⌘/Ctrl Enter` submits, `1–4` select options, `S` toggles the source, `Enter`/`Space` advances after feedback, `Esc` ends. Submit grades the answer in place: the question stays on screen, the verdict uses both a color and a word, and the explanation streams as the chat model writes it. Short answers are graded against the question, reference answer, and source chunks only — wording can differ; English or Chinese is fine; general knowledge is not used. Multiple choice is scored locally, then the same feedback layout explains the correct option. Attempts are stored with score and feedback. If grading fails, the typed answer stays and Retry is available — local Ollama can take a while; a hung request is retried, a silent drop is not. Nothing-due offers study ahead; the closing screen lists how many ideas held and which topics need another pass.
- **Review schedule.** Each question has a `review_state` row (ease, interval, repetitions, due time). After every attempt, a trimmed SM-2 `schedule` function in `lib/scheduler.ts` updates that row: score ≥ 0.8 grows the interval (1 day, then 3, then previous × ease, cap 180 days); 0.5–0.8 comes back in a day; below 0.5 resets to due now. Ease stays between 1.3 and 3.0, and due times get a few percent of jitter so same-interval cards do not clump. `topicMastery` is a recency-weighted average of recent scores (`new` / `learning` / `shaky` / `solid`) and drives weakest-topic ordering in study.
- **Progress.** `/progress` is an editorial report, not a dashboard of cards. Topics from every document are listed weakest first, each with its document, a mastery line, a state label (`New` / `Learning` / `Needs review` / `Solid`), question count, due count, and a Study action. A 12-week activity heatmap uses burgundy intensity plus a text summary; a restyled Recharts line shows daily average score; streak copy names the current run without treating a miss as failure. Aggregates come from the `progress_dashboard` Postgres function so the page does not load every attempt. Empty copy is the study map invitation; loading uses skeletons that match the layout.
- **Supabase.** Profiles, documents, 1024-dimension page chunks, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`, with Row Level Security and a private `documents` storage bucket. Vector search uses the `match_chunks` RPC. Progress totals use `progress_dashboard`.
- **AI providers.** Chat and embeddings are separate OpenAI-compatible clients, so a chat-only host is not asked for vectors. `embedTexts` batches 32 inputs and retries 429/5xx; `completeStructured` validates JSON with Zod and retries once on a schema miss. System prompts live in `lib/ai/prompts/`.

Environment variables (see `.env.example`; put real values only in `.env.local`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Chat: `AI_CHAT_BASE_URL`, `AI_CHAT_API_KEY`, `AI_CHAT_MODEL`
- Embeddings: `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`

This repo is currently run against local Ollama, not a cloud embedding host:

- Chat: `qwen2.5:14b` (`http://127.0.0.1:11434/v1`)
- Embeddings: `bge-m3` (`http://127.0.0.1:11434/v1`, 1024 dimensions). Install Ollama, run `ollama pull bge-m3` and `ollama pull qwen2.5:14b`, then set both `AI_*_API_KEY` values to any non-empty dummy such as `ollama`.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails.

Apply the SQL files in `supabase/migrations/` once each in the Supabase SQL Editor if you have not already, in filename order. The first creates the schema; later files add RPCs such as `progress_dashboard`.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
