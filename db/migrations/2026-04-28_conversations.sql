-- Conversations + messages for /chat history sidebar.
-- Run in Supabase SQL editor.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_convo_idx
  on public.conversation_messages (conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_update_own" on public.conversations;
drop policy if exists "conversations_delete_own" on public.conversations;

create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

drop policy if exists "conversation_messages_select_own" on public.conversation_messages;
drop policy if exists "conversation_messages_insert_own" on public.conversation_messages;
drop policy if exists "conversation_messages_delete_own" on public.conversation_messages;

create policy "conversation_messages_select_own" on public.conversation_messages
  for select using (auth.uid() = user_id);
create policy "conversation_messages_insert_own" on public.conversation_messages
  for insert with check (auth.uid() = user_id);
create policy "conversation_messages_delete_own" on public.conversation_messages
  for delete using (auth.uid() = user_id);
