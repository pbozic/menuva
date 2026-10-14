-- Run this if you already ran schema.sql before the ai_usage table existed.
create table if not exists public.ai_usage (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  kind           text not null check (kind in ('import', 'retranslate')),
  created_at     timestamptz not null default now()
);
create index if not exists ai_usage_restaurant_idx on public.ai_usage(restaurant_id, kind, created_at desc);
alter table public.ai_usage enable row level security;
create policy "owner reads usage" on public.ai_usage for select
  using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));
create policy "owner logs usage" on public.ai_usage for insert
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));

-- One restaurant per account (keeps AI quotas per account).
create unique index if not exists restaurants_one_per_owner on public.restaurants(owner_id);
