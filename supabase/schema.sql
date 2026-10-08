-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- One row per printed artwork
create table if not exists public.families (
  id            uuid primary key,
  family_name   text,
  title         text not null,
  design        text not null,         -- falcon | map | palm | tree
  palette       text not null,         -- abudhabi | sharjah | dubai | heritage
  members       jsonb not null,        -- [{ name, color, image_path, strokes }]
  artwork_path  text not null,         -- path in the "artworks" bucket
  created_at    timestamptz not null default now()
);

-- The kiosk uses the public anon key, so it may only add rows, never read them.
-- View the data in the dashboard (Table Editor / Storage), which bypasses RLS.
alter table public.families enable row level security;

drop policy if exists "kiosk can insert" on public.families;
create policy "kiosk can insert" on public.families
  for insert to anon with check (true);

-- Private bucket for the artwork and signature PNGs
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', false)
on conflict (id) do nothing;

drop policy if exists "kiosk can upload artworks" on storage.objects;
create policy "kiosk can upload artworks" on storage.objects
  for insert to anon with check (bucket_id = 'artworks');
