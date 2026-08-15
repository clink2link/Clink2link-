
-- ============================================================
-- CLICK2PAY FINAL SCHEMA
-- Generated to match the uploaded Click2Pay source code.
-- Supabase PostgreSQL
-- Database is expected to be empty.
-- ============================================================

create extension if not exists pgcrypto;

-- =========================
-- USERS
-- =========================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  full_name text,
  photo_url text,
  balance numeric(18,2) not null default 0,
  total_ads numeric(18,2) not null default 0,
  total_sell numeric(18,2) not null default 0,
  total_views bigint not null default 0,
  total_clicks bigint not null default 0,
  sell_unlocked boolean not null default false,
  sell_link_enabled boolean not null default false,
  withdraw_count integer not null default 0,
  withdraw_total numeric(18,2) not null default 0,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  email_verified boolean not null default false,
  ref_code text unique,
  sell_earning_total numeric(18,2) not null default 0,
  sell_earning_month numeric(18,2) not null default 0,
  sell_earning_today numeric(18,2) not null default 0,
  ads_earning_total numeric(18,2) not null default 0,
  ads_earning_month numeric(18,2) not null default 0,
  ads_earning_today numeric(18,2) not null default 0,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility table used by payment/backend code.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text default '',
  photo_url text default '',
  balance numeric(18,2) not null default 0,
  ads_earning_today numeric(18,2) not null default 0,
  ads_earning_month numeric(18,2) not null default 0,
  ads_earning_total numeric(18,2) not null default 0,
  sell_earning_today numeric(18,2) not null default 0,
  sell_earning_month numeric(18,2) not null default 0,
  sell_earning_total numeric(18,2) not null default 0,
  total_views bigint not null default 0,
  total_clicks bigint not null default 0,
  withdraw_count integer not null default 0,
  sell_link_enabled boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- LINKS
-- =========================
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'ads' check (type in ('ads','sell')),
  link_type text not null default 'ads' check (link_type in ('ads','sell')),
  title text not null default '',
  alias text,
  custom_alias text,
  short_code text not null unique,
  destination text,
  destination_url text not null,
  campaign text,
  campaign_name text,
  device text default 'all',
  target_device text default 'all',
  expired_at timestamptz,
  expired text,
  price numeric(18,2) not null default 0,
  status text not null default 'active',
  views bigint not null default 0,
  clicks bigint not null default 0,
  earnings numeric(18,2) not null default 0,
  total_views bigint not null default 0,
  total_clicks bigint not null default 0,
  total_earnings numeric(18,2) not null default 0,
  sold bigint not null default 0,
  sales bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- LINK TRACKING
