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

The Library, Study, and Progress routes are still placeholders. The data layer is now in place on Supabase (Postgres + pgvector):

- Tables for profiles, documents, page chunks with 1024-dimension embeddings, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`
- Row Level Security on every table so a user only reads and writes their own rows (chunks, topics, and questions inherit ownership from the parent document)
- `match_chunks` RPC for cosine-nearest retrieval against a document
- A private `documents` storage bucket that only allows reads and writes under `{user id}/...`
- Typed browser, server, and service-role clients in `lib/supabase/`

Copy `.env.example` to `.env.local` and fill in the three Supabase values from your project settings. Apply `supabase/migrations/20260917100000_initial_schema.sql` once in the Supabase SQL Editor.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
