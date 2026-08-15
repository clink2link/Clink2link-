
-- Click2Pay launch diagnostics / admin bootstrap
-- Replace YOUR_AUTH_USER_UUID with the first admin's auth.users.id.

-- 1) Verify tables:
select count(*) as total_public_tables
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE';

-- 2) Verify key RPCs:
select routine_name, routine_type
from information_schema.routines
where routine_schema='public'
and routine_name in (
 'process_ads_view','process_sell_payment',
 'process_dompetx_sell_payment','get_login_email',
 'is_username_available'
)
order by routine_name;

-- 3) Create the first admin after registering:
-- insert into public.admins(user_id,role)
-- values ('YOUR_AUTH_USER_UUID','admin')
-- on conflict(user_id) do update set role='admin';

-- 4) Verify an account:
-- select id,username,email,is_admin,is_banned,status
-- from public.users order by created_at desc limit 10;
