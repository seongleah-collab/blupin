-- Phase 1 of the "feed as funnel" rework. Add the per-source engagement
-- numbers (upvotes/points/comments) and the external article URL when
-- a post links out (HN/Reddit pointing at a third-party article) so the
-- feed UI can render a rich source pill without re-fetching origins.
--
-- Run in Supabase SQL editor.

alter table public.competitor_events
  add column if not exists source_score integer,
  add column if not exists source_comment_count integer,
  add column if not exists source_external_url text;

-- Phase 2: link unfurls. We fetch OG metadata once (lazily, on first
-- view) and cache it on the row so subsequent reads are instant and we
-- don't hammer origin servers. og_fetched_at lets us decide when to
-- refresh stale unfurls (>30 days).
alter table public.competitor_events
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image_url text,
  add column if not exists og_site_name text,
  add column if not exists og_fetched_at timestamptz;
