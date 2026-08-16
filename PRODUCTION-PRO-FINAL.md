# Click2Pay — Production Pro Final

This build is prepared for a real Supabase + Cloudflare Pages/Functions deployment.

## Core production flow

- Supabase Auth → `public.users` is created automatically by the Auth trigger.
- Ads Link → Task 1 → Task 2 → Task 3 → Final verification.
- Final Ads view is processed by `/api/ads/view` using the service role and `process_ads_view` RPC.
- CPM and earnings are calculated in PostgreSQL; the browser cannot choose the earning amount.
- Ads view fingerprint is stored as a SHA-256 value and duplicate views are limited to one per link/visitor per 24 hours.
- Premium is Rp100,000 for 30 days.
- Premium payment is created server-side through DompetX QRIS.
- Premium activation happens only after server-side payment verification.
- Premium users bypass the Ads Link interstitial when logged in.
- Premium buyers receive 50% off eligible Sell Link purchases. The backend verifies Premium; the browser cannot force the discount.
- Sell order fees and seller balance processing remain server-side.
- Account deletion uses Supabase Admin Auth from the server endpoint.

## Database

`supabase/schema.sql` contains the canonical 26-table schema.

For a completely clean database:

1. Run `supabase/fresh-install.sql`.
2. Run `supabase/schema.sql`.
3. Run `supabase/launch-check.sql`.

`fresh-install.sql` is destructive. Do not run it on a database that contains data you want to keep.

## Cloudflare environment variables

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
DOMPETX_API_KEY=YOUR_DOMPETX_API_KEY
MARKET_FEE=20
```

Never put `SUPABASE_SERVICE_KEY` in browser JavaScript.

## Required routes

```text
POST /api/ads/view
POST /api/create-sell-order
POST /api/payment/create
GET  /api/payment/status?order_id=...
POST /api/payment-callback
POST /api/premium/create
GET  /api/premium/status?order_id=...
POST /api/delete-account
```

## Payment

Configure the DompetX webhook/callback to point to:

```text
https://YOUR-DOMAIN/api/payment-callback
```

The Premium flow uses references beginning with `PREM-`.

## UI

The final build includes a shared premium UI system, responsive cards/forms/tables, consistent dark mode, persistent language selection, and a draggable floating EN/ID/theme control whose position is saved in local storage.

## Final checks

- All local HTML/CSS/JS references were checked.
- All JavaScript files pass `node --check`.
- No service-role key is embedded in browser code.
- Money-moving RPCs are revoked from `anon`/`authenticated` and granted to `service_role` only.
