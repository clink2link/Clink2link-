# Click2Pay — Production Launch Package

This package is intended for deployment after environment variables and payment credentials are configured.

## Included
- Public landing page and auth pages
- Dashboard, links, Ads Link, Sell Link, buyer flow
- Task 1 → Task 2 → Task 3 → Final flow
- Referral, history, activity, notifications, profile, settings
- Premium status UI backed by database state (no fake localStorage upgrade)
- Withdraw and payment settings
- Admin and CPM management pages
- Supabase SQL schema, RLS, RPCs and Auth trigger
- Cloudflare Pages Functions for link and payment endpoints

## Required environment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (server/functions only; never expose to browser)
- `DOMPETX_API_KEY`
- `MARKET_FEE`

## Important
The frontend only uses the Supabase anon key. Seller balances and Ads earnings are calculated server-side by PostgreSQL RPCs. Payment settlement must only credit balances after the gateway callback has been verified.

Before public launch, test registration, email verification, login, one Ads view, one Sell order, one successful payment callback, and one withdrawal.
