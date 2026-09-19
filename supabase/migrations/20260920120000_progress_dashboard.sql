-- Apply in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- Aggregates study progress in Postgres so the Progress page does not load every attempt.

create or replace function public.progress_dashboard(
  p_user_id uuid,
  p_now timestamptz default now(),
  p_time_zone text default 'UTC'
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  local_today as (
    select (p_now at time zone p_time_zone)::date as day
  ),
  calendar_start as (
    select
      (
        (select day from local_today)
        - 83
        - (((extract(isodow from (select day from local_today) - 83)::int) + 6) % 7)
      )::date as day
  ),
  ranked_attempts as (
    select
      questions.topic_id,
      attempts.score,
      row_number() over (
        partition by questions.topic_id
        order by attempts.created_at desc
      ) as recency_rank
    from public.attempts
    inner join public.questions
      on questions.id = attempts.question_id
    inner join public.documents
      on documents.id = questions.document_id
    where attempts.user_id = p_user_id
      and documents.user_id = p_user_id
  ),
  recent_attempts as (
    select
      ranked_attempts.*,
      count(*) over (partition by ranked_attempts.topic_id) as recent_count
    from ranked_attempts
    where ranked_attempts.recency_rank <= 20
  ),
  mastery as (
    select
      topic_id,
      sum(score * (recent_count - recency_rank + 1))
        / nullif(sum(recent_count - recency_rank + 1), 0) as value
    from recent_attempts
    group by topic_id
  ),
  topic_rows as (
    select
      topics.id,
      topics.name,
      documents.id as document_id,
      documents.title as document_title,
      count(questions.id)::int as question_count,
      count(questions.id) filter (
        where review_state.id is null
          or review_state.due_at is null
          or review_state.due_at <= p_now
      )::int as due_count,
      round(coalesce(mastery.value, 0)::numeric, 4) as mastery_value,
      case
        when mastery.topic_id is null then 'new'
        when mastery.value >= 0.8 then 'solid'
        when mastery.value >= 0.5 then 'shaky'
        else 'learning'
      end as mastery_state
    from public.topics
    inner join public.documents
      on documents.id = topics.document_id
    left join public.questions
      on questions.topic_id = topics.id
    left join public.review_state
      on review_state.question_id = questions.id
      and review_state.user_id = p_user_id
    left join mastery
      on mastery.topic_id = topics.id
    where documents.user_id = p_user_id
    group by
      topics.id,
      topics.name,
      documents.id,
      documents.title,
      mastery.topic_id,
      mastery.value
    having count(questions.id) > 0
  ),
  daily as (
    select
      (attempts.created_at at time zone p_time_zone)::date as day,
      count(*)::int as attempt_count,
      avg(attempts.score)::numeric as average_score
    from public.attempts
    where attempts.user_id = p_user_id
      and (attempts.created_at at time zone p_time_zone)::date
        >= (select day from calendar_start)
    group by 1
  ),
  calendar as (
    select
      generated.day::date as day,
      coalesce(daily.attempt_count, 0) as attempt_count,
      daily.average_score
    from generate_series(
      (select day from calendar_start),
      (select day from local_today),
      interval '1 day'
    ) as generated(day)
    left join daily on daily.day = generated.day::date
  ),
  study_days as (
    select distinct (attempts.created_at at time zone p_time_zone)::date as day
    from public.attempts
    where attempts.user_id = p_user_id
  ),
  islands as (
    select
      max(island.day) as end_day,
      count(*)::int as length
    from (
      select
        study_days.day,
        study_days.day - (row_number() over (order by study_days.day))::int as grp
      from study_days
    ) island
    group by island.grp
  )
  select jsonb_build_object(
    'topics',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', topic_rows.id,
            'name', topic_rows.name,
            'documentId', topic_rows.document_id,
            'documentTitle', topic_rows.document_title,
            'questionCount', topic_rows.question_count,
            'dueCount', topic_rows.due_count,
            'masteryValue', topic_rows.mastery_value,
            'masteryState', topic_rows.mastery_state
          )
          order by
            topic_rows.mastery_value,
            topic_rows.due_count desc,
            topic_rows.name
        )
        from topic_rows
      ),
      '[]'::jsonb
    ),
    'days',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'day', calendar.day,
            'attemptCount', calendar.attempt_count,
            'averageScore', calendar.average_score
          )
          order by calendar.day
        )
        from calendar
      ),
      '[]'::jsonb
    ),
    'streak',
    jsonb_build_object(
      'current',
      coalesce(
        (
          select islands.length
          from islands
          where islands.end_day >= (select day from local_today) - 1
          order by islands.end_day desc
          limit 1
        ),
        0
      ),
      'longest',
      coalesce((select max(islands.length) from islands), 0),
      'studyDays',
      coalesce((select count(*)::int from study_days), 0)
    ),
    'attemptCount',
    (select count(*)::int from public.attempts where user_id = p_user_id),
    'hasQuestions',
    exists (
      select 1
      from public.questions
      inner join public.documents
        on documents.id = questions.document_id
      where documents.user_id = p_user_id
    )
  );
$$;

revoke all on function public.progress_dashboard(uuid, timestamptz, text) from public;
grant execute on function public.progress_dashboard(uuid, timestamptz, text)
  to authenticated, service_role;
