# Click2Pay Production PRO — Fixed & Premium Upgrade

## Yang sudah diperbaiki

- Satu master design system premium untuk seluruh halaman.
- Light/dark mode tetap kompatibel dengan sistem lama.
- Flow shortlink diperbaiki:
  `/s/CODE` → `task1.html` → `task2.html` → `task3.html` → `final.html`.
- Bug link `2.html` / `3.html` yang tidak tersedia dihapus.
- Ads view + earning diproses atomik di PostgreSQL.
- Duplicate Ads View dicegah di database, bukan hanya JavaScript.
- Fingerprint visitor disimpan sebagai SHA-256, bukan IP mentah.
- CPM dibaca server-side; client tidak dapat menentukan earning.
- Self-view owner tidak dianggap view monetized ketika request membawa session user.
- Withdrawal tidak lagi memakai data dummy/local history.
- Withdrawal sekarang melakukan reserve saldo atomik di database.
- Reject/cancel withdraw mengembalikan saldo secara atomik.
- Approve payout admin menggunakan RPC dan tidak boleh diproses dua kali.
- Premium instant withdrawal limit dan fee dihitung server-side.
- `links` dilengkapi kolom yang memang dipakai frontend (`alias`, campaign, device, expiry, dll).
- Payment method dibuat satu record per user.
- Referral dibuat satu kali per referred user.
- Sell settlement menggunakan nilai `fee` dan `seller_receive` yang sudah dikunci pada order, sehingga tidak bentrok dengan `MARKET_FEE` dan Premium discount.
- Idempotency sell payment tetap dipertahankan.
- Profile mirror disinkronkan kembali dari `users`.

## Database deployment

1. Backup database Supabase terlebih dahulu.
2. Jalankan `supabase/production-upgrade.sql` di Supabase SQL Editor.
3. Jika memakai database fresh, `supabase/schema.sql` sudah memuat upgrade production.
4. Jalankan `supabase/production-verification.sql`.
5. Pastikan Cloudflare Pages memiliki:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DOMPETX_API_KEY` jika payment DompetX digunakan
   - `DOMPETX_API_SECRET` jika endpoint terkait memerlukannya
   - `MARKET_FEE`
6. Deploy seluruh folder hasil upgrade ke Cloudflare Pages.

## Catatan payout

Withdrawal sekarang benar-benar tercatat dan saldo user dicadangkan secara atomik. Status `paid` berarti admin/sistem payout sudah benar-benar mengonfirmasi transfer. Jangan menampilkan "otomatis" kepada user sebelum provider payout bank/e-wallet benar-benar terhubung.

## Smoke test minimum

- Register/login.
- Buat Ads Link.
- Buka `/s/KODE` sebagai visitor.
- Selesaikan tiga task.
- Pastikan `/final.html` memanggil `/api/ads/view`.
- Pastikan satu fingerprint tidak menghasilkan earning kedua dalam 24 jam.
- Buat Sell Link dan test order.
- Test payment callback/status.
- Ajukan withdraw.
- Pastikan balance berkurang sekali dan history muncul dari database.
- Admin reject → balance kembali.
- Admin paid → status paid tanpa debit kedua.
