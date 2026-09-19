-- Apply in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- Creates a profiles row for every new Auth user, including accounts that already exist.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.profiles (id, display_name)
select
  users.id,
  nullif(split_part(users.email, '@', 1), '')
from auth.users as users
on conflict (id) do nothing;

-- The app calls this RPC with the service role. Authenticated clients must not
-- pass another user's id to read their progress.
revoke execute on function public.progress_dashboard(uuid, timestamptz, text)
  from authenticated;
