# Click2Pay — Launch Ready

## Stack
- Static HTML/CSS/JavaScript frontend
- Supabase Auth + PostgreSQL + RLS
- Cloudflare Pages/Functions (API/payment endpoints)
- DompetX payment integration

## Launch order
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Configure Supabase Auth email settings and redirect URLs.
4. Set Cloudflare environment variables from `.env.example`.
5. Deploy the project root to Cloudflare Pages.
6. Configure the DompetX callback to `/api/payment-callback`.
7. Create the first admin account, then insert its user UUID into `public.admins`.
8. Test registration, email verification, login, Ads Link, Sell Link, payment callback and withdrawal.

## Important
Never put the Supabase service-role key in browser JavaScript. Only the anon key belongs in frontend code.
The Ads earning amount is calculated server-side by `process_ads_view`; the browser cannot choose the payout.
Do not use random CPM values in production.
