# CLAUDE.md

Project context for Claude Code working in this repo.

## What blupin is

blupin is an AI-native competitive intelligence co-pilot for founders. It watches a user's competitors across Product Hunt, Hacker News, Reddit, and more; scores every launch by how directly it threatens the user's product; and surfaces a short answer to "what should I do this week?" via a chat interface. The product is for early-stage founders and small teams who can't afford a full-time market researcher but also can't afford to miss a threat that ships next week.

Taglines in use: "competitive intelligence, at your speed." Positioning notes: faster cadence than Competely/Seeto/ChampSignal (hours/days vs. 2–4 week digests), surfaces threats the user doesn't know to look for, prescribes action instead of just reporting.

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

**Built:**
- Landing page (localhost only — production still shows Next.js boilerplate)
- Waitlist → magic link → callback → onboarding (step 1)
- `/chat` with Sonnet streaming, pulling `user_companies` + classified events as context
- Ingest adapters (Product Hunt, HN via Algolia API, Reddit r/SideProject + r/SaaS)
- Haiku classifier with tuned CI-focused prompt
- Vercel Cron refresh job (daily 7am PT)

**Next up:**
- `/onboarding/competitors` — step 2, Claude auto-suggests competitors from the user's company description, user confirms/edits
- `/onboarding` step 3 — TBD
- Push landing page to Vercel production
- Post-onboarding handoff into `/chat`

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
