
-- Click2Pay unified PostgreSQL schema for Supabase
-- Run in Supabase SQL Editor. Safe to run repeatedly for existing tables/columns.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
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
  ads_earning_today numeric(18,2) not null default 0,
  ads_earning_month numeric(18,2) not null default 0,
  ads_earning_total numeric(18,2) not null default 0,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility view/table for older frontend code.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  photo_url text,
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

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination_url text not null,
  short_code text not null unique,
  type text not null default 'ads' check (type in ('ads','sell')),
  link_type text not null default 'ads' check (link_type in ('ads','sell')),
  price numeric(18,2) not null default 0,
  total_views bigint not null default 0,
  total_clicks bigint not null default 0,
  total_earnings numeric(18,2) not null default 0,
  views bigint not null default 0,
  clicks bigint not null default 0,
  earnings numeric(18,2) not null default 0,
  sales bigint not null default 0,
  sold bigint not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_views (
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

create table if not exists public.link_access (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  payment_id uuid,
  buyer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(link_id,buyer_id)
);

create table if not exists public.sell_orders (
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
  expires_at timestamptz,
  paid_at timestamptz,
  fee numeric(18,2) not null default 0,
  seller_receive numeric(18,2) not null default 0,
  balance_processed boolean not null default false,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_payments (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  invoice_id text unique not null,
  amount numeric(18,2) not null,
  qr_url text,
  status text not null default 'pending',
  expired_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(18,2) not null default 0,
  title text,
  description text,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(18,2) not null default 0,
  title text,
  description text,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create table if not exists public.withdraws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null,
  account_name text,
  account_number text not null,
  amount numeric(18,2) not null,
  fee numeric(18,2) not null default 0,
  type text not null default 'regular',
  status text not null default 'pending',
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18,2) not null,
  method text not null,
  account_name text,
  account_number text not null,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text,
  bank_name text,
  account_name text,
  account_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_name text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete set null,
  referred_email text,
  bonus numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.login_activity (
  id uuid primary key default gen_random_uuid(),
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
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.menus (
  id bigint generated by default as identity primary key,
  name text not null,
  icon text,
  link text,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  maintenance boolean not null default false,
  ads_cpm numeric(18,4) not null default 0,
  sell_cpm numeric(18,4) not null default 0,
  minimum_withdraw numeric(18,2) not null default 10000,
  updated_at timestamptz not null default now()
);

create table if not exists public.cpm_rates (
  id uuid primary key default gen_random_uuid(),
  country text unique not null,
  cpm numeric(18,4) not null default 0,
  history jsonb not null default '[]'::jsonb,
  change numeric(18,4) not null default 0,
  trend text not null default 'stable',
  updated_at timestamptz not null default now()
);

create table if not exists public.cpm_market (
  id uuid primary key default gen_random_uuid(),
  country text unique not null,
  flag text,
  cpm numeric(18,4) not null default 0,
  change numeric(18,4) not null default 0,
  trend text not null default 'stable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cpm_settings (
  id uuid primary key default gen_random_uuid(),
  country text unique not null,
  ads_cpm numeric(18,4) not null default 0,
  sell_cpm numeric(18,4) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_reports (
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

-- Helpful indexes
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_short_code_idx on public.links(short_code);
create index if not exists sell_orders_seller_idx on public.sell_orders(seller_id);
create index if not exists sell_orders_buyer_idx on public.sell_orders(buyer_id);
create index if not exists sell_orders_status_idx on public.sell_orders(status);
create index if not exists link_views_link_idx on public.link_views(link_id);
create index if not exists notifications_user_idx on public.notifications(user_id,created_at desc);
create index if not exists transactions_user_idx on public.transactions(user_id,created_at desc);
create index if not exists withdraws_user_idx on public.withdraws(user_id,created_at desc);

-- Keep profiles synchronized when a user is created/updated.
create or replace function public.sync_user_profile()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id,username,full_name,photo_url,balance,ads_earning_today,ads_earning_month,
    ads_earning_total,sell_earning_today,sell_earning_month,sell_earning_total,
    total_views,total_clicks,withdraw_count,sell_link_enabled,status,created_at,updated_at
  )
  values (
    new.id,new.username,new.full_name,new.photo_url,new.balance,new.ads_earning_today,new.ads_earning_month,
    new.ads_earning_total,new.sell_earning_today,new.sell_earning_month,new.sell_earning_total,
    new.total_views,new.total_clicks,new.withdraw_count,new.sell_link_enabled,new.status,new.created_at,new.updated_at
  )
  on conflict(id) do update set
    username=excluded.username,full_name=excluded.full_name,photo_url=excluded.photo_url,
    balance=excluded.balance,ads_earning_today=excluded.ads_earning_today,
    ads_earning_month=excluded.ads_earning_month,ads_earning_total=excluded.ads_earning_total,
    sell_earning_today=excluded.sell_earning_today,sell_earning_month=excluded.sell_earning_month,
    sell_earning_total=excluded.sell_earning_total,total_views=excluded.total_views,
    total_clicks=excluded.total_clicks,withdraw_count=excluded.withdraw_count,
    sell_link_enabled=excluded.sell_link_enabled,status=excluded.status,updated_at=now();
  return new;
end $$;

drop trigger if exists users_profile_sync on public.users;
create trigger users_profile_sync after insert or update on public.users
for each row execute function public.sync_user_profile();

-- New Supabase Auth user -> application user.




-- Atomic sell payment processor. The backend calls this RPC after DompetX confirms payment.
create or replace function public.process_sell_payment(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o public.sell_orders%rowtype;
  fee_percent numeric := 20;
  fee_value numeric;
  receive_value numeric;
begin
  select * into o from public.sell_orders where id=p_order_id for update;
  if not found then return jsonb_build_object('success',false,'error','Order not found'); end if;

  if o.balance_processed then
    return jsonb_build_object('success',true,'already_processed',true,'seller_receive',o.seller_receive);
  end if;

  fee_value := floor(o.price * fee_percent / 100);
  receive_value := o.price - fee_value;

  update public.sell_orders
  set status='paid', paid_at=coalesce(paid_at,now()), fee=fee_value,
      seller_receive=receive_value, balance_processed=true, updated_at=now()
  where id=o.id;

  update public.users set
    balance=balance+receive_value,
    total_sell=total_sell+receive_value,
    sell_earning_total=sell_earning_total+receive_value,
    sell_earning_month=sell_earning_month+receive_value,
    sell_earning_today=sell_earning_today+receive_value,
    updated_at=now()
  where id=o.seller_id;

  update public.links set
    sales=sales+1, sold=sold+1, updated_at=now()
  where id=o.link_id;

  insert into public.transactions(user_id,type,amount,title,description,status)
  values(o.seller_id,'sell_earning',receive_value,'Sell Link Sale','Sell Link order '||o.id,'success');

  insert into public.wallet_transactions(user_id,type,amount,title,description,status)
  values(o.seller_id,'credit',receive_value,'Sell Link Sale','Sell Link order '||o.id,'success');

  return jsonb_build_object(
    'success',true,'order_id',o.id,'seller_receive',receive_value,
    'fee',fee_value
  );
end $$;


-- ============================================================
-- Ads earning RPC
-- The client-supplied earning is deliberately ignored. The
-- server reads CPM and calculates CPM / 1000 per valid view.
-- ============================================================
create or replace function public.process_ads_view(
  p_link_id uuid,
  p_earning numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.links%rowtype;
  v_cpm numeric;
  v_earning numeric;
  v_today date := current_date;
begin
  select * into v_link
  from public.links
  where id = p_link_id
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','Link not found');
  end if;

  if lower(coalesce(v_link.status,'')) <> 'active' then
    return jsonb_build_object('success',false,'error','Link is not active');
  end if;

  if lower(coalesce(v_link.link_type, v_link.type,'')) <> 'ads' then
    return jsonb_build_object('success',false,'error','Not an ads link');
  end if;

  select cpm into v_cpm
  from public.cpm_rates
  where lower(country) in ('indonesia','indonesian')
  order by case when lower(country)='indonesia' then 0 else 1 end
  limit 1;

  if v_cpm is null or v_cpm <= 0 then
    return jsonb_build_object('success',false,'error','CPM rate is not configured');
  end if;

  -- CPM means earnings per 1,000 views.
  v_earning := round(v_cpm / 1000.0, 2);

  update public.links
  set views = coalesce(views,0)+1,
      total_views = coalesce(total_views,0)+1,
      earnings = coalesce(earnings,0)+v_earning,
      total_earnings = coalesce(total_earnings,0)+v_earning,
      updated_at = now()
  where id = v_link.id;

  insert into public.link_views(link_id,is_valid,earning,created_at)
  values(v_link.id,true,v_earning,now());

  update public.users
  set balance = coalesce(balance,0)+v_earning,
      total_ads = coalesce(total_ads,0)+v_earning,
      total_views = coalesce(total_views,0)+1,
      ads_earning_today = coalesce(ads_earning_today,0)+v_earning,
      ads_earning_month = coalesce(ads_earning_month,0)+v_earning,
      ads_earning_total = coalesce(ads_earning_total,0)+v_earning,
      updated_at = now()
  where id = v_link.user_id;

  insert into public.transactions(user_id,type,amount,title,description,status)
  values(v_link.user_id,'ads_earning',v_earning,'Ads View Earning','Ads Link view '||v_link.id,'success');

  insert into public.wallet_transactions(user_id,type,amount,title,description,status)
  values(v_link.user_id,'credit',v_earning,'Ads View Earning','Ads Link view','success');

  insert into public.daily_reports(user_id,report_date,ads_views,ads_clicks,ads_earnings)
  values(v_link.user_id,v_today,1,0,v_earning)
  on conflict(user_id,report_date) do update set
    ads_views = coalesce(public.daily_reports.ads_views,0)+1,
    ads_earnings = coalesce(public.daily_reports.ads_earnings,0)+v_earning;

  return jsonb_build_object(
    'success',true,
    'link_id',v_link.id,
    'cpm',v_cpm,
    'earning',v_earning
  );
end;
$$;

-- Login helper: exposes only the email address associated with a username.
create or replace function public.get_login_email(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.users
  where lower(username)=lower(trim(p_username))
    and coalesce(is_banned,false)=false
  limit 1;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists(
    select 1 from public.users
    where lower(username)=lower(trim(p_username))
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.process_ads_view(uuid,numeric) to anon, authenticated;

-- Keep application user data synchronized when Auth confirms an email.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users(id,email,username,email_verified)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'username',''),
      split_part(coalesce(new.email,''),'@',1)
    ),
    coalesce(new.email_confirmed_at is not null,false)
  )
  on conflict(id) do update set
    email=excluded.email,
    email_verified=excluded.email_verified,
    updated_at=now();
  return new;
end;
$$;



drop trigger if exists on_auth_user_updated_click2pay on auth.users;
create trigger on_auth_user_updated_click2pay
after update of email,email_confirmed_at on auth.users
for each row execute function public.handle_new_auth_user();

-- RLS: the browser can access only its own rows. Service key bypasses RLS for payment/admin APIs.
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.link_views enable row level security;
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

-- Drop/recreate only application-user policies.
do $$
begin
  create policy users_self_select on public.users for select using (auth.uid()=id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy users_self_update on public.users for update using (auth.uid()=id) with check (auth.uid()=id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy profiles_self_select on public.profiles for select using (auth.uid()=id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy profiles_self_update on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy links_owner_all on public.links for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy transactions_self_select on public.transactions for select using (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy wallet_transactions_self_select on public.wallet_transactions for select using (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy withdraws_self_all on public.withdraws for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy withdrawals_self_all on public.withdrawals for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy payment_methods_self_all on public.payment_methods for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy payment_requests_self_all on public.payment_requests for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy referrals_self_select on public.referrals for select using (auth.uid()=referrer_id or auth.uid()=referred_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy notifications_self_all on public.notifications for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy login_activity_self_select on public.login_activity for select using (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy daily_reports_self_select on public.daily_reports for select using (auth.uid()=user_id);
exception when duplicate_object then null; end $$;


-- Add missing columns when upgrading an existing Click2Pay database.
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists photo_url text;
alter table public.users add column if not exists sell_link_enabled boolean not null default false;
alter table public.users add column if not exists withdraw_total numeric(18,2) not null default 0;
alter table public.users add column if not exists ads_earning_today numeric(18,2) not null default 0;
alter table public.users add column if not exists ads_earning_month numeric(18,2) not null default 0;
alter table public.users add column if not exists ads_earning_total numeric(18,2) not null default 0;
alter table public.users add column if not exists sell_earning_today numeric(18,2) not null default 0;
alter table public.users add column if not exists sell_earning_month numeric(18,2) not null default 0;
alter table public.users add column if not exists sell_earning_total numeric(18,2) not null default 0;
alter table public.users add column if not exists is_premium boolean not null default false;
alter table public.users add column if not exists premium_expires_at timestamptz;
alter table public.users add column if not exists status text not null default 'active';
alter table public.users add column if not exists ref_code text;
alter table public.users add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- Admin helper + policies
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.cpm_rates enable row level security;
alter table public.cpm_market enable row level security;
alter table public.cpm_settings enable row level security;
alter table public.settings enable row level security;
alter table public.announcements enable row level security;
alter table public.menus enable row level security;
alter table public.sell_orders enable row level security;
alter table public.link_payments enable row level security;
alter table public.link_access enable row level security;
alter table public.link_views enable row level security;

-- Public/read-only configuration.
do $$ begin
  create policy cpm_rates_public_select on public.cpm_rates for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cpm_market_public_select on public.cpm_market for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cpm_settings_public_select on public.cpm_settings for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy settings_public_select on public.settings for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy announcements_public_select on public.announcements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy menus_public_select on public.menus for select using (true);
exception when duplicate_object then null; end $$;

-- Admin access.
do $$ begin
  create policy admins_self_select on public.admins for select using (auth.uid()=user_id or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy users_admin_all on public.users for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy links_admin_all on public.links for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy withdraws_admin_all on public.withdraws for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy withdrawals_admin_all on public.withdrawals for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy transactions_admin_select on public.transactions for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy wallet_transactions_admin_select on public.wallet_transactions for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cpm_rates_admin_update on public.cpm_rates for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cpm_market_admin_all on public.cpm_market for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cpm_settings_admin_all on public.cpm_settings for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy settings_admin_all on public.settings for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy announcements_admin_all on public.announcements for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy menus_admin_all on public.menus for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- Owner/buyer access for payment-related browser reads.
do $$ begin
  create policy sell_orders_participant_select on public.sell_orders for select
  using (auth.uid()=seller_id or auth.uid()=buyer_id or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy link_payments_owner_select on public.link_payments for select
  using (exists(select 1 from public.links l where l.id=link_id and l.user_id=auth.uid()) or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy link_access_participant_select on public.link_access for select
  using (auth.uid()=buyer_id or exists(select 1 from public.links l where l.id=link_id and l.user_id=auth.uid()) or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy link_views_owner_select on public.link_views for select
  using (exists(select 1 from public.links l where l.id=link_id and l.user_id=auth.uid()) or public.is_admin());
exception when duplicate_object then null; end $$;



-- ============================================================
-- Safe default configuration / seed values
-- ============================================================
insert into public.settings(key,value,maintenance,ads_cpm,sell_cpm,minimum_withdraw)
values('default','active',false,5000,10000,10000)
on conflict(key) do update set
  value=excluded.value,
  maintenance=public.settings.maintenance;

insert into public.cpm_rates(country,cpm,history,change,trend)
values('Indonesia',5000,'[5000]'::jsonb,0,50)
on conflict(country) do nothing;

insert into public.cpm_market(country,flag,cpm,change,trend)
values('Indonesia','🇮🇩',5000,0,50)
on conflict(country) do nothing;

insert into public.cpm_settings(country,ads_cpm,sell_cpm)
values('Indonesia',5000,10000)
on conflict(country) do nothing;

create unique index if not exists daily_reports_user_date_uidx on public.daily_reports(user_id, report_date);


-- Canonical Supabase Auth -> application user trigger
drop trigger if exists on_auth_user_created_click2pay on auth.users;
create trigger on_auth_user_created_click2pay
after insert on auth.users
for each row execute function public.handle_new_auth_user();

