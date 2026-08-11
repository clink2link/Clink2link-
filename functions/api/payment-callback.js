// ==========================================
// DOMPETX WEBHOOK - SELL LINK
// ==========================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        // ==========================================
        // READ WEBHOOK
        // ==========================================
        const body = await request.json();
        console.log("=================================");
        console.log("DOMPETX WEBHOOK RECEIVED");
        console.log(JSON.stringify(body, null, 2));
        console.log("=================================");
        // ==========================================
        // VALIDATE PAYLOAD
        // ==========================================
        const data = body?.data;
        if (!data) {
            console.error("DOMPETX DATA TIDAK ADA");
            // Tetap 200 agar DompetX tidak retry
            return json({
                success: true,
                message: "Payload diterima tetapi data kosong"
            });
        }
        const paymentId =
            data.id ||
            body.paymentId ||
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
        const eventType =
            body.eventType ||
            null;
        console.log("DOMPETX PAYMENT:", {
            paymentId,
            reference,
            amount,
            status,
            eventType
        });
        // ==========================================
        // REFERENCE WAJIB ADA
        // ==========================================
        if (!reference) {
            console.error(
                "REFERENCE DOMPETX TIDAK ADA"
            );
            return json({
                success: true,
                message: "Reference tidak ditemukan"
            });
        }
        // ==========================================
        // HANYA PROSES PAYMENT
        // ==========================================
        if (
            status !== "paid" &&
            status !== "success" &&
            status !== "completed" &&
            status !== "settlement"
        ) {
            console.log(
                "PAYMENT BELUM PAID:",
                status
            );
            return json({
                success: true,
                message: "Payment belum paid",
                status
            });
        }
        // ==========================================
        // FIND SELL ORDER
        // ==========================================
        const orders =
            await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?invoice_id=eq.${encodeURIComponent(reference)}&select=*`
            );
        if (!orders.length) {
            console.error(
                "ORDER TIDAK DITEMUKAN:",
                reference
            );
            // Jangan terus retry kalau reference
            // memang tidak ada di database.
            return json({
                success: true,
                message: "Order tidak ditemukan",
                reference
            });
        }
        let order = orders[0];
        console.log(
            "SELL ORDER FOUND:",
            order
        );
        // ==========================================
        // ANTI DOUBLE PAYMENT
        // ==========================================
        if (
            order.status === "paid" &&
            order.balance_processed === true
        ) {
            console.log(
                "ORDER SUDAH DIPROSES:",
                order.id
            );
            return json({
                success: true,
                message: "Order sudah diproses",
                order_id: order.id
            });
        }
        // ==========================================
        // VALIDATE AMOUNT
        // ==========================================
        const orderAmount =
            Number(order.price || 0);
        if (
            amount > 0 &&
            orderAmount > 0 &&
            amount !== orderAmount
        ) {
            console.error(
                "NOMINAL TIDAK SESUAI",
                {
                    webhook_amount: amount,
                    order_amount: orderAmount,
                    order_id: order.id
                }
            );
            return json({
                success: false,
                error: "Nominal pembayaran tidak sesuai"
            }, 400);
        }
        // ==========================================
        // UPDATE PAYMENT INFORMATION
        // ==========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                status: "paid",
                payment_id:
                    paymentId ||
                    order.payment_id ||
                    null,
                paid_at:
                    new Date().toISOString()
            },
            `?id=eq.${encodeURIComponent(order.id)}`
        );
        console.log(
            "ORDER STATUS UPDATED: PAID"
        );
        // ==========================================
        // GET SELLER
        // ==========================================
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
                "User seller tidak ditemukan"
            );
        }
        const seller =
            sellers[0];
        // ==========================================
        // SELLER RECEIVE
        // ==========================================
        const receive =
            Number(
                order.seller_receive || 0
            );
        if (
            !Number.isFinite(receive) ||
            receive < 0
        ) {
            throw new Error(
                "seller_receive tidak valid"
            );
        }
        // ==========================================
        // CHECK BALANCE PROCESSED
        // ==========================================
        if (
            order.balance_processed === true
        ) {
            console.log(
                "SALDO SUDAH DIPROSES"
            );
            return json({
                success: true,
                message: "Saldo seller sudah diproses",
                order_id: order.id
            });
        }
        // ==========================================
        // CALCULATE BALANCE
        // ==========================================
        const newBalance =
            Number(seller.balance || 0)
            + receive;
        const newSellTotal =
            Number(
                seller.sell_earning_total || 0
            )
            + receive;
        const newSellMonth =
            Number(
                seller.sell_earning_month || 0
            )
            + receive;
        const newSellToday =
            Number(
                seller.sell_earning_today || 0
            )
            + receive;
        // ==========================================
        // UPDATE SELLER BALANCE
        // ==========================================
        await supabaseRequest(
            env,
            "profiles",
            "PATCH",
            {
                balance:
                    newBalance,
                sell_earning_total:
                    newSellTotal,
                sell_earning_month:
                    newSellMonth,
                sell_earning_today:
                    newSellToday
            },
            `?id=eq.${encodeURIComponent(order.seller_id)}`
        );
        console.log(
            "SELLER BALANCE UPDATED:",
            {
                seller_id:
                    order.seller_id,
                receive,
                balance:
                    newBalance,
                sell_earning_total:
                    newSellTotal,
                sell_earning_month:
                    newSellMonth,
                sell_earning_today:
                    newSellToday
            }
        );
        // ==========================================
        // LOCK BALANCE PROCESSED
        // ==========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                balance_processed:
                    true
            },
            `?id=eq.${encodeURIComponent(order.id)}`
        );
        // ==========================================
        // GET DESTINATION URL
        // ==========================================
        let destinationUrl = null;
        const links =
            await supabaseRequest(
                env,
                "links",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(order.link_id)}&select=destination_url,destination,url`
            );
        if (links.length) {
            const link =
                links[0];
            destinationUrl =
                link.destination_url ||
                link.destination ||
                link.url ||
                null;
        }
        // ==========================================
        // SUCCESS
        // ==========================================
        console.log(
            "================================="
        );
        console.log(
            "DOMPETX SELL PAYMENT SUCCESS"
        );
        console.log({
            order_id:
                order.id,
            payment_id:
                paymentId,
            reference,
            seller_id:
                order.seller_id,
            receive,
            balance:
                newBalance,
            destination_url:
                destinationUrl
        });
        console.log(
            "================================="
        );
        // ==========================================
        // DOMPETX WAJIB MENERIMA HTTP 200
        // ==========================================
        return json({
            success: true,
            message: "Pembayaran berhasil diproses",
            data: {
                order_id:
                    order.id,
                payment_id:
                    paymentId,
                invoice_id:
                    reference,
                status:
                    "paid",
                seller_id:
                    order.seller_id,
                receive,
                balance:
                    newBalance,
                destination_url:
                    destinationUrl
            }
        });
    } catch (error) {
        console.error(
            "================================="
        );
        console.error(
            "DOMPETX WEBHOOK ERROR:"
        );
        console.error(error);
        console.error(
            "================================="
        );
        /*
         * Untuk error internal, return 500.
         *
         * DompetX akan retry webhook sampai
         * maksimal 5 kali sesuai dokumentasi.
         */
        return json({
            success: false,
            error:
                error?.message ||
                "Webhook error"
        }, 500);
    }
}
// ==========================================
// SUPABASE REQUEST
// ==========================================
async function supabaseRequest(
    env,
    table,
    method = "GET",
    body = null,
    query = ""
) {
    const response =
        await fetch(
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
                    body
                        ? JSON.stringify(body)
                        : undefined
            }
        );
    const text =
        await response.text();
    let data = [];
    try {
        data =
            text
                ? JSON.parse(text)
                : [];
    } catch {
        throw new Error(
            "Response Supabase bukan JSON: " +
            text
        );
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
// ==========================================
// JSON RESPONSE
// ==========================================
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
