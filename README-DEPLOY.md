# Click2Pay — Final Deployment Package

## 1. Cloudflare Pages
Upload the contents of this folder as the Pages project root. Do not nest the project one level deeper.

Required bindings/environment variables for Pages Functions:
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- DOMPETX_API_KEY
- MARKET_FEE=20

Optional if another payment integration is used:
- DOMPAY_API_KEY
- DOMPAY_BASE_URL

The browser-side Supabase anon key is in `js/database.js`; it is safe to expose only when Supabase RLS policies are enabled.

## 2. Supabase
Open SQL Editor and run:
`supabase/schema.sql`

This creates/aligns the application tables, indexes, Auth -> users trigger, profile compatibility table, RLS policies, and atomic `process_sell_payment` RPC.

## 3. Payment callback
Set the DompetX webhook/callback URL to:
`https://YOUR-DOMAIN/api/payment-callback`

## 4. Important
Never put `SUPABASE_SERVICE_KEY` or payment secrets in browser JavaScript. They belong only in Cloudflare Pages environment variables.

## 5. Default UI
The website now starts in English. Indonesian remains available in the language selector where the page has the selector.

## 6. Direct link
Ads Link redirects through:
`/s/{code}` -> `task1.html?code={code}`

Sell Link uses:
`/b/{code}` -> `buy/index.html`

Ads page:
`/a/{code}` -> `ads/index.html`
