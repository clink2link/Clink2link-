-- Click2Pay PRODUCTION — launch verification
select count(*) as total_tables
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE';

select table_name
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE'
order by table_name;

-- Expected Click2Pay application tables: 26.
select count(*) as expected_table_count
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE'
and table_name in (
'users','profiles','links','link_views','link_access','sell_orders','link_payments',
'transactions','wallet_transactions','withdraws','withdrawals','payment_methods',
'payment_requests','referrals','notifications','login_activity','admins',
'announcements','menus','settings','cpm_rates','cpm_market','cpm_settings',
'daily_reports','premium_orders','bans'
);

select routine_name,pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
and routine_name in (
'process_ads_view','process_sell_payment','process_dompetx_sell_payment',
'process_premium_payment','process_referral_signup','handle_new_auth_user',
'sync_user_profile','is_username_available'
)
order by routine_name,args;

select tgname as trigger_name, n.nspname as schema_name, c.relname as table_name
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal
and tgname in ('on_auth_user_created_click2pay','on_auth_user_updated_click2pay','users_profile_sync')
order by schema_name,table_name,trigger_name;

select country,cpm,trend from public.cpm_rates order by country;
select key,minimum_withdraw,ads_cpm,sell_cpm,maintenance from public.settings order by key;

select
  (select count(*) from public.premium_orders) as premium_orders,
  (select count(*) from public.links) as links,
  (select count(*) from public.users) as users;
