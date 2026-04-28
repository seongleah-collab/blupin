-- Add domain to competitors so logo lookup uses the AI-suggested domain
-- instead of a naive name-to-slug guess.
-- Run in Supabase SQL editor.

alter table public.competitors
  add column if not exists domain text;
