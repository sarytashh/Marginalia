-- Apply once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- The Supabase CLI is not required.

create extension if not exists vector with schema extensions;

create type public.document_status as enum (
  'uploaded',
  'parsing',
  'embedding',
  'generating',
  'ready',
  'failed'
);

create type public.question_kind as enum (
  'short_answer',
  'multiple_choice'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  filename text not null,
  storage_path text not null,
  page_count integer,
  status public.document_status not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now()
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  content text not null,
  page_number integer not null,
  token_count integer not null,
  embedding extensions.vector(1024) not null
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  name text not null,
  summary text not null
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  kind public.question_kind not null,
  prompt text not null,
  reference_answer text not null,
  options jsonb,
  source_chunk_ids uuid[] not null default '{}',
  difficulty smallint not null,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_answer text not null,
  score numeric(3, 2) not null,
  feedback text,
  created_at timestamptz not null default now()
);

create table public.review_state (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ease numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz,
  unique (question_id, user_id)
);

create index documents_user_id_idx on public.documents (user_id);
create index chunks_document_id_idx on public.chunks (document_id);
create index topics_document_id_idx on public.topics (document_id);
create index questions_document_id_idx on public.questions (document_id);
create index questions_topic_id_idx on public.questions (topic_id);
create index attempts_question_id_idx on public.attempts (question_id);
create index attempts_user_id_idx on public.attempts (user_id);
create index review_state_question_id_idx on public.review_state (question_id);
create index review_state_user_id_idx on public.review_state (user_id);
create index review_state_due_at_idx on public.review_state (due_at);

-- IVFFlat needs a lists count at index-create time; 100 is a reasonable default
-- before we have production-scale chunk counts.
create index chunks_embedding_cosine_idx
  on public.chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_chunks(
  query_embedding extensions.vector(1024),
  document_id uuid,
  match_count integer
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number integer,
  token_count integer,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.page_number,
    chunks.token_count,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from public.chunks
  where chunks.document_id = match_chunks.document_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.review_state enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (id = (select auth.uid()));

create policy documents_select_own
  on public.documents
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy documents_insert_own
  on public.documents
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy documents_update_own
  on public.documents
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy documents_delete_own
  on public.documents
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy chunks_select_own
  on public.chunks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = chunks.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy chunks_insert_own
  on public.chunks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = chunks.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy chunks_update_own
  on public.chunks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = chunks.document_id
        and documents.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = chunks.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy chunks_delete_own
  on public.chunks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = chunks.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy topics_select_own
  on public.topics
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = topics.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy topics_insert_own
  on public.topics
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = topics.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy topics_update_own
  on public.topics
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = topics.document_id
        and documents.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = topics.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy topics_delete_own
  on public.topics
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = topics.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy questions_select_own
  on public.questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = questions.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy questions_insert_own
  on public.questions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = questions.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy questions_update_own
  on public.questions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = questions.document_id
        and documents.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = questions.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy questions_delete_own
  on public.questions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = questions.document_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy attempts_select_own
  on public.attempts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy attempts_insert_own
  on public.attempts
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.questions
      join public.documents on documents.id = questions.document_id
      where questions.id = attempts.question_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy attempts_update_own
  on public.attempts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.questions
      join public.documents on documents.id = questions.document_id
      where questions.id = attempts.question_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy attempts_delete_own
  on public.attempts
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy review_state_select_own
  on public.review_state
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy review_state_insert_own
  on public.review_state
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.questions
      join public.documents on documents.id = questions.document_id
      where questions.id = review_state.question_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy review_state_update_own
  on public.review_state
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.questions
      join public.documents on documents.id = questions.document_id
      where questions.id = review_state.question_id
        and documents.user_id = (select auth.uid())
    )
  );

create policy review_state_delete_own
  on public.review_state
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on function public.match_chunks(extensions.vector, uuid, integer) from public;
grant execute on function public.match_chunks(extensions.vector, uuid, integer)
  to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.documents,
  public.chunks,
  public.topics,
  public.questions,
  public.attempts,
  public.review_state
  to authenticated, service_role;

revoke all on table
  public.profiles,
  public.documents,
  public.chunks,
  public.topics,
  public.questions,
  public.attempts,
  public.review_state
  from anon;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
