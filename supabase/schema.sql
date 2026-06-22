-- ════════════════════════════════════════════════════════════════════
--  NexusFlow — Supabase schema
--  Run in the Supabase SQL editor (Project → SQL → New query).
--  Tables: users, sessions, tool_catalog, chat_history
-- ════════════════════════════════════════════════════════════════════

-- ── Enums ────────────────────────────────────────────────────────────
do $$ begin
  create type plan_tier as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('done', 'running', 'draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- ── users ────────────────────────────────────────────────────────────
-- Mirrors auth.users; one profile row per authenticated user.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  plan plan_tier not null default 'free',
  created_at timestamptz not null default now()
);

-- ── tool_catalog ─────────────────────────────────────────────────────
create table if not exists public.tool_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  provider text,
  description text,
  icon text,
  available boolean not null default true
);

-- ── sessions ─────────────────────────────────────────────────────────
-- One row per AI task run. Surfaced in the sidebar history.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tool_category text not null,
  model text,
  prompt text,
  output text,
  status session_status not null default 'draft',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id, created_at desc);
-- Backfill for projects created before the archive feature existed.
alter table public.sessions
  add column if not exists archived boolean not null default false;

-- ── chat_history ─────────────────────────────────────────────────────
create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  role chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_history_session_idx on public.chat_history (session_id, created_at);

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.chat_history enable row level security;
alter table public.tool_catalog enable row level security;

-- users: a user can read/update only their own profile row.
drop policy if exists "users self" on public.users;
create policy "users self" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- sessions: owner-only access.
drop policy if exists "sessions owner" on public.sessions;
create policy "sessions owner" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_history: owner-only access.
drop policy if exists "chat owner" on public.chat_history;
create policy "chat owner" on public.chat_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tool_catalog: readable by any authenticated user.
drop policy if exists "catalog read" on public.tool_catalog;
create policy "catalog read" on public.tool_catalog
  for select using (auth.role() = 'authenticated');

-- ── Auto-create a profile row on signup ──────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed tool catalog (6 categories) ─────────────────────────────────
insert into public.tool_catalog (name, category, provider, description, icon) values
  ('DALL·E 3',            'image',   'OpenAI',    'Text-to-image generation', 'image'),
  ('Stable Diffusion 3',  'image',   'Stability', 'Open diffusion model',     'image'),
  ('Flux 1.1 Pro',        'image',   'BFL',       'High-fidelity image model','image'),
  ('Runway Gen-3',        'video',   'RunwayML',  'Text/image-to-video',      'video'),
  ('Kling 1.5',           'video',   'Kuaishou',  'Cinematic video model',    'video'),
  ('GPT-4o',              'code',    'OpenAI',     'Coding + reasoning',       'code'),
  ('Claude 3.5 Sonnet',   'code',    'Anthropic',  'Strong coding model',      'code'),
  ('GPT-4o Writer',       'docs',    'OpenAI',     'Long-form writing',        'file-text'),
  ('Agent Pipeline',      'agentic', 'NexusFlow',  'Multi-step autonomous run','workflow'),
  ('Claude Artifacts',    'builder', 'Anthropic',  'Prompt-to-app builder',    'layout')
on conflict do nothing;
