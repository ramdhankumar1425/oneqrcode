-- oneqrcode — Supabase schema (Postgres)
-- Run in the Supabase SQL editor (or `supabase db push`) on a fresh project.
--
-- Model:
--   * Supabase Auth owns auth.users. We mirror each user into public.profiles
--     (created automatically by the handle_new_user trigger).
--   * Every user-owned table has a uuid user_id → profiles(id) and RLS keyed on
--     auth.uid(). App pages use the user-scoped (anon) client, so Postgres itself
--     blocks cross-user access. The scan redirect + Razorpay webhook use the
--     service-role key, which bypasses RLS.

-- ───────────────────────────── extensions ──────────────────────────────
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ─────────────────────────────── enums ─────────────────────────────────
create type qr_type as enum ('dynamic', 'static');
create type device_type as enum ('desktop', 'mobile', 'tablet');
create type os as enum ('windows', 'macos', 'linux', 'android', 'ios', 'other');
create type browser as enum ('chrome', 'firefox', 'safari', 'edge', 'other');
create type subscription_status as enum (
  'incomplete', 'active', 'past_due', 'canceled', 'trialing', 'paused'
);
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');

-- ────────────────────────────── profiles ───────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  email         text not null,
  image         text,

  -- onboarding (collected post-signup; options validated in app code)
  heard_from    text,
  use_case      text,
  onboarding_completed_at timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, image)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── qr_code ───────────────────────────────
