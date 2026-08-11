// ============================================
// DOMPETX WEBHOOK
// ============================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        console.log("================================");
        console.log("DOMPETX WEBHOOK");
        console.log(JSON.stringify(body, null, 2));
        console.log("================================");
        // ========================================
        // VALIDASI PAYLOAD DOMPETX
        // ========================================
        const data = body?.data;
        if (!data) {
            console.error("Webhook data tidak ada");
            // Tetap 200 agar DompetX tidak retry
            return json({
                success: true,
                message: "Webhook diterima, data kosong"
            });
        }
        const paymentId =
            body.paymentId ||
            data.id ||
            data.paymentId ||
            null;
        const reference =
            data.reference ||
            null;
        const amount =
            Number(data.amount || 0);
        const status =
            String(data.status || "")
                .trim()
                .toLowerCase();
        console.log("PAYMENT ID :", paymentId);
        console.log("REFERENCE  :", reference);
        console.log("AMOUNT     :", amount);
        console.log("STATUS     :", status);
        // ========================================
        // HANYA PROSES EVENT DEPOSIT
        // ========================================
        if (
            body.eventType &&
            body.eventType !== "deposit"
        ) {
            return json({
                success: true,
                message: "Event diabaikan"
            });
        }
        // ========================================
        // REFERENCE WAJIB
        // ========================================
        if (!reference) {
            console.error(
                "Reference pembayaran tidak ditemukan"
            );
            return json({
                success: true,
                message: "Reference tidak ditemukan"
            });
        }
        // ========================================
        // CARI ORDER BERDASARKAN INVOICE
        //
        // Reference yang kita buat sebelumnya:
        //
        // SELL-{order_id}-{timestamp}
        //
        // ========================================
        const orders = await supabaseRequest(
            env,
            "sell_orders",
            "GET",
            null,
            `?invoice_id=eq.${encodeURIComponent(reference)}&select=*`
        );
        if (!orders.length) {
            console.error(
                "Order tidak ditemukan:",
                reference
            );
            // PENTING:
            // Jangan 500 agar DompetX tidak retry
            return json({
                success: true,
                message: "Order belum ditemukan",
                reference
            });
        }
        const order = orders[0];
        console.log(
            "ORDER FOUND:",
            order.id
        );
        // ========================================
        // SUDAH DIPROSES
        // ========================================
        if (
            order.status === "paid" &&
            order.balance_processed === true
        ) {
            return json({
                success: true,
                message: "Pembayaran sudah diproses",
                order_id: order.id
            });
        }
        // ========================================
        // STATUS BELUM PAID
        // ========================================
        if (status !== "paid") {
            console.log(
                "PAYMENT BELUM PAID:",
                status
            );
            return json({
                success: true,
                message: "Pembayaran belum paid",
                order_id: order.id,
                status
            });
        }
        // ========================================
        // VALIDASI NOMINAL
        // ========================================
        const orderAmount =
            Number(order.price || 0);
        if (
            amount > 0 &&
            amount !== orderAmount
        ) {
            console.error(
                "NOMINAL TIDAK SESUAI",
                {
                    webhook_amount: amount,
                    order_amount: orderAmount
                }
            );
            return json({
                success: true,
                message: "Nominal pembayaran tidak sesuai"
            });
        }
        // ========================================
        // UPDATE ORDER PAID
        // ========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                status: "paid",
                paid_at:
                    new Date().toISOString()
            },
            `?id=eq.${encodeURIComponent(order.id)}`
        );
        // ========================================
        // GET SELLER
        // ========================================
        const sellers =
            await supabaseRequest(
                env,
                "profiles",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(order.seller_id)}&select=id,balance,sell_earning_total,sell_earning_month,sell_earning_today`
            );
        if (!sellers.length) {
            throw new Error(
                "Seller tidak ditemukan"
            );
        }
        const seller = sellers[0];
        // ========================================
        // HITUNG SALDO SELLER
        // ========================================
        const receive =
            Number(order.seller_receive || 0);
        const balance =
            Number(seller.balance || 0);
        const total =
            Number(
                seller.sell_earning_total || 0
            );
        const month =
            Number(
                seller.sell_earning_month || 0
            );
        const today =
            Number(
                seller.sell_earning_today || 0
            );
        const newBalance =
            balance + receive;
        const newTotal =
            total + receive;
        const newMonth =
            month + receive;
        const newToday =
            today + receive;
        // ========================================
        // UPDATE SALDO SELLER
        // ========================================
        await supabaseRequest(
            env,
            "profiles",
            "PATCH",
            {
                balance: newBalance,
                sell_earning_total: newTotal,
                sell_earning_month: newMonth,
                sell_earning_today: newToday
            },
            `?id=eq.${encodeURIComponent(order.seller_id)}`
        );
        // ========================================
        // LOCK ANTI DOUBLE
        // ========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                balance_processed: true
            },
            `?id=eq.${encodeURIComponent(order.id)}`
        );
        console.log(
            "================================"
        );
        console.log(
            "DOMPETX PAYMENT BERHASIL"
        );
        console.log({
            order_id: order.id,
            payment_id: paymentId,
            reference,
            amount,
            seller_id: order.seller_id,
            receive,
            balance: newBalance
        });
        console.log(
            "================================"
        );
        // ========================================
        // WAJIB 200
        // ========================================
        return json({
            success: true,
            message: "Webhook berhasil diproses",
            data: {
                order_id: order.id,
                payment_id: paymentId,
                reference,
                status: "paid"
            }
        });
    } catch (error) {
        console.error(
            "DOMPETX WEBHOOK ERROR:",
            error
        );
        /*
         * Kalau error internal, 500 membuat DompetX
         * melakukan retry sesuai dokumentasinya.
         */
        return json(
            {
                success: false,
                error:
                    error?.message ||
                    "Webhook error"
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
    const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/${table}${query}`,
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
            data = JSON.parse(text);
        } catch {
            throw new Error(
                "Response Supabase bukan JSON: " +
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
