-- Anash Supabase schema and server-enforced access controls.
-- Run this migration in the Supabase SQL Editor or through Supabase CLI.
-- Never put a Supabase service_role key in browser code.

begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated;
-- Intentionally no client policies: only trusted SQL/service-role operations
-- may add or remove administrators.

create or replace function public.is_anash_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_anash_admin() from public, anon;
grant execute on function public.is_anash_admin() to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anash member' check (char_length(display_name) between 1 and 80),
  handle text unique check (handle is null or handle ~ '^[A-Za-z0-9_]{2,30}$'),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 300),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Profile fields are public; email and other auth data are deliberately not stored here.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Users update their own editable profile fields" on public.profiles;
create policy "Users update their own editable profile fields"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert (id, display_name, handle, avatar_url, bio) on public.profiles to authenticated;
-- Column-level grants deliberately exclude is_verified and timestamps.
grant update (display_name, handle, avatar_url, bio) on public.profiles to authenticated;

create or replace function public.create_anash_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Anash member'), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_anash_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_anash_profile on auth.users;
create trigger on_auth_user_created_anash_profile
after insert on auth.users
for each row execute function public.create_anash_profile_for_new_user();

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9_]{2,30}$'),
  category text not null check (char_length(category) between 2 and 80),
  statement text not null check (char_length(statement) between 20 and 2000),
  evidence_url text check (evidence_url is null or char_length(evidence_url) <= 2048),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 500)
);
create index if not exists verification_requests_user_id_idx on public.verification_requests(user_id);
create index if not exists verification_requests_pending_idx on public.verification_requests(submitted_at) where status = 'pending';
alter table public.verification_requests enable row level security;

drop policy if exists "Users and admins read verification requests" on public.verification_requests;
create policy "Users and admins read verification requests"
  on public.verification_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_anash_admin()));

drop policy if exists "Users submit their own pending request" on public.verification_requests;
create policy "Users submit their own pending request"
  on public.verification_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
    and review_note is null
  );

revoke all on table public.verification_requests from anon, authenticated;
grant select on table public.verification_requests to authenticated;
-- Users can submit a request but cannot set status/review fields or edit/delete it.
grant insert (user_id, handle, category, statement, evidence_url) on public.verification_requests to authenticated;

create or replace function public.review_anash_verification_request(
  p_request_id uuid,
  p_status text,
  p_review_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid;
begin
  if (select auth.uid()) is null or not public.is_anash_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'Status must be approved or rejected' using errcode = '22023';
  end if;
  if p_review_note is not null and char_length(p_review_note) > 500 then
    raise exception 'Review note must be 500 characters or fewer' using errcode = '22023';
  end if;

  update public.verification_requests
     set status = p_status,
         reviewed_at = now(),
         reviewed_by = (select auth.uid()),
         review_note = nullif(p_review_note, '')
   where id = p_request_id
     and status = 'pending'
   returning user_id into request_user_id;

  if not found then
    raise exception 'Pending request not found' using errcode = 'P0002';
  end if;

  update public.profiles
     set is_verified = (p_status = 'approved'),
         updated_at = now()
   where id = request_user_id;
end;
$$;
revoke all on function public.review_anash_verification_request(uuid, text, text) from public, anon;
grant execute on function public.review_anash_verification_request(uuid, text, text) to authenticated;

commit;
