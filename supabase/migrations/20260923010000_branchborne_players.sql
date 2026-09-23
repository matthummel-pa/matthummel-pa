-- Branchborne Gem Quest cloud saves (applied via Supabase MCP on noxzzvbmcckzmaohyahe)
create table if not exists public.branchborne_players (
  player_id uuid primary key,
  high_score integer not null default 0,
  pathway_id text,
  trophies jsonb not null default '{}'::jsonb,
  items jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.branchborne_players enable row level security;
