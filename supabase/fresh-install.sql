-- CLICK2PAY PRODUCTION — FRESH INSTALL
-- DESTRUCTIVE: removes the existing Click2Pay public schema objects and Auth triggers.
-- Run only when you intentionally want a clean Click2Pay database.
begin;
drop trigger if exists on_auth_user_created_click2pay on auth.users;
drop trigger if exists on_auth_user_updated_click2pay on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists users_profile_sync on public.users;

drop function if exists public.handle_new_auth_user() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.sync_user_profile() cascade;
drop function if exists public.process_ads_view(uuid,numeric) cascade;
drop function if exists public.process_ads_view(uuid,bigint) cascade;
drop function if exists public.process_sell_payment(uuid) cascade;
drop function if exists public.process_dompetx_sell_payment(uuid,text,bigint) cascade;
drop function if exists public.process_referral_signup(uuid,text) cascade;
drop function if exists public.process_premium_payment(uuid) cascade;
drop function if exists public.is_username_available(text) cascade;
drop function if exists public.is_admin(uuid) cascade;
drop function if exists public.get_login_email(uuid) cascade;
drop function if exists public.update_links_updated_at() cascade;
drop function if exists public.update_updated_at() cascade;

drop table if exists public.bans cascade;
drop table if exists public.premium_orders cascade;
drop table if exists public.daily_reports cascade;
drop table if exists public.cpm_settings cascade;
drop table if exists public.cpm_market cascade;
drop table if exists public.cpm_rates cascade;
drop table if exists public.settings cascade;
drop table if exists public.menus cascade;
drop table if exists public.announcements cascade;
drop table if exists public.admins cascade;
drop table if exists public.login_activity cascade;
drop table if exists public.notifications cascade;
drop table if exists public.referrals cascade;
drop table if exists public.payment_requests cascade;
drop table if exists public.payment_methods cascade;
drop table if exists public.withdrawals cascade;
drop table if exists public.withdraws cascade;
drop table if exists public.wallet_transactions cascade;
drop table if exists public.transactions cascade;
drop table if exists public.link_payments cascade;
drop table if exists public.sell_orders cascade;
drop table if exists public.link_access cascade;
drop table if exists public.link_views cascade;
drop table if exists public.links cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;
commit;

-- Next: run schema.sql in this folder.
