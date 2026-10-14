-- Menuva database schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- A restaurant belongs to one owner (Supabase auth user).
create table if not exists public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  accent_color  text not null default '#b45309',
  source_lang   text not null default 'sl',
  languages     text[] not null default array['sl','en','de','it','hr'],
  currency      text not null default 'EUR',
  created_at    timestamptz not null default now()
);

-- Translatable fields are stored as jsonb: {"sl": "...", "en": "...", ...}
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  position       int  not null default 0,
  name           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  category_id    uuid references public.categories(id) on delete cascade,
  position       int  not null default 0,
  name           jsonb not null default '{}'::jsonb,
  description    jsonb not null default '{}'::jsonb,
  price          numeric(10,2),
  -- EU allergen numbers 1–14 (see src/lib/allergens.ts)
  allergens      int[] not null default '{}',
  -- true once the owner has confirmed the AI-suggested allergens
  allergens_confirmed boolean not null default false,
  available      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists categories_restaurant_idx on public.categories(restaurant_id, position);
create index if not exists items_restaurant_idx on public.items(restaurant_id, category_id, position);

-- Row level security ---------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.categories  enable row level security;
alter table public.items       enable row level security;

-- Anyone can read menus (the public QR page).
create policy "public read restaurants" on public.restaurants for select using (true);
create policy "public read categories"  on public.categories  for select using (true);
create policy "public read items"       on public.items       for select using (true);

-- Owners can do everything with their own data.
create policy "owner writes restaurants" on public.restaurants
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner writes categories" on public.categories
  for all using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));

create policy "owner writes items" on public.items
  for all using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));
