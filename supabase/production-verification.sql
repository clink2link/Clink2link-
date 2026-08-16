-- CLICK2PAY PRODUCTION VERIFICATION
-- Run after production-upgrade.sql

select
  (select count(*) from public.users) as users,
  (select count(*) from public.links) as links,
  (select count(*) from public.sell_orders) as sell_orders,
  (select count(*) from public.withdraws) as withdraws,
  (select count(*) from public.link_views) as link_views;

select proname
from pg_proc
join pg_namespace n on n.oid=pg_proc.pronamespace
where n.nspname='public'
  and proname in (
    'request_withdrawal',
    'admin_process_withdrawal',
    'process_ads_view_secure',
    'process_sell_payment'
  )
order by proname;

select status, count(*)
from public.withdraws
group by status
order by status;

select
  count(*) filter (where balance < 0) as negative_balances
from public.users;

select
  count(*) filter (where status='paid' and not balance_processed) as paid_unprocessed_orders
from public.sell_orders;
