-- Migration: add scan_tier to scan_queue
-- Purpose: distinguishes the free 5-broker teaser scan from the
--          post-payment full scan (all US + CA brokers).
-- Conventions: lowercase snake_case identifiers; idempotent so it can
--              be re-run safely in the Supabase SQL editor.
--
-- Run this in the Supabase dashboard → SQL Editor.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'scan_queue'
      and column_name  = 'scan_tier'
  ) then
    alter table public.scan_queue
      add column scan_tier text not null default 'full';
  end if;
end $$;

-- Optional guard: only the two known tiers should ever be written.
-- Added idempotently (Postgres has no ADD CONSTRAINT IF NOT EXISTS).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'scan_queue_scan_tier_check'
      and conrelid = 'public.scan_queue'::regclass
  ) then
    alter table public.scan_queue
      add constraint scan_queue_scan_tier_check
      check (scan_tier in ('free', 'full'));
  end if;
end $$;

-- Backfill existing rows (pre-migration jobs) to 'full' so the
-- worker treats them as paid/full scans. Rows inserted by /api/audit
-- after this migration will explicitly set 'free'.
update public.scan_queue
  set scan_tier = 'full'
  where scan_tier is null;
