# CLAUDE.md

Project context for Claude Code working in this repo.

## What blupin is

blupin is an AI-native competitive intelligence co-pilot for founders. It watches a user's competitors across Product Hunt, Hacker News, Reddit, and more; scores every launch by how directly it threatens the user's product; and surfaces a short answer to "what should I do this week?" via a chat interface. The product is for early-stage founders and small teams who can't afford a full-time market researcher but also can't afford to miss a threat that ships next week.

Taglines in use: "competitive intelligence, at your speed." Positioning notes: faster cadence than Competely/Seeto/ChampSignal (hours/days vs. 2–4 week digests), surfaces threats the user doesn't know to look for, prescribes action instead of just reporting.

## Codebase architecture vault

A live Obsidian vault at `~/Documents/blupin-vault` documents how blupin's backend sectors connect — auth, onboarding, ingest, classifier, push notifications, chat, billing, plus the database schema and route inventory.

- `_Map of Content.md` is the spine (system diagram + links to everything).
- `flows/` notes are the highest-leverage reads for cross-cutting backend questions.
- For any backend task, read the relevant flow note BEFORE grepping code — it gives the shape so you can ask narrow questions of the source.
- After making changes to a backend sector, update the corresponding vault note in the same turn. Otherwise the vault drifts and stops being trustworthy.
- Notes marked `(verify in code)` weren't fully validated at write-time — confirm with grep before relying.

## Founder context

Solo founder. v1 is being built solo on purpose — equity + traction first, cofounder search deferred until after PMF signal. Prior startup (Noted) is paused. Do not suggest "ask your team" or "loop in your cofounder" — there isn't one.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind for styling
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Vercel for hosting, Vercel Cron for scheduled jobs
- Anthropic API: Haiku for classification, Sonnet for the chat interface
- GitHub: seongleah-collab/blupin

## Project structure

```
app/
  api/
    chat/              # streaming chat with Sonnet
    classify/          # Haiku classifier for ingested events
    cron/refresh/      # daily 7am PT ingest + classify job
    ingest/            # Product Hunt, HN, Reddit source adapters
    onboarding/
      company/route.ts # POST — saves company name + description
    waitlist/route.ts  # POST — sends Supabase magic link
  auth/callback/route.ts # magic link return, exchanges code for session
  chat/                # /chat UI
  onboarding/page.tsx  # step 1 — company name + description
  components/          # SiteNav, SkyBackdrop, etc.
  login/
  signup/
  page.tsx             # landing page (hero, how it works, about, faq, waitlist)
lib/
  supabase/
    client.ts          # browser client
    server.ts          # server client (uses next/headers cookies)
```

## Database schema

`user_companies`
- `id` uuid — PK, FK to `auth.users(id)` ON DELETE CASCADE (same column serves both roles)
- `company_name` text, nullable
- `company_description` text, nullable
- `onboarded_at` timestamptz, nullable
- `created_at` timestamptz, default now()
- RLS enabled; three policies scoped to `auth.uid() = id` for SELECT/INSERT/UPDATE

`competitors` — one row per competitor tracked, FK to `user_companies`

`competitor_events` — classified events from ingest sources, with idempotent unique constraint to prevent duplicate ingestion. `event_type` has a CHECK constraint covering 7 types.

## Auth flow (working as of April 24, 2026)

Waitlist form → `POST /api/waitlist` → `supabase.auth.signInWithOtp` with `emailRedirectTo: ${origin}/auth/callback` → user clicks link in email → `GET /auth/callback?code=...` → `exchangeCodeForSession(code)` → cookies written to the NextResponse directly (not via `next/headers`, which doesn't propagate cookies on redirect in Next 15+) → redirect to `/onboarding` → onboarding page verifies session client-side → form posts to `/api/onboarding/company` → `auth.getUser()` reads session from cookies → upsert into `user_companies` with `id: user.id`.

The callback route builds its own `NextResponse` and wires cookies through it; the `@/lib/supabase/server` `createClient` used elsewhere reads cookies from `next/headers`. These are two different patterns for a reason — don't collapse them.

## What's built vs. what's next

**Built (as of 2026-05-09):**
- Landing page — live on production at `blupin.vercel.app`
- Legal pages: `/privacy`, `/terms` (linked from landing footer)
- Auth: magic-link + Google OAuth, callback route handling cookies-on-redirect quirk
- Onboarding step 1 (company name + description) and step 2 (Claude auto-suggests competitors → user confirms)
- `/chat` with Sonnet streaming, pulls `user_companies` + `competitors` + classified events as context
- Conversation history: sidebar list, single-conversation load/rename/delete
- Ingest adapters (Product Hunt, HN via Algolia API, Reddit r/SideProject + r/SaaS)
- Haiku classifier with CI-tuned prompt; classifier writes back niche_match, threat_level, relevance_score, summary, recommended_action
- Vercel Cron refresh job (daily 7am PT)
- Billing: Stripe **live mode active 2026-05-08**, three plans (starter $15 / pro $25 / scale $49 monthly), 7-day trial on every tier, checkout + customer portal + webhook (subscription.created/updated/deleted)
- Paywall enforcement at `POST /api/chat` (402) and `POST /api/onboarding/competitors` (402); `/chat` surfaces 402 as inline amber pill, NOT a redirect
- `/pricing` page with plan comparison
- Push notifications: web push (VAPID), subscribe/unsubscribe/preferences endpoints, `notifyUser` fires from inside the classifier on every `niche_match` event, gated by user's `notification_preferences` (web_push_enabled + min_severity)
- `/settings` (account, plan, push notification prefs with test-ping button)
- `/feed` events feed with regenerate action
- `/competitor/[name]` detail pages (profile, activity, events)

**Next up:**
- UI polish on landing/in-app surfaces (scoped, no new features)
- Linear setup for founder + cofounder workflow
- Backlog beyond v1 polish is open — no new ingest sources planned (X/LinkedIn/TikTok are explicitly v2)

## Communication preferences

- Casual, lowercase, direct. No corporate-speak, no hustle-culture framing.
- Prefer complete pasteable code blocks over conceptual explanations.
- One step at a time with confirmation checkpoints when debugging.
- When debugging drags past ~30 min, stop patching — ask for full file text, not screenshots.
- Commit early and often; run `git push` after every working change.

## Known gotchas

- **Screenshots have leaked the Supabase service role key multiple times.** If the user shares a screenshot of VS Code, scan for visible env vars and flag immediately. Rotate on any leak. Prefer asking for file contents as pasted text.
- **Service role key is for server-only code.** Never reference it in anything with `'use client'` or in `NEXT_PUBLIC_` env vars.
- **Next 15+ cookies on redirect:** `next/headers` cookies don't survive `NextResponse.redirect()` in route handlers. Use the pattern in `app/auth/callback/route.ts` — build the response first, pass its `.cookies` to `createServerClient`'s `setAll`.
- **RLS policies on `user_companies`** are scoped to `auth.uid() = id`. If an insert fails with "new row violates row-level security policy," the session cookie probably didn't reach the API route — check the cookie plumbing before touching the policies.
- **Two `onboarding` folders exist:** `app/onboarding/` (the page) and `app/api/onboarding/` (the API routes). Not a bug, just easy to mix up.

## Don't

- Don't suggest adding a cofounder, hiring, or "asking the team."
- Don't write corporate copy or VC-pitch language for user-facing text.
- Don't introduce new dependencies without asking — the stack is deliberately small.
- Don't assume any secret is still valid if it appeared in a screenshot in this repo's history — ask whether it's been rotated.@AGENTS.md
