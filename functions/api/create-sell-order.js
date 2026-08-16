// ============================================
// CLICK2PAY
// CREATE SELL ORDER
// ============================================
//
// Flow:
//
// Buyer membuka Sell Link
//       ↓
// create-sell-order.js
//       ↓
// buat sell_orders status = pending
//       ↓
// create-payment.js
//       ↓
// buat reference DompetX BARU
//       ↓
// payment_link
//       ↓
// checkout DompetX
//       ↓
// webhook
//       ↓
// seller balance
//
// IMPORTANT:
// invoice_id TIDAK dibuat di sini.
// invoice_id akan diisi oleh create-payment.js
// setelah checkout DompetX berhasil dibuat.
// ============================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        // ========================================
        // ENV
        // ========================================
        if (!env.SUPABASE_URL) {
            throw new Error(
                "SUPABASE_URL belum diset"
            );
        }
        if (!env.SUPABASE_SERVICE_KEY) {
            throw new Error(
                "SUPABASE_SERVICE_KEY belum diset"
            );
        }
        // ========================================
        // REQUEST BODY
        // ========================================
        let body = {};
        try {
            body =
                await request.json();
        } catch {
            return json({
                success: false,
                error:
                    "Request JSON tidak valid"
            }, 400);
        }
        const linkId =
            body?.link_id ||
            body?.linkId ||
            null;
        const sellerId =
            body?.seller_id ||
            body?.sellerId ||
            null;
        // Buyer identity is never trusted from JSON. If the buyer is
        // logged in, derive the UUID from the Supabase access token.
        // Anonymous buyers remain supported with buyer_id = null.
        let buyerId = null;
        const authHeader = request.headers.get("Authorization") || "";
        if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.slice(7).trim();
            try {
                const authRes = await fetch(
                    `${env.SUPABASE_URL}/auth/v1/user`,
                    { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` } }
                );
                const authUser = await authRes.json().catch(() => null);
                if (authRes.ok && authUser?.id) buyerId = authUser.id;
            } catch (_) {}
        }
        if (!linkId) {
            return json({
                success: false,
                error:
                    "link_id wajib diisi"
            }, 400);
        }
        if (!sellerId) {
            return json({
                success: false,
                error:
                    "seller_id wajib diisi"
            }, 400);
        }
        console.log(
            "================================"
        );
        console.log(
            "CREATE SELL ORDER"
        );
        console.log({
            link_id:
                linkId,
            seller_id:
                sellerId,
            buyer_id:
                buyerId
        });
        console.log(
            "================================"
        );
        // ========================================
        // GET LINK
        // ========================================
        const links =
            await supabaseRequest(
                env,
                "links",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(
                    linkId
                )}&select=*`
            );
        if (!links.length) {
            return json({
                success: false,
                error:
                    "Link tidak ditemukan"
            }, 404);
        }
        const link =
            links[0];
        // ========================================
        // VALIDATE LINK STATUS
        // ========================================
        if (
            link.status &&
            String(link.status)
                .toLowerCase() !== "active"
        ) {
            return json({
                success: false,
                error:
                    "Link tidak aktif"
            }, 400);
        }
        // ========================================
        // VALIDATE SELL LINK
        // ========================================
        if (
            link.link_type &&
            String(link.link_type)
                .toLowerCase() !== "sell"
        ) {
            return json({
                success: false,
                error:
                    "Link bukan Sell Link"
            }, 400);
        }
        // ========================================
        // VALIDATE SELLER
        // ========================================
        const sellers =
            await supabaseRequest(
                env,
                "profiles",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(
                    sellerId
                )}&select=id`
            );
        if (!sellers.length) {
            return json({
                success: false,
                error:
                    "Seller tidak ditemukan"
            }, 404);
        }
        // ========================================
        // VERIFY LINK OWNER
        // ========================================
        const linkOwner =
            link.user_id ||
            link.seller_id ||
            link.owner_id ||
            null;
        if (
            linkOwner &&
            String(linkOwner) !==
            String(sellerId)
        ) {
            return json({
                success: false,
                error:
                    "Seller bukan pemilik link"
            }, 403);
        }
        // ========================================
        // PRICE
        // ========================================
        const rawPrice =
            Number(link.price || 0);
        if (
            !Number.isFinite(rawPrice) ||
            rawPrice < 1000
        ) {
            return json({
                success: false,
                error:
                    "Harga link tidak valid"
            }, 400);
        }
        const originalPrice =
            Math.floor(rawPrice);

        // Premium buyers receive 50% off the listed Sell Link price.
        // The Premium state is read from the database, never from the client.
        let discountPercent = 0;
        let price = originalPrice;
        if (buyerId) {
            const premiumRows = await supabaseRequest(
                env,
                "users",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(buyerId)}&select=is_premium,premium_expires_at`
            );
            const premium = premiumRows?.[0];
            const premiumActive =
                premium?.is_premium === true &&
                premium?.premium_expires_at &&
                new Date(premium.premium_expires_at).getTime() > Date.now();
            if (premiumActive) {
                discountPercent = 50;
                price = Math.max(1000, Math.floor(originalPrice * 0.5));
            }
        }

        // ========================================
        // MARKET FEE
        // ========================================
        const marketFee =
            Number(
                env.MARKET_FEE ?? 20
            );
        if (
            !Number.isFinite(marketFee) ||
            marketFee < 0 ||
            marketFee > 100
        ) {
            return json({
                success: false,
                error:
                    "MARKET_FEE tidak valid"
            }, 500);
        }
        // ========================================
        // CALCULATE FEE
        // ========================================
        const fee =
            Math.floor(
                price *
                marketFee /
                100
            );
        const sellerReceive =
            price -
            fee;
        if (
            sellerReceive < 0
        ) {
            return json({
                success: false,
                error:
                    "Nominal seller tidak valid"
            }, 500);
        }
        // ========================================
        // FIND EXISTING PENDING ORDER
        // ========================================
        //
        // Jika buyer_id tersedia:
        //
        // cari order pending milik buyer
        // untuk link tersebut.
        //
        // Jika buyer_id tidak tersedia:
        //
        // kita TIDAK menggunakan pending order
        // milik buyer lain.
        // ========================================
        let pendingOrders = [];
        if (buyerId) {
            const pendingQuery =
                `?link_id=eq.${encodeURIComponent(
                    linkId
                )}` +
                `&seller_id=eq.${encodeURIComponent(
                    sellerId
                )}` +
                `&buyer_id=eq.${encodeURIComponent(
                    buyerId
                )}` +
                `&status=eq.pending` +
                `&select=*` +
                `&order=created_at.desc` +
                `&limit=1`;
            pendingOrders =
                await supabaseRequest(
                    env,
                    "sell_orders",
                    "GET",
                    null,
                    pendingQuery
                );
        }
        // ========================================
        // REUSE PENDING ORDER
        // ========================================
        if (
            pendingOrders.length
        ) {
            const existing =
                pendingOrders[0];
            console.log(
                "PENDING ORDER DITEMUKAN:",
                existing.id
            );
            // ====================================
            // CHECK PRICE
            //
            // Kalau harga berubah setelah order
            // dibuat, jangan menggunakan order
            // lama.
            // ====================================
            if (
                Number(existing.price) ===
                price
            ) {
                return json({
                    success:
                        true,
                    existing:
                        true,
                    data: {
                        id:
                            existing.id,
                        link_id:
                            existing.link_id,
                        seller_id:
                            existing.seller_id,
                        buyer_id:
                            existing.buyer_id,
                        price:
                            Number(
                                existing.price
                            ),
                        fee:
                            Number(
                                existing.fee
                            ),
                        seller_receive:
                            Number(
                                existing.seller_receive
                            ),
                        status:
                            existing.status,
                        balance_processed:
                            Boolean(
                                existing.balance_processed
                            ),
                        invoice_id:
                            existing.invoice_id ||
                            null,
                        payment_id:
                            existing.payment_id ||
                            null,
                        payment_link:
                            existing.payment_link ||
                            null,
                        created_at:
                            existing.created_at ||
                            null
                    }
                });
            }
        }
        // ========================================
        // CREATE NEW ORDER
        // ========================================
        const orderPayload = {
            link_id:
                linkId,
            seller_id:
                sellerId,
            buyer_id:
                buyerId,
            price:
                price,
            original_price:
                originalPrice,
            discount_percent:
                discountPercent,
            fee:
                fee,
            seller_receive:
                sellerReceive,
            status:
                "pending",
            balance_processed:
                false
        };
        console.log(
            "CREATING SELL ORDER:"
        );
        console.log(
            JSON.stringify(
                orderPayload,
                null,
                2
            )
        );
        const created =
            await supabaseRequest(
                env,
                "sell_orders",
                "POST",
                orderPayload
            );
        if (
            !Array.isArray(created) ||
            !created.length
        ) {
            throw new Error(
                "Order gagal dibuat"
            );
        }
        const order =
            created[0];
        console.log(
            "SELL ORDER CREATED:",
            JSON.stringify(
                order,
                null,
                2
            )
        );
        // ========================================
        // RESPONSE
        // ========================================
        return json({
            success:
                true,
            existing:
                false,
            data: {
                id:
                    order.id,
                link_id:
                    order.link_id,
                seller_id:
                    order.seller_id,
                buyer_id:
                    order.buyer_id,
                price:
                    Number(
                        order.price
                    ),
                fee:
                    Number(
                        order.fee
                    ),
                seller_receive:
                    Number(
                        order.seller_receive
                    ),
                status:
                    order.status,
                balance_processed:
                    Boolean(
                        order.balance_processed
                    ),
                // Belum ada sampai
                // create-payment.js berhasil
                invoice_id:
                    order.invoice_id ||
                    null,
                payment_id:
                    order.payment_id ||
                    null,
                payment_link:
                    order.payment_link ||
                    null,
                created_at:
                    order.created_at ||
                    null
            }
        }, 200);
    } catch (error) {
        console.error(
            "================================"
        );
        console.error(
            "CREATE SELL ORDER ERROR:"
        );
        console.error(
            error
        );
        console.error(
            "================================"
        );
        return json({
            success:
                false,
            error:
                error?.message ||
                "Gagal membuat sell order"
        }, 500);
    }
}
// ============================================
// SUPABASE REQUEST
// ============================================
async function supabaseRequest(
    env,
    table,
    method = "GET",
    body = null,
    query = ""
) {
    const url =
        `${env.SUPABASE_URL}/rest/v1/${table}${query}`;
    const response =
        await fetch(
            url,
            {
                method,
                headers: {
                    apikey:
                        env.SUPABASE_SERVICE_KEY,
                    Authorization:
                        `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                    "Content-Type":
                        "application/json",
                    Prefer:
                        "return=representation"
                },
                body:
                    body !== null
                        ? JSON.stringify(
                            body
                        )
                        : undefined
            }
        );
    const text =
        await response.text();
    let data = [];
    if (text) {
        try {
            data =
                JSON.parse(
                    text
                );
        } catch {
            throw new Error(
                "Supabase response bukan JSON:\n" +
                text.slice(
                    0,
                    2000
                )
            );
        }
    }
    if (!response.ok) {
        throw new Error(
            `Supabase HTTP ${response.status}: ` +
            JSON.stringify(
                data,
                null,
                2
            )
        );
    }
    return data;
}
// ============================================
// JSON RESPONSE
// ============================================
function json(
    data,
    status = 200
) {
    return new Response(
        JSON.stringify(
            data
        ),
        {
            status,
            headers: {
                "Content-Type":
                    "application/json",
                "Cache-Control":
                    "no-store"
            }
        }
    );
}
