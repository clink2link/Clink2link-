
-- ============================================================
-- CLICK2PAY PRODUCTION HARDENING / DATABASE UPGRADE
-- Run AFTER schema.sql in Supabase SQL Editor.
-- This file is idempotent.
-- ============================================================

-- -----------------------------
-- Canonical withdrawal storage
-- -----------------------------
alter table public.withdraws add column if not exists account_name text;
alter table public.withdraws add column if not exists note text;
alter table public.withdraws add column if not exists paid_at timestamptz;
alter table public.withdraws add column if not exists updated_at timestamptz not null default now();

create index if not exists withdraws_status_idx
  on public.withdraws(status, created_at desc);

delete from public.payment_methods a
using public.payment_methods b
where a.user_id=b.user_id and a.id>b.id;
create unique index if not exists payment_methods_user_uidx
  on public.payment_methods(user_id);

delete from public.referrals a
using public.referrals b
where a.referred_id=b.referred_id
  and a.referred_id is not null
  and a.id>b.id;
create unique index if not exists referrals_referred_uidx
  on public.referrals(referred_id)
  where referred_id is not null;

-- Normalize legacy status values before adding the constraint.
update public.withdraws set status='paid' where lower(status) in ('success','completed');
update public.withdraws set status='pending' where status is null or trim(status)='';
-- Keep only valid application statuses.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='withdraws_status_check'
      and conrelid='public.withdraws'::regclass
  ) then
    alter table public.withdraws
      add constraint withdraws_status_check
      check (status in ('pending','processing','paid','rejected','cancelled'));
  end if;
end $$;

-- -----------------------------
-- Atomic withdrawal request
-- -----------------------------
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_method text,
  p_account_name text default null,
  p_account_number text default null,
  p_type text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_fee numeric(18,2) := 0;
  v_limit numeric(18,2);
  v_type text := lower(trim(coalesce(p_type,'manual')));
  v_method text := lower(trim(coalesce(p_method,'')));
  v_number text := trim(coalesce(p_account_number,''));
  v_amount numeric(18,2) := floor(coalesce(p_amount,0));
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('success',false,'error','Login diperlukan.');
  end if;

  if v_type not in ('manual','instant') then
    return jsonb_build_object('success',false,'error','Jenis withdraw tidak valid.');
  end if;

  if v_amount < 10000 then
    return jsonb_build_object('success',false,'error','Minimal withdraw Rp10.000.');
  end if;

  if v_method = '' or v_number = '' then
    return jsonb_build_object('success',false,'error','Metode dan nomor tujuan wajib diisi.');
  end if;

  select * into v_user
  from public.users
  where id=auth.uid()
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','User tidak ditemukan.');
  end if;

  if coalesce(v_user.is_banned,false) or lower(coalesce(v_user.status,'active')) <> 'active' then
    return jsonb_build_object('success',false,'error','Akun tidak dapat melakukan withdraw.');
  end if;

  if v_user.balance < v_amount then
    return jsonb_build_object('success',false,'error','Saldo tidak mencukupi.');
  end if;

  if v_type='instant' then
    if coalesce(v_user.is_premium,false)
       and (v_user.premium_expires_at is null or v_user.premium_expires_at > now()) then
      v_limit := 500000;
    else
      v_limit := 250000;
      v_fee := 15000;
    end if;

    if v_amount > v_limit then
      return jsonb_build_object('success',false,'error',
        'Limit withdraw instan maksimal Rp '||to_char(v_limit,'FM999G999G999'));
    end if;
  end if;

  -- Reserve the full requested amount atomically.
  update public.users
  set balance = balance - v_amount,
      withdraw_count = coalesce(withdraw_count,0)+1,
      updated_at = now()
  where id=auth.uid();

  insert into public.withdraws(
    user_id,method,account_name,account_number,amount,fee,type,status,note
  ) values (
    auth.uid(),v_method,
    nullif(trim(p_account_name),''),
    v_number,v_amount,v_fee,v_type,'pending',
    'Saldo dicadangkan; menunggu proses payout/admin.'
  )
  returning id into v_id;

  insert into public.wallet_transactions(
    user_id,type,amount,title,description,status
  ) values (
    auth.uid(),'debit',v_amount,'Withdraw Request',
    'Saldo dicadangkan untuk withdraw '||v_id,'success'
  );

  insert into public.transactions(
    user_id,type,amount,title,description,status
  ) values (
    auth.uid(),'withdraw',v_amount,'Withdraw Request',
    'Withdraw request '||v_id,'success'
  );

  return jsonb_build_object(
    'success',true,
    'id',v_id,
    'amount',v_amount,
    'fee',v_fee,
    'receive',greatest(v_amount-v_fee,0),
    'status','pending'
  );