-- =========================
create table public.link_views (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  visitor_ip text,
  country text,
  device text,
  browser text,
  referer text,
  is_valid boolean not null default true,
  earning numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.link_access (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  payment_id uuid,
  buyer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(link_id,buyer_id)
);

-- =========================
-- SELL ORDERS / PAYMENTS
-- =========================
create table public.sell_orders (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete restrict,
  buyer_id uuid references auth.users(id) on delete set null,
  seller_id uuid not null references auth.users(id) on delete restrict,
  price numeric(18,2) not null,
  status text not null default 'pending',
  payment_id text,
  invoice_id text unique,
  payment_url text,
  qris_string text,
  qr_url text,
  qris_image_url text,
  dompetx_payment_id text,
  payment_status text,
  expires_at timestamptz,
  paid_at timestamptz,
  fee numeric(18,2) not null default 0,
  seller_receive numeric(18,2) not null default 0,
  balance_processed boolean not null default false,
  balance_credited boolean not null default false,
  quantity integer not null default 1,
  views bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.link_payments (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  invoice_id text not null unique,
  amount numeric(18,2) not null,
  qr_url text,
  status text not null default 'pending',
  expired_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================
-- WALLET / WITHDRAW
-- =========================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  amount numeric(18,2) not null default 0,
  description text,
  title text not null default '',
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(18,2) not null default 0,
  title text,
  description text,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create table public.withdraws (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null,
  account_number text not null,
  amount numeric(18,2) not null,
  status text not null default 'pending',
  type text not null default 'withdraw',
  fee numeric(18,2) not null default 0,
  account_name text,
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18,2) not null,
  method text not null,
  account_name text,
  account_number text not null,
  fee numeric(18,2) not null default 0,
  type text not null default 'withdraw',
  receive numeric(18,2),
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text,
  bank_name text,
  account_name text,
  account_number text,
  created_at timestamptz not null default now()
);

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_name text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- =========================
-- USER FEATURES
-- =========================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete set null,
  referred_email text,
  bonus numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.login_activity (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text,
  ip text,
  device text,
  browser text,
  user_agent text,
  region text,
  city text,
  country text,
  org text,
  latitude text,
  longitude text,
  created_at timestamptz default now()
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  ads_views bigint not null default 0,
  ads_clicks bigint not null default 0,
  ads_earnings numeric(18,2) not null default 0,
  sell_views bigint not null default 0,
  sell_clicks bigint not null default 0,
  sell_earnings numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id,report_date)
);

-- =========================
-- ADMIN / SETTINGS
-- =========================
create table public.admins (
  id bigint generated by default as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.menus (
  id bigint generated by default as identity primary key,
  name text,
  icon text,
  link text,
  role text,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value text,
  maintenance boolean not null default false,
  ads_cpm numeric(18,4) not null default 5000,
  sell_cpm numeric(18,4) not null default 10000,
  minimum_withdraw numeric(18,2) not null default 10000,
  updated_at timestamptz not null default now()
);

-- =========================
-- CPM
-- =========================
create table public.cpm_rates (
  id bigint generated by default as identity primary key,
  country text not null unique,
  cpm numeric(18,4) not null default 0,
  history jsonb not null default '[]'::jsonb,
  change numeric(18,4) not null default 0,
  trend numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table public.cpm_market (
  id bigint generated by default as identity primary key,
  country text not null unique,
  flag text,
  cpm numeric(18,4) not null default 0,
  change numeric(18,4) not null default 0,
  trend integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cpm_settings (
  id bigint generated by default as identity primary key,
  country text not null unique,
  ads_cpm numeric(18,4) not null default 0,
  sell_cpm numeric(18,4) not null default 0,
  updated_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index links_user_id_idx on public.links(user_id);
create index links_short_code_idx on public.links(short_code);
create index links_status_idx on public.links(status);
create index link_views_link_idx on public.link_views(link_id);
create index link_access_link_idx on public.link_access(link_id);
create index sell_orders_seller_idx on public.sell_orders(seller_id);
create index sell_orders_buyer_idx on public.sell_orders(buyer_id);
create index sell_orders_status_idx on public.sell_orders(status);
create index transactions_user_idx on public.transactions(user_id,created_at desc);
create index wallet_transactions_user_idx on public.wallet_transactions(user_id,created_at desc);
create index withdraws_user_idx on public.withdraws(user_id,created_at desc);
create index withdrawals_user_idx on public.withdrawals(user_id,created_at desc);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index login_activity_user_idx on public.login_activity(user_id,created_at desc);
create index daily_reports_user_idx on public.daily_reports(user_id,report_date desc);

-- =========================
-- AUTH -> USERS
-- =========================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username :=
    coalesce(
      nullif(new.raw_user_meta_data->>'username',''),
      split_part(coalesce(new.email,''),'@',1),
      'user_' || substr(new.id::text,1,8)
    );

  insert into public.users(
    id,email,username,full_name,email_verified
  )
  values(
    new.id,
    coalesce(new.email,''),
    generated_username,
    new.raw_user_meta_data->>'full_name',
    new.email_confirmed_at is not null
  )
  on conflict(id) do update set
    email=excluded.email,
    email_verified=excluded.email_verified,
    updated_at=now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_click2pay on auth.users;

create trigger on_auth_user_created_click2pay
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- =========================
-- USERS -> PROFILES
-- =========================
create or replace function public.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(
    id,username,full_name,photo_url,balance,
    ads_earning_today,ads_earning_month,ads_earning_total,
    sell_earning_today,sell_earning_month,sell_earning_total,
    total_views,total_clicks,withdraw_count,
    sell_link_enabled,status,created_at,updated_at
  )
  values(
    new.id,new.username,new.full_name,new.photo_url,new.balance,
    new.ads_earning_today,new.ads_earning_month,new.ads_earning_total,
    new.sell_earning_today,new.sell_earning_month,new.sell_earning_total,
    new.total_views,new.total_clicks,new.withdraw_count,
    new.sell_link_enabled,new.status,new.created_at,new.updated_at
  )
  on conflict(id) do update set
    username=excluded.username,
    full_name=excluded.full_name,
    photo_url=excluded.photo_url,
    balance=excluded.balance,
    ads_earning_today=excluded.ads_earning_today,
    ads_earning_month=excluded.ads_earning_month,
    ads_earning_total=excluded.ads_earning_total,
    sell_earning_today=excluded.sell_earning_today,
    sell_earning_month=excluded.sell_earning_month,
    sell_earning_total=excluded.sell_earning_total,
    total_views=excluded.total_views,
    total_clicks=excluded.total_clicks,
    withdraw_count=excluded.withdraw_count,
    sell_link_enabled=excluded.sell_link_enabled,
    status=excluded.status,
    updated_at=now();

  return new;
end;
$$;

create trigger users_profile_sync
after insert or update on public.users
for each row execute function public.sync_user_profile();

-- =========================
-- ADS VIEW RPC
-- Atomic: view + link stats + user stats + report.
-- =========================
create or replace function public.process_ads_view(
  p_link_id uuid,
  p_earning numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.links%rowtype;
begin
  select * into l
  from public.links
  where id=p_link_id
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','Link not found');
  end if;

  if lower(coalesce(l.status,'')) <> 'active' then
    return jsonb_build_object('success',false,'error','Link inactive');
  end if;

  update public.links
  set views=views+1,
      total_views=total_views+1,
      earnings=earnings+coalesce(p_earning,0),
      total_earnings=total_earnings+coalesce(p_earning,0),
      updated_at=now()
  where id=l.id;

  update public.users
  set total_views=total_views+1,
      total_ads=total_ads+coalesce(p_earning,0),
      ads_earning_today=ads_earning_today+coalesce(p_earning,0),
      ads_earning_month=ads_earning_month+coalesce(p_earning,0),
      ads_earning_total=ads_earning_total+coalesce(p_earning,0),
      balance=balance+coalesce(p_earning,0),
      updated_at=now()
  where id=l.user_id;

  insert into public.link_views(
    link_id,is_valid,earning,created_at
  )
  values(
    l.id,true,coalesce(p_earning,0),now()
  );

  insert into public.wallet_transactions(
    user_id,type,amount,title,description,status
  )
  values(
    l.user_id,'credit',coalesce(p_earning,0),
    'Ads View','Ads view for link '||l.id,'success'
  );

  insert into public.transactions(
    user_id,type,amount,title,description,status
  )
  values(
    l.user_id,'ads_earning',coalesce(p_earning,0),
    'Ads Earning','Ads view for link '||l.id,'success'
  );

  insert into public.daily_reports(
    user_id,report_date,ads_views,ads_earnings
  )
  values(
    l.user_id,current_date,1,coalesce(p_earning,0)
  )
  on conflict(user_id,report_date) do update set
    ads_views=public.daily_reports.ads_views+1,
    ads_earnings=public.daily_reports.ads_earnings+excluded.ads_earnings;

  return jsonb_build_object(
    'success',true,
    'link_id',l.id,
    'earning',coalesce(p_earning,0)
  );
end;
$$;

-- =========================
-- SELL PAYMENT RPC
-- =========================
create or replace function public.process_sell_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.sell_orders%rowtype;
  fee_value numeric(18,2);
  receive_value numeric(18,2);
begin
  select * into o
  from public.sell_orders
  where id=p_order_id
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','Order not found');
  end if;

  if o.balance_processed or o.balance_credited then
    return jsonb_build_object(
      'success',true,
      'already_processed',true,
      'seller_receive',o.seller_receive
    );
  end if;

  fee_value := floor(o.price * 20 / 100);
  receive_value := o.price - fee_value;

  update public.sell_orders
  set status='paid',
      payment_status='paid',
      paid_at=coalesce(paid_at,now()),
      fee=fee_value,
      seller_receive=receive_value,
      balance_processed=true,
      balance_credited=true,
      updated_at=now()
  where id=o.id;

  update public.users
  set balance=balance+receive_value,
      total_sell=total_sell+receive_value,
      sell_earning_total=sell_earning_total+receive_value,
      sell_earning_month=sell_earning_month+receive_value,
      sell_earning_today=sell_earning_today+receive_value,
      updated_at=now()
  where id=o.seller_id;

  update public.links
  set sales=sales+1,
      sold=sold+1,
      updated_at=now()
  where id=o.link_id;

  insert into public.transactions(
    user_id,type,amount,title,description,status
  )
  values(
    o.seller_id,'sell_earning',receive_value,
    'Sell Link Sale','Sell Link order '||o.id,'success'
  );

  insert into public.wallet_transactions(
    user_id,type,amount,title,description,status
  )
  values(
    o.seller_id,'credit',receive_value,
    'Sell Link Sale','Sell Link order '||o.id,'success'
  );

  return jsonb_build_object(
    'success',true,
    'order_id',o.id,
    'seller_receive',receive_value,
    'fee',fee_value
  );
end;
$$;

-- =========================
-- RLS
-- =========================
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.link_views enable row level security;
alter table public.link_access enable row level security;
alter table public.sell_orders enable row level security;
alter table public.link_payments enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdraws enable row level security;
alter table public.withdrawals enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_requests enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.login_activity enable row level security;
alter table public.daily_reports enable row level security;
alter table public.cpm_rates enable row level security;
alter table public.cpm_market enable row level security;
alter table public.cpm_settings enable row level security;
alter table public.settings enable row level security;
alter table public.menus enable row level security;
alter table public.announcements enable row level security;
alter table public.admins enable row level security;

-- User-owned policies.
create policy users_select_own on public.users
for select using (auth.uid()=id);

create policy users_update_own on public.users
for update using (auth.uid()=id)
with check (auth.uid()=id);

create policy profiles_select_own on public.profiles
for select using (auth.uid()=id);

create policy profiles_update_own on public.profiles
for update using (auth.uid()=id)
with check (auth.uid()=id);

create policy links_owner_all on public.links
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy transactions_select_own on public.transactions
for select using (auth.uid()=user_id);

create policy wallet_transactions_select_own on public.wallet_transactions
for select using (auth.uid()=user_id);

create policy withdraws_own_all on public.withdraws
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy withdrawals_own_all on public.withdrawals
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy payment_methods_own_all on public.payment_methods
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy payment_requests_own_all on public.payment_requests
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy referrals_own_select on public.referrals
for select using (
  auth.uid()=referrer_id or auth.uid()=referred_id
);

create policy notifications_own_all on public.notifications
for all using (auth.uid()=user_id)
with check (auth.uid()=user_id);

create policy login_activity_own_select on public.login_activity
for select using (auth.uid()=user_id);

create policy daily_reports_own_select on public.daily_reports
for select using (auth.uid()=user_id);

-- Public pages need to read active links and CPM.
create policy links_public_active_select on public.links
for select using (status='active');

create policy cpm_rates_public_select on public.cpm_rates
for select using (true);

create policy cpm_market_public_select on public.cpm_market
for select using (true);

create policy cpm_settings_public_select on public.cpm_settings
for select using (true);

-- Basic public settings/menu reads.
create policy settings_public_select on public.settings
for select using (true);

create policy menus_public_select on public.menus
for select using (true);

-- Admin-owned data is intended to be accessed by service-role/admin APIs.
-- Do not expose broad admin policies to anonymous users.

-- =========================
-- DEFAULT SETTINGS
-- =========================
insert into public.settings(key,value,maintenance,ads_cpm,sell_cpm,minimum_withdraw)
values
('site_name','Click2Pay',false,5000,10000,10000),
('currency','IDR',false,5000,10000,10000),
('sell_fee_percent','20',false,5000,10000,10000)
on conflict(key) do nothing;

insert into public.cpm_rates(country,cpm,history,change,trend)
values
('Indonesian',75,'[]'::jsonb,0,0)
on conflict(country) do nothing;

-- =========================
-- FINAL CHECK
-- =========================
select count(*) as total_public_tables
from information_schema.tables
where table_schema='public'
and table_type='BASE TABLE';
