-- Init Script for Supabase

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Conversations Table (optional for now, but good for history)
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Messages Table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id),
  user_id uuid references auth.users(id), -- Nullable for anon
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS Policies (Simple for now)
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

-- Allow anyone (anon) to insert messages? 
-- For a public chat without login, we need to allow anon inserts.
create policy "Allow anon insert messages"
  on public.messages for insert
  with check (true);

-- Allow users to view their own messages (if authenticated)
create policy "Allow individual view"
  on public.messages for select
  using ( auth.uid() = user_id );

-- (Optional) Index for fast querying
create index messages_user_id_idx on public.messages(user_id);
create index messages_created_at_idx on public.messages(created_at);
