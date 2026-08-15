-- Click2Pay Production Launch Check
select count(*) as total_tables from information_schema.tables where table_schema='public' and table_type='BASE TABLE';
select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name;
select routine_name,pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and routine_name in ('process_ads_view','process_sell_payment','process_premium_payment','process_referral_signup','handle_new_auth_user','sync_user_profile') order by routine_name,args;
select country,cpm from public.cpm_rates order by country;
select key,minimum_withdraw,ads_cpm,sell_cpm,maintenance from public.settings order by key;