create table public.qr_code (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,

  title           text not null,
  short_code      text not null unique,
  destination_url text not null,
  type            qr_type not null default 'dynamic',

  is_active       boolean not null default true,
  archived_at     timestamptz,

  -- denormalized counters (bumped on the scan path)
  scan_count      bigint not null default 0,
  last_scanned_at timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index qr_code_user_id_idx on public.qr_code (user_id);
create index qr_code_short_code_idx on public.qr_code (short_code);

-- ────────────────────────────── qr_design ──────────────────────────────
create table public.qr_design (
  id               uuid primary key default gen_random_uuid(),
  qr_code_id       uuid not null unique references public.qr_code(id) on delete cascade,
  foreground_color text not null default '#0c1f15',
  background_color text not null default '#ffffff',
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ───────────────────────────── qr_redirect ─────────────────────────────
-- Append-only history: one row per destination change.
create table public.qr_redirect (
  id              uuid primary key default gen_random_uuid(),
  qr_code_id      uuid not null references public.qr_code(id) on delete cascade,
  destination_url text not null,
  created_at      timestamptz not null default now()
);
create index qr_redirect_qr_code_id_created_at_idx
  on public.qr_redirect (qr_code_id, created_at);

-- ─────────────────────────────── qr_scan ───────────────────────────────
-- High-volume, append-only analytics.
create table public.qr_scan (
  id           bigint generated always as identity primary key,
  qr_code_id   uuid not null references public.qr_code(id) on delete cascade,
  ip_hash      text not null,
  country      text,
  device_type  device_type not null default 'desktop',
  os           os not null default 'other',
  browser      browser not null default 'other',
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  created_at   timestamptz not null default now()
);
create index qr_scan_qr_code_id_created_at_idx
  on public.qr_scan (qr_code_id, created_at);

-- ───────────────────────────── subscription ────────────────────────────
-- Paid plans only — free users have no row.
create table public.subscription (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,

  plan                  text not null,               -- PlanId, validated in app code
  status                subscription_status not null,

  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  canceled_at           timestamptz,

  -- Razorpay
  rzp_subscription_id   text not null unique,
  rzp_plan_id           text not null,
  rzp_customer_id       text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index subscription_user_id_idx on public.subscription (user_id);

-- ─────────────────────────────── payment ───────────────────────────────
create table public.payment (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscription(id) on delete cascade,

  amount           integer not null,   -- minor units (paise)
  currency         text not null default 'INR',
  status           payment_status not null default 'pending',

  -- Razorpay
  rzp_payment_id   text unique,
  rzp_invoice_id   text,
  method           text,
  paid_at          timestamptz,
  failed_at        timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index payment_subscription_id_idx on public.payment (subscription_id);

-- ───────────────────────────── webhook_event ───────────────────────────
-- Raw provider webhooks — idempotency (dedupe by event_id) + audit.
create table public.webhook_event (
  id           uuid primary key default gen_random_uuid(),
  source       text not null default 'razorpay',
  event_id     text not null unique,   -- provider event id (dedupe key)
  type         text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  error        text,
  received_at  timestamptz not null default now()
);
create index webhook_event_type_idx on public.webhook_event (type);

-- ═══════════════════════════ Row Level Security ═════════════════════════
alter table public.profiles      enable row level security;
alter table public.qr_code       enable row level security;
alter table public.qr_design     enable row level security;
alter table public.qr_redirect   enable row level security;
alter table public.qr_scan       enable row level security;
alter table public.subscription  enable row level security;
alter table public.payment       enable row level security;
alter table public.webhook_event enable row level security;

-- profiles: a user sees and edits only their own row.
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- qr_code: full CRUD scoped to the owner.
create policy "qr_code: select own" on public.qr_code
  for select using (auth.uid() = user_id);
create policy "qr_code: insert own" on public.qr_code
  for insert with check (auth.uid() = user_id);
create policy "qr_code: update own" on public.qr_code
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "qr_code: delete own" on public.qr_code
  for delete using (auth.uid() = user_id);

-- Helper: does the current user own this qr_code?
create or replace function public.owns_qr_code(code_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.qr_code c
    where c.id = code_id and c.user_id = auth.uid()
  );
$$;

-- qr_design / qr_redirect / qr_scan: ownership derived from the parent code.
create policy "qr_design: rw own" on public.qr_design
  for all using (public.owns_qr_code(qr_code_id))
  with check (public.owns_qr_code(qr_code_id));

create policy "qr_redirect: rw own" on public.qr_redirect
  for all using (public.owns_qr_code(qr_code_id))
  with check (public.owns_qr_code(qr_code_id));

create policy "qr_scan: select own" on public.qr_scan
  for select using (public.owns_qr_code(qr_code_id));

-- subscription: user reads their own; writes happen via the service role (webhook/actions).
create policy "subscription: select own" on public.subscription
  for select using (auth.uid() = user_id);

-- payment: user reads payments belonging to their subscription.
create policy "payment: select own" on public.payment
  for select using (
    exists (
      select 1 from public.subscription s
      where s.id = payment.subscription_id and s.user_id = auth.uid()
    )
  );

-- webhook_event: no policies → only the service role can touch it.

-- ══════════════════════════ Analytics RPCs ═════════════════════════════
-- Run as SECURITY DEFINER but always filter by auth.uid(), so a user only ever
-- sees their own aggregates regardless of RLS on the base tables.

-- Slug availability check. short_code is globally unique, but RLS hides other
-- users' rows, so a plain select can't see a collision. This definer function
-- checks existence across all rows and returns only a boolean.
create or replace function public.short_code_taken(code text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.qr_code where short_code = code);
$$;

create or replace function public.dashboard_stats()
returns table (active_dynamic bigint, active_total bigint, total_scans bigint)
language sql
stable
security definer set search_path = public
as $$
  select
    count(*) filter (where type = 'dynamic' and archived_at is null),
    count(*) filter (where archived_at is null),
    coalesce(sum(scan_count), 0)
  from public.qr_code
  where user_id = auth.uid();
$$;

create or replace function public.analytics_totals()
returns table (active_codes bigint, total_scans bigint)
language sql
stable
security definer set search_path = public
as $$
  select
    count(*) filter (where archived_at is null),
    coalesce(sum(scan_count), 0)
  from public.qr_code
  where user_id = auth.uid();
$$;

create or replace function public.analytics_daily(since timestamptz)
returns table (day date, scans bigint)
language sql
stable
security definer set search_path = public
as $$
  select date_trunc('day', sc.created_at)::date as day, count(*)::bigint as scans
  from public.qr_scan sc
  join public.qr_code c on c.id = sc.qr_code_id
  where c.user_id = auth.uid() and sc.created_at >= since
  group by 1
  order by 1;
$$;
