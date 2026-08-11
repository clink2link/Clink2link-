// ============================================
// CREATE SELL ORDER
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
        const body = await request.json();
        const linkId =
            body?.link_id;
        const sellerId =
            body?.seller_id;
        const buyerId =
            body?.buyer_id || null;
        if (!linkId) {
            throw new Error(
                "link_id wajib diisi"
            );
        }
        if (!sellerId) {
            throw new Error(
                "seller_id wajib diisi"
            );
        }
        // ========================================
        // GET LINK
        // ========================================
        const links =
            await supabaseRequest(
                env,
                "links",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(linkId)}&select=*`
            );
        if (!links.length) {
            throw new Error(
                "Link tidak ditemukan"
            );
        }
        const link = links[0];
        // ========================================
        // VALIDASI LINK
        // ========================================
        if (
            link.status &&
            link.status !== "active"
        ) {
            throw new Error(
                "Link tidak aktif"
            );
        }
        // Pastikan ini memang sell link
        if (
            link.link_type &&
            link.link_type !== "sell"
        ) {
            throw new Error(
                "Link bukan Sell Link"
            );
        }
        // ========================================
        // VALIDASI SELLER
        // ========================================
        const sellers =
            await supabaseRequest(
                env,
                "profiles",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(sellerId)}&select=id`
            );
        if (!sellers.length) {
            throw new Error(
                "Seller tidak ditemukan"
            );
        }
        // ========================================
        // PASTIKAN PEMILIK LINK
        // ========================================
        const linkOwner =
            link.user_id ||
            link.seller_id ||
            link.owner_id ||
            null;
        if (
            linkOwner &&
            String(linkOwner) !== String(sellerId)
        ) {
            throw new Error(
                "Seller bukan pemilik link"
            );
        }
        // ========================================
        // HARGA
        // ========================================
        const amount =
            Number(link.price || 0);
        if (
            !Number.isFinite(amount) ||
            amount < 1000
        ) {
            throw new Error(
                "Harga link tidak valid"
            );
        }
        // Pastikan integer rupiah
        const price =
            Math.floor(amount);
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
            throw new Error(
                "MARKET_FEE tidak valid"
            );
        }
        // ========================================
        // HITUNG FEE
        // ========================================
        const fee =
            Math.floor(
                price * marketFee / 100
            );
        const sellerReceive =
            price - fee;
        if (
            sellerReceive < 0
        ) {
            throw new Error(
                "Nominal seller tidak valid"
            );
        }
        // ========================================
        // CEK ORDER PENDING SEBELUMNYA
        //
        // Kalau user menekan Bayar berkali-kali,
        // jangan membuat banyak order untuk link
        // yang sama.
        //
        // ========================================
        let pendingQuery =
            `?link_id=eq.${encodeURIComponent(linkId)}` +
            `&status=eq.pending` +
            `&select=*` +
            `&order=created_at.desc` +
            `&limit=1`;
        /*
         * Kalau ada buyer_id, kita prioritaskan
         * order milik buyer tersebut.
         */
        if (buyerId) {
            pendingQuery =
                `?link_id=eq.${encodeURIComponent(linkId)}` +
                `&buyer_id=eq.${encodeURIComponent(buyerId)}` +
                `&status=eq.pending` +
                `&select=*` +
                `&order=created_at.desc` +
                `&limit=1`;
        }
        const pendingOrders =
            await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                pendingQuery
            );
        if (
            pendingOrders.length
        ) {
            const existing =
                pendingOrders[0];
            console.log(
                "PENDING ORDER SUDAH ADA:",
                existing.id
            );
            return json({
                success: true,
                existing: true,
                data: existing
            });
        }
        // ========================================
        // CREATE ORDER
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
            "CREATING SELL ORDER:",
            orderPayload
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
            order
        );
        // ========================================
        // RESPONSE
        // ========================================
        return json({
            success: true,
            existing: false,
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
                    Number(order.price),
                fee:
                    Number(order.fee),
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
                created_at:
                    order.created_at || null
            }
        });
    } catch (error) {
        console.error(
            "CREATE SELL ORDER ERROR:",
            error
        );
        return json(
            {
                success: false,
                error:
                    error?.message ||
                    "Gagal membuat sell order"
            },
            500
        );
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
                        ? JSON.stringify(body)
                        : undefined
            }
        );
    const text =
        await response.text();
    let data = [];
    if (text) {
        try {
            data =
                JSON.parse(text);
        } catch {
            throw new Error(
                "Supabase response bukan JSON:\n" +
                text
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
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );
}
