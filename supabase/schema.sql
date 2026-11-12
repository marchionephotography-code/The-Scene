-- The Scene: one row per signed-in person holding their profile, likes and
-- skips, favorites, and wish list. Run this once in Supabase → SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each person can only see and change their own row.
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "delete own profile" on public.profiles
  for delete using (auth.uid() = id);

-- "Report a problem" notes from the event screen. Anyone can file one;
-- only you (in the Supabase dashboard) can read them.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  event_id text not null,
  event_title text not null,
  event_url text,
  reason text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "anyone can file a report" on public.reports
  for insert to anon, authenticated with check (char_length(note) <= 1000);
