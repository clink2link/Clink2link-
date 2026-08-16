# Click2Pay — Launch Candidate

## 1. Cloudflare Pages
Deploy the **contents of this folder** as the Pages project root.

Required Pages environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` — server-side only
- `DOMPETX_API_KEY` — server-side only
- `MARKET_FEE=20`

Optional:

- `DOMPAY_API_KEY`
- `DOMPAY_BASE_URL`

Never put `SUPABASE_SERVICE_KEY` or `DOMPETX_API_KEY` into browser JavaScript.

## 2. Supabase

Open Supabase SQL Editor and run:

`supabase/schema.sql`

The schema is designed to be rerunnable. It creates the application tables, RLS, Auth triggers, admin helper, login helper, CPM RPC, and atomic Sell Link payment RPC.

**Do not run a DROP DATABASE / DROP SCHEMA command on production.**

## 3. Authentication

Supabase Authentication must allow:

- Email/password sign-up
- Email/password sign-in
- Password recovery

If Google login is enabled, add the production domain to Supabase Auth redirect URLs and configure the Google provider.

The browser uses the Supabase anon key only. `public.users` is created automatically from `auth.users` by the database trigger.

## 4. DompetX

Set the DompetX webhook/callback URL to:

`https://YOUR-DOMAIN/api/payment-callback`

The payment status endpoint is:

`/api/payment/status?order_id=UUID`

## 5. Production checklist

Before public launch:

1. Confirm Supabase email confirmation works.
2. Test registration with a new email.
3. Test login with email.
4. Test login with username.
5. Test password reset.
6. Test creating an Ads Link.
7. Confirm CPM has an `Indonesia` row in `cpm_rates`.
8. Test one Ads view and verify balance, transaction, wallet transaction, and daily report.
9. Test Sell Link order creation.
10. Test a real/sandbox DompetX payment and verify the seller is credited once.
11. Test withdrawal permissions.
12. Create the first admin row manually in Supabase.
13. Confirm admin pages cannot be accessed by a normal account.

## 6. Important earning note

`process_ads_view(uuid,numeric)` intentionally ignores the client-supplied earning value. It reads the CPM from the database and calculates `CPM / 1000` for each view.

For high-volume production traffic, add server-side IP/device rate limiting before enabling unrestricted public Ads traffic. The current RPC prevents client-side CPM tampering, but no browser-only view system can completely prevent automated traffic.
