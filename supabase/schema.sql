-- Run this once in Supabase: SQL Editor -> New query.
create table if not exists public.studyspace_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.studyspace_cards enable row level security;

-- Allow signed-in StudySpace users to access the table. Row-level policies below
-- still restrict every request to the matching user_id.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.studyspace_cards to authenticated;

drop policy if exists "Users can read their own cards" on public.studyspace_cards;
drop policy if exists "Users can create their own cards" on public.studyspace_cards;
drop policy if exists "Users can update their own cards" on public.studyspace_cards;
drop policy if exists "Users can delete their own cards" on public.studyspace_cards;

create policy "Users can read their own cards"
on public.studyspace_cards for select using (auth.uid() = user_id);

create policy "Users can create their own cards"
on public.studyspace_cards for insert with check (auth.uid() = user_id);

create policy "Users can update their own cards"
on public.studyspace_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own cards"
on public.studyspace_cards for delete using (auth.uid() = user_id);
