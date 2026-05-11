# Review priorities for blupin

CLAUDE.md has the architecture and stack. This file is review-specific guidance for Greptile.

Stripe is in LIVE mode as of 2026-05-08 — real charges. Treat billing and auth regressions as P0.

## Scrutinize hardest

- **Supabase service role key** must only appear in server-only code. Flag P0 if it shows up in a file with `'use client'`, in a `NEXT_PUBLIC_` env var, or anywhere that could ship to the browser bundle.
- **RLS-bypassing inserts/updates** via service role on `user_companies`, `competitors`, `competitor_events` need explicit justification in the diff. Otherwise flag.
- **Stripe webhook handler** must verify signatures via `stripe.webhooks.constructEvent`. Unsigned or skipped-signature webhook handling is P0.
- **Paywall on `POST /api/chat` and `POST /api/onboarding/competitors`** must return HTTP 402, not redirect. The `/chat` UI surfaces 402 as an inline amber pill — flag any reinstated `/chat → /pricing` redirect.
- **Auth callback cookies pattern** in `app/auth/callback/route.ts`: cookies via `next/headers` don't survive `NextResponse.redirect()` in Next 15+. Flag any callback using `cookies()` from `next/headers` instead of writing cookies onto the response directly.
- **Push notification gating**: `notifyUser` must check the user's `notification_preferences` (`web_push_enabled` + `min_severity`) before sending. Flag any new push send-site that bypasses this.

## Don't flag these — they are intentional

- Lowercase, casual copy in user-facing UI (landing, onboarding, settings, chat).
- No test suite at v1. Do not suggest "add tests" as a review item.
- Long Tailwind className strings.
- Defaulting to no code comments and no JSDoc/TSDoc on internal functions.
- Two folders named `onboarding` (`app/onboarding/` page vs `app/api/onboarding/` routes) — this is intentional.

## Out of scope for v1

- X / LinkedIn / TikTok ingest sources — v2.
- Email digests — founder explicitly rejected this channel; push notifications are the alert channel. Flag any "email digest" suggestion or new email-channel code as off-roadmap.
- "Ask the team / loop in cofounder" framing in tooling decisions.

## Tone for review comments

- Direct, lowercase, no corporate-speak.
- Lead with the concrete issue, not preamble.
