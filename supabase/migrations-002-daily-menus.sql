-- Daily malica publisher + billing. Run after schema.sql (and migrations-001 if you used it).

-- Restaurant details shown on the daily cards, and billing state.
alter table public.restaurants
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists malica_hours text default '11:00–15:00',
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'trialing';

-- One daily menu per restaurant per day. Translatable fields are jsonb {"sl": "...", "en": "..."}.
create table if not exists public.daily_menus (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  menu_date      date not null,
  -- [{ "name": {...}, "description": {...}, "price": 9.5 | null, "allergens": [1,3] }]
  items          jsonb not null default '[]'::jsonb,
  -- Price of the whole set (e.g. soup + main + salad), if the restaurant sells it as a set
  set_price      numeric(10,2),
  note           jsonb not null default '{}'::jsonb,
  published      boolean not null default false,
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, menu_date)
);
create index if not exists daily_menus_lookup_idx on public.daily_menus(restaurant_id, menu_date desc);

alter table public.daily_menus enable row level security;

-- The public page, widget and image cards read published menus only.
create policy "public read published daily menus" on public.daily_menus
  for select using (published or exists (
    select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));

create policy "owner writes daily menus" on public.daily_menus
  for all using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));

-- New AI usage kind for daily menu extraction.
alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('import', 'retranslate', 'daily'));

-- Billing columns must only be changed by the Stripe webhook (service role), never by the owner.
create or replace function public.protect_billing_columns() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.trial_ends_at := old.trial_ends_at;
    new.stripe_customer_id := old.stripe_customer_id;
    new.subscription_status := old.subscription_status;
  end if;
  return new;
end $$;

drop trigger if exists restaurants_protect_billing on public.restaurants;
create trigger restaurants_protect_billing before update on public.restaurants
  for each row execute function public.protect_billing_columns();

-- And on insert, owners always start with a fresh trial.
create or replace function public.reset_billing_on_insert() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.trial_ends_at := now() + interval '14 days';
    new.stripe_customer_id := null;
    new.subscription_status := 'trialing';
  end if;
  return new;
end $$;

drop trigger if exists restaurants_reset_billing on public.restaurants;
create trigger restaurants_reset_billing before insert on public.restaurants
  for each row execute function public.reset_billing_on_insert();
