-- Init Script for Supabase

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Conversations Table
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id text, -- Changed from UUID to TEXT to support 'anonymous_user'
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Messages Table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id text, -- Changed from UUID to TEXT
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS Policies (Modified for Anonymous Access)
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

-- Policy: Allow Anon to Insert (Needed for creation)
create policy "Allow anon insert conversations"
  on public.conversations for insert
  with check (true);

create policy "Allow anon insert messages"
  on public.messages for insert
  with check (true);

-- Policy: Allow Anon to Select 'anonymous_user' data
create policy "Allow view anonymous conversations"
  on public.conversations for select
  using (user_id = 'anonymous_user');

create policy "Allow view anonymous messages"
  on public.messages for select
  using (user_id = 'anonymous_user');

-- Policy: Allow Authenticated Users to view their own
create policy "Allow auth view own conversations"
  on public.conversations for select
  using (auth.uid()::text = user_id);

create policy "Allow auth view own messages"
  on public.messages for select
  using (auth.uid()::text = user_id);

-- (Optional) Index
create index messages_user_id_idx on public.messages(user_id);
create index messages_created_at_idx on public.messages(created_at);
