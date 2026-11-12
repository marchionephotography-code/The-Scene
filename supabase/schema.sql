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
