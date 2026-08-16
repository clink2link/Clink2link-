# Click2Pay Production Pro

## Required server variables
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- DOMPETX_API_KEY
- MARKET_FEE (optional, default 20)

## Premium
- Rp100,000 / 30 days
- Ads Links: Premium users bypass the Ads interstitial
- Sell Links: Premium buyers pay 50% of listed price
- Premium is activated only by the DompetX webhook and `process_premium_payment` RPC.

## Deploy
1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Verify with `supabase/launch-check.sql`.
3. Deploy the project root to Cloudflare Pages/your static host.
4. Add server-only environment variables to the Functions runtime.
5. Configure DompetX callback to `/api/payment-callback`.
6. Test registration, Ads Link, Sell Link payment, Premium payment, admin actions and withdrawal before public launch.

Never expose SUPABASE_SERVICE_KEY in frontend JavaScript.