end;
$$;

-- -----------------------------
-- Admin payout state transition
-- -----------------------------
create or replace function public.admin_process_withdrawal(
  p_withdraw_id uuid,
  p_action text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.withdraws%rowtype;
  v_action text := lower(trim(coalesce(p_action,'')));
begin
  if not exists(select 1 from public.admins where user_id=auth.uid()) then
    return jsonb_build_object('success',false,'error','Admin access required.');
  end if;

  select * into w
  from public.withdraws
  where id=p_withdraw_id
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','Withdraw tidak ditemukan.');
  end if;

  if w.status not in ('pending','processing') then
    return jsonb_build_object('success',false,'error','Withdraw sudah diproses.');
  end if;

  if v_action='paid' then
    update public.withdraws
    set status='paid',
        paid_at=coalesce(paid_at,now()),
        note=coalesce(p_note,note),
        updated_at=now()
    where id=w.id;

    update public.users
    set withdraw_total=coalesce(withdraw_total,0)+w.amount,
        updated_at=now()
    where id=w.user_id;

    insert into public.transactions(user_id,type,amount,title,description,status)
    values(w.user_id,'withdraw_paid',w.amount,'Withdraw Paid',
           'Payout confirmed for withdraw '||w.id,'success');

    return jsonb_build_object('success',true,'status','paid');
  elsif v_action in ('rejected','cancelled') then
    update public.withdraws
    set status=v_action,
        note=coalesce(p_note,note),
        updated_at=now()
    where id=w.id;

    update public.users
    set balance=balance+w.amount,
        updated_at=now()
    where id=w.user_id;

    insert into public.wallet_transactions(user_id,type,amount,title,description,status)
    values(w.user_id,'credit',w.amount,'Withdraw Refunded',
           'Withdraw '||w.id||' was '||v_action,'success');

    insert into public.transactions(user_id,type,amount,title,description,status)
    values(w.user_id,'withdraw_refund',w.amount,'Withdraw Refunded',
           'Refund for withdraw '||w.id,'success');

    return jsonb_build_object('success',true,'status',v_action,'refunded',w.amount);
  end if;

  return jsonb_build_object('success',false,'error','Action tidak valid.');
end;
$$;

-- -----------------------------
-- Secure server-side Ads view
-- -----------------------------
create or replace function public.process_ads_view_secure(
  p_link_id uuid,
  p_fingerprint text,
  p_device text default null,
  p_referer text default null
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
  if p_link_id is null or nullif(trim(coalesce(p_fingerprint,'')),'') is null then
    return jsonb_build_object('success',false,'error','Invalid view data.');
  end if;

  select * into v_link
  from public.links
  where id=p_link_id
  for update;

  if not found then
    return jsonb_build_object('success',false,'error','Link not found.');
  end if;

  if lower(coalesce(v_link.status,'')) <> 'active'
     or lower(coalesce(v_link.link_type,v_link.type,'')) <> 'ads' then
    return jsonb_build_object('success',false,'error','Link is not active.');
  end if;

  -- Logged-in owner views are never monetized.
  if auth.uid() is not null and auth.uid()=v_link.user_id then
    return jsonb_build_object('success',false,'error','Owner views are not eligible.');
  end if;

  if exists(
    select 1 from public.link_views
    where link_id=v_link.id
      and visitor_ip=p_fingerprint
      and is_valid=true
      and created_at >= now()-interval '24 hours'
  ) then
    return jsonb_build_object('success',false,'duplicate',true,
      'error','This view was already counted recently.');
  end if;

  select cpm into v_cpm
  from public.cpm_rates
  where lower(country)='indonesia'
  limit 1;

  if coalesce(v_cpm,0)<=0 then
    select ads_cpm into v_cpm from public.cpm_settings
    where lower(country)='indonesia' limit 1;
  end if;

  if coalesce(v_cpm,0)<=0 then
    return jsonb_build_object('success',false,'error','CPM rate is not configured.');
  end if;

  v_earning := round(v_cpm/1000.0,2);

  insert into public.link_views(
    link_id,visitor_ip,device,referer,is_valid,earning,created_at
  ) values (
    v_link.id,p_fingerprint,left(p_device,250),left(p_referer,1000),true,v_earning,now()
  );

  update public.links
  set views=coalesce(views,0)+1,
      total_views=coalesce(total_views,0)+1,
      earnings=coalesce(earnings,0)+v_earning,
      total_earnings=coalesce(total_earnings,0)+v_earning,
      updated_at=now()
  where id=v_link.id;

  update public.users
  set balance=coalesce(balance,0)+v_earning,
      total_ads=coalesce(total_ads,0)+v_earning,
      total_views=coalesce(total_views,0)+1,
      ads_earning_today=coalesce(ads_earning_today,0)+v_earning,
      ads_earning_month=coalesce(ads_earning_month,0)+v_earning,
      ads_earning_total=coalesce(ads_earning_total,0)+v_earning,
      updated_at=now()
  where id=v_link.user_id;

  insert into public.transactions(user_id,type,amount,title,description,status)
  values(v_link.user_id,'ads_earning',v_earning,'Ads View Earning',
         'Verified Ads Link view '||v_link.id,'success');

  insert into public.wallet_transactions(user_id,type,amount,title,description,status)
  values(v_link.user_id,'credit',v_earning,'Ads View Earning',
         'Verified Ads Link view','success');

  insert into public.daily_reports(user_id,report_date,ads_views,ads_clicks,ads_earnings)
  values(v_link.user_id,v_today,1,0,v_earning)
  on conflict(user_id,report_date) do update set
    ads_views=coalesce(public.daily_reports.ads_views,0)+1,
    ads_earnings=coalesce(public.daily_reports.ads_earnings,0)+v_earning;

  return jsonb_build_object(
    'success',true,'link_id',v_link.id,'cpm',v_cpm,'earning',v_earning
  );
end;
$$;

revoke execute on function public.request_withdrawal(numeric,text,text,text,text) from public,anon;
grant execute on function public.request_withdrawal(numeric,text,text,text,text) to authenticated;

revoke execute on function public.admin_process_withdrawal(uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_process_withdrawal(uuid,text,text) to authenticated;

revoke execute on function public.process_ads_view_secure(uuid,text,text,text) from public;
grant execute on function public.process_ads_view_secure(uuid,text,text,text) to anon,authenticated;

-- -----------------------------
-- Useful reconciliation indexes
-- -----------------------------
create index if not exists link_views_fingerprint_idx
  on public.link_views(link_id,visitor_ip,created_at desc);

-- -----------------------------
-- Keep profile mirror synchronized
-- -----------------------------
update public.profiles p
set username=u.username, full_name=u.full_name, photo_url=u.photo_url,
    balance=u.balance, ads_earning_today=u.ads_earning_today,
    ads_earning_month=u.ads_earning_month, ads_earning_total=u.ads_earning_total,
    sell_earning_today=u.sell_earning_today, sell_earning_month=u.sell_earning_month,
    sell_earning_total=u.sell_earning_total, total_views=u.total_views,
    total_clicks=u.total_clicks, withdraw_count=u.withdraw_count,
    sell_link_enabled=u.sell_link_enabled, status=u.status, updated_at=now()
from public.users u
where p.id=u.id;



alter table public.links add column if not exists alias text;
alter table public.links add column if not exists custom_alias text;
alter table public.links add column if not exists campaign text;
alter table public.links add column if not exists campaign_name text;
alter table public.links add column if not exists device text not null default 'all';
alter table public.links add column if not exists target_device text not null default 'all';
alter table public.links add column if not exists expired_at timestamptz;
alter table public.links add column if not exists expired text not null default 'never';
create index if not exists links_user_created_idx on public.links(user_id,created_at desc);
