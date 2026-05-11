# Bug-pattern specifics for blupin

Specific drift and bug shapes Greptile should flag. Concrete file paths and exact strings — not general guidance.

## Anthropic model strings

Exact model IDs currently in use. Flag any model string that does not match one of these:

- `claude-sonnet-4-6` — used only at `app/api/chat/route.ts` (the main streaming chat). Quality model, expensive. Do not swap to Haiku.
- `claude-haiku-4-5-20251001` — used at:
  - `app/api/chat/suggestions/route.ts`
  - `app/api/onboarding/competitors/suggest/route.ts`
  - `lib/classify/events.ts`
  - `lib/competitors/resync.ts`

Flag any new `model:` field with a different string (e.g. `claude-3-opus`, `claude-3-5-sonnet`, `claude-opus-4-7`) unless the diff explains why.

## Supabase service role key — allowed locations only

`SUPABASE_SERVICE_ROLE_KEY` may only appear in server-only modules. As of this writing the legitimate sites are:

- `app/api/billing/webhook/route.ts`
- `app/api/cron/refresh/route.ts`
- `lib/ingest/reddit.ts`
- `lib/ingest/hackernews.ts`
- `lib/ingest/producthunt.ts`
- `lib/classify/events.ts`
- `lib/push/notify.ts`
- `lib/maintenance/backfill_urls.ts`
- `lib/competitors/resync.ts`

If a PR adds `SUPABASE_SERVICE_ROLE_KEY` to a new file, verify the file is server-only (no `'use client'`, not in `app/components/`, not in a page component). Flag P0 if it appears in any client-bundled code or in a `NEXT_PUBLIC_*` env var.

## Cron route auth pattern

Every route under `app/api/cron/` must verify the Vercel Cron bearer token. The existing pattern at `app/api/cron/refresh/route.ts`:

```ts
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Flag any new cron route that doesn't have this check, or that uses a different secret name.

## Paywall enforcement sites

Currently three sites return HTTP 402 for unpaid users:

- `app/api/chat/route.ts` (two return paths — hard paywall + per-plan message limit)
- `app/api/onboarding/competitors/route.ts`

If a new mutating API endpoint is added that should be gated by subscription (chat-generation, competitor-suggestion, anything that costs Anthropic credits or writes paywalled data), flag the diff if it does not have a 402 return path.

The 402 response shape must remain JSON the `/chat` UI can render as the inline amber pill — do not change the response body structure without updating the consumer.

## event_type literal set

`competitor_events.event_type` has a `CHECK` constraint covering a fixed set of values (7 per CLAUDE.md). The literals currently written by ingest adapters are:

- `'product_launch'` — from `lib/ingest/producthunt.ts` and `lib/ingest/reddit.ts` (r/SideProject branch)
- `'discussion'` — from `lib/ingest/reddit.ts` (r/SaaS branch)
- Dynamic `eventType` variable — from `lib/ingest/hackernews.ts`

Flag any new `event_type:` literal that isn't already in the existing set, unless the diff also updates the `CHECK` constraint via a migration. Otherwise the insert will fail at runtime and the event will be silently dropped.

## Streaming response in /api/chat

`app/api/chat/route.ts` returns a streaming SSE response consumed by the `/chat` UI. Flag any change that:

- Returns a non-streaming `Response.json(...)` from the success path
- Changes the SSE event-name conventions without updating the client
- Removes the keep-alive or proper `Content-Type: text/event-stream` headers

## Stripe webhook handler

`app/api/billing/webhook/route.ts` must:

- Verify signature via `stripe.webhooks.constructEvent` with the raw request body (not parsed JSON)
- Handle the three events currently wired (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`) — if a new event type is handled, ensure it's wired into the user's subscription state, not just logged
- Never use the public anon key — only `SUPABASE_SERVICE_ROLE_KEY` for DB writes here

## Push notification gating

`lib/push/notify.ts` `notifyUser()` must check both:

- `notification_preferences.web_push_enabled = true`
- Event severity meets or exceeds `notification_preferences.min_severity`

Flag any new push call site that bypasses these checks or constructs the payload outside `notifyUser`.

## Competitor logo domain backfill

Older `competitors` rows have `NULL` domain and show fallback logos. Do not flag this as a bug — the backfill happens via re-suggestion. Flag if a PR removes the fallback handling in the logo component without first verifying all rows have a non-null domain.
