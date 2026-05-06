-- Stripe subscriptions for blupin paid plans.
-- One row per user. Plan + status drive everything downstream.
-- Run in Supabase SQL editor.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'scale')),
  status text not null check (status in (
    'trialing', 'active', 'past_due', 'canceled',
    'incomplete', 'incomplete_expired', 'unpaid', 'paused'
  )),
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
-- INSERT/UPDATE intentionally NOT exposed via RLS — only the webhook
-- (running with service_role) writes here. Users can only read their own row.
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
