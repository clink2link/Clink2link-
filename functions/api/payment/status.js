// ============================================================
// CLICK2PAY
// DOMPETX PAYMENT STATUS CHECKER
//
// GET /api/payment/status?order_id=UUID_ORDER
//
// Flow:
// 1. Ambil sell_orders dari Supabase
// 2. Ambil invoice_id/reference
// 3. Cek status transaksi ke DompetX
// 4. Jika pembayaran berhasil:
//      -> process_sell_payment(order_id)
//      -> saldo seller masuk
//      -> order menjadi paid
//
// Environment:
// DOMPETX_API_KEY
// SUPABASE_URL
// SUPABASE_SERVICE_KEY
// ============================================================
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        // =====================================================
        // ENV
        // =====================================================
        const apiKey =
            env.DOMPETX_API_KEY;
        const supabaseUrl =
            env.SUPABASE_URL;
        const supabaseKey =
            env.SUPABASE_SERVICE_KEY;
        if (!apiKey) {
            return jsonResponse({
                success: false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi di Cloudflare"
            }, 500);
        }
        if (!supabaseUrl) {
            return jsonResponse({
                success: false,
                error:
                    "SUPABASE_URL belum dikonfigurasi"
            }, 500);
        }
        if (!supabaseKey) {
            return jsonResponse({
                success: false,
                error:
                    "SUPABASE_SERVICE_KEY belum dikonfigurasi"
            }, 500);
        }
        // =====================================================
        // GET ORDER ID
        //
        // /api/payment/status?order_id=UUID
        // =====================================================
        const url =
            new URL(request.url);
        const orderId =
            String(
                url.searchParams.get(
                    "order_id"
                ) || ""
            ).trim();
        if (!orderId) {
            return jsonResponse({
                success: false,
                error:
                    "order_id wajib diisi"
            }, 400);
        }
        // =====================================================
        // GET SELL ORDER
        // =====================================================
        const orderResponse =
            await fetch(
                `${supabaseUrl}/rest/v1/sell_orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
                {
                    method: "GET",
                    headers: {
                        "apikey":
                            supabaseKey,
                        "Authorization":
                            `Bearer ${supabaseKey}`,
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        const orderText =
            await orderResponse.text();
        let orders;
        try {
            orders =
                JSON.parse(
                    orderText
                );
        } catch {
            console.error(
                "SUPABASE ORDER NON JSON:",
                orderText
            );
            return jsonResponse({
                success: false,
                error:
                    "Response Supabase bukan JSON"
            }, 502);
        }
        if (!orderResponse.ok) {
            console.error(
                "SUPABASE ORDER ERROR:",
                orders
            );
            return jsonResponse({
                success: false,
                error:
                    "Gagal mengambil sell order",
                detail:
                    orders
            }, 500);
        }
        if (
            !Array.isArray(orders) ||
            !orders.length
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Sell order tidak ditemukan"
            }, 404);
        }
        const order =
            orders[0];
        // =====================================================
        // ORDER STATUS
        //
        // Kalau sudah paid, jangan proses saldo lagi.
        // Function database juga idempotent, tetapi kita
        // hentikan lebih awal.
        // =====================================================
        const orderStatus =
            String(
                order.status || ""
            )
                .trim()
                .toLowerCase();
        if (
            [
                "paid",
                "completed",
                "success"
            ].includes(
                orderStatus
            )
        ) {
            return jsonResponse({
                success: true,
                paid: true,
                processed: true,
                message:
                    "Order sudah dibayar",
                data: {
                    order_id:
                        orderId,
                    status:
                        order.status,
                    paid_at:
                        order.paid_at || null
                }
            }, 200);
        }
        // =====================================================
        // REFERENCE
        //
        // Saat create payment kita menyimpan:
        //
        // invoice_id = CLP-{orderId}
        //
        // Jadi invoice_id adalah reference DompetX.
        // =====================================================
        const reference =
            String(
                order.invoice_id || ""
            ).trim();
        if (!reference) {
            return jsonResponse({
                success: false,
                paid: false,
                error:
                    "Order belum memiliki reference DompetX",
                data: {
                    order_id:
                        orderId,
                    status:
                        order.status
                }
            }, 409);
        }
        // =====================================================
        // TIMESTAMP
        // =====================================================
        const timestamp =
            Math.floor(
                Date.now() / 1000
            ).toString();
        // =====================================================
        // GET STATUS BY REFERENCE
        //
        // Dokumentasi DompetX:
        //
        // GET
        // /v1/payments/check-status?reference=...
        //
        // Untuk GET request, signature dibuat dengan body "{}".
        // =====================================================
        const dompetBodyString =
            "{}";
        const signatureData =
            timestamp +
            "." +
            dompetBodyString;
        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );
        const statusUrl =
            `https://api.dompetx.com/v1/payments/check-status?reference=${encodeURIComponent(reference)}`;
        console.log(
            "DOMPETX STATUS CHECK:",
            {
                orderId,
                reference
            }
        );
        const dompetResponse =
            await fetch(
                statusUrl,
                {
                    method: "GET",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "X-DOMPAY-API-Key":
                            apiKey,
                        "X-DOMPAY-Signature":
                            signature,
                        "X-DOMPAY-Timestamp":
                            timestamp
                    }
                }
            );
        const dompetText =
            await dompetResponse.text();
        let dompetData;
        try {
            dompetData =
                JSON.parse(
                    dompetText
                );
        } catch {
            console.error(
                "DOMPETX STATUS NON JSON:",
                dompetText
            );
            return jsonResponse({
                success: false,
                error:
                    "Response status DompetX bukan JSON",
                status:
                    dompetResponse.status,
                detail:
                    dompetText.substring(
                        0,
                        1000
                    )
            }, 502);
        }
        console.log(
            "DOMPETX STATUS RESPONSE:",
            dompetData
        );
        // =====================================================
        // DOMPETX HTTP ERROR
        // =====================================================
        if (!dompetResponse.ok) {
            return jsonResponse({
                success: false,
                paid: false,
                error:
                    "Gagal mengecek status pembayaran DompetX",
                status:
                    dompetResponse.status,
                detail:
                    dompetData
            }, dompetResponse.status);
        }
        // =====================================================
        // EXTRACT STATUS
        //
        // Menangani beberapa kemungkinan struktur response.
        // =====================================================
        const payment =
            dompetData.data ||
            dompetData.payment ||
            dompetData;
        const paymentStatus =
            String(
                payment.status ||
                dompetData.status ||
                ""
            )
                .trim()
                .toLowerCase();
        const paymentId =
            payment.id ||
            payment.paymentId ||
            payment.payment_id ||
            dompetData.paymentId ||
            dompetData.payment_id ||
            null;
        const paymentAmount =
            Number(
                payment.amount ||
                dompetData.amount ||
                0
            );
        const paymentReference =
            payment.reference ||
            dompetData.reference ||
            reference;
        // =====================================================
        // STATUS MAPPING
        //
        // Paid hanya kalau status DompetX benar-benar
        // menunjukkan pembayaran berhasil.
        // =====================================================
        const isPaid =
            [
                "paid",
                "success",
                "successful",
                "completed",
                "settled"
            ].includes(
                paymentStatus
            );
        // =====================================================
        // JIKA BELUM BAYAR
        // =====================================================
        if (!isPaid) {
            return jsonResponse({
                success: true,
                paid: false,
                processed: false,
                data: {
                    order_id:
                        orderId,
                    order_status:
                        order.status,
                    payment_id:
                        paymentId,
                    reference:
                        paymentReference,
                    amount:
                        paymentAmount,
                    payment_status:
                        paymentStatus
                }
            }, 200);
        }
        // =====================================================
        // VALIDASI AMOUNT
        //
        // Jangan pernah memasukkan saldo jika nominal
        // DompetX tidak sama dengan nominal order.
        // =====================================================
        const orderAmount =
            Number(
                order.price
            );
        if (
            !Number.isInteger(
                paymentAmount
            ) ||
            paymentAmount !==
                orderAmount
        ) {
            console.error(
                "DOMPETX AMOUNT MISMATCH:",
                {
                    orderId,
                    orderAmount,
                    paymentAmount,
                    paymentStatus
                }
            );
            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "Nominal pembayaran DompetX tidak sesuai dengan order",
                data: {
                    order_id:
                        orderId,
                    order_amount:
                        orderAmount,
                    payment_amount:
                        paymentAmount,
                    payment_status:
                        paymentStatus
                }
            }, 409);
        }
        // =====================================================
        // PROCESS SELL PAYMENT
        //
        // Ini akan:
        //
        // - menambah balance seller
        // - menambah sell_earning_total
        // - menambah sell_earning_month
        // - menambah sell_earning_today
        // - links.sold + 1
        // - sell_orders.status = paid
        // - paid_at = NOW()
        //
        // Function sudah menggunakan FOR UPDATE sehingga
        // aman dari double processing.
        // =====================================================
        const rpcResponse =
            await fetch(
                `${supabaseUrl}/rest/v1/rpc/process_sell_payment`,
                {
                    method: "POST",
                    headers: {
                        "apikey":
                            supabaseKey,
                        "Authorization":
                            `Bearer ${supabaseKey}`,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            p_order_id:
                                orderId
                        })
                }
            );
        const rpcText =
            await rpcResponse.text();
        let rpcData;
        try {
            rpcData =
                JSON.parse(
                    rpcText
                );
        } catch {
            console.error(
                "RPC NON JSON:",
                rpcText
            );
            return jsonResponse({
                success: false,
                paid: true,
                processed: false,
                error:
                    "Pembayaran sudah berhasil tetapi response RPC bukan JSON",
                detail:
                    rpcText
            }, 502);
        }
        console.log(
            "PROCESS SELL PAYMENT:",
            rpcData
        );
        if (!rpcResponse.ok) {
            console.error(
                "RPC PROCESS SELL PAYMENT ERROR:",
                rpcData
            );
            return jsonResponse({
                success: false,
                paid: true,
                processed: false,
                error:
                    "Pembayaran berhasil tetapi gagal memproses saldo seller",
                detail:
                    rpcData
            }, 500);
        }
        // =====================================================
        // RPC BISA MENGEMBALIKAN:
        //
        // {"success":true,"seller_receive":800}
        //
        // atau jika sebelumnya sudah diproses:
        //
        // {"success":true,"message":"Sudah diproses"}
        // =====================================================
        const processed =
            rpcData?.success === true;
        if (!processed) {
            return jsonResponse({
                success: false,
                paid: true,
                processed: false,
                error:
                    rpcData?.error ||
                    "process_sell_payment gagal",
                data: {
                    order_id:
                        orderId,
                    payment_id:
                        paymentId,
                    payment_status:
                        paymentStatus,
                    rpc:
                        rpcData
                }
            }, 500);
        }
        // =====================================================
        // SUCCESS
        // =====================================================
        return jsonResponse({
            success: true,
            paid: true,
            processed: true,
            message:
                "Pembayaran berhasil dan saldo seller telah diproses",
            data: {
                order_id:
                    orderId,
                payment_id:
                    paymentId,
                reference:
                    paymentReference,
                payment_status:
                    paymentStatus,
                amount:
                    paymentAmount,
                seller_receive:
                    rpcData?.seller_receive ||
                    null,
                rpc:
                    rpcData
            }
        }, 200);
    } catch (error) {
        console.error(
            "DOMPETX PAYMENT STATUS ERROR:",
            error
        );
        return jsonResponse({
            success: false,
            error:
                "Terjadi kesalahan server",
            message:
                error?.message ||
                "Unknown error"
        }, 500);
    }
}
// ============================================================
// HMAC-SHA256
// ============================================================
async function generateHmacSha256(
    message,
    secret
) {
    const encoder =
        new TextEncoder();
    const key =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(
                secret
            ),
            {
                name:
                    "HMAC",
                hash:
                    "SHA-256"
            },
            false,
            [
                "sign"
            ]
        );
    const signature =
        await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(
                message
            )
        );
    return Array
        .from(
            new Uint8Array(
                signature
            )
        )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
}
// ============================================================
// JSON RESPONSE
// ============================================================
function jsonResponse(
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
                    "application/json; charset=UTF-8",
                "Cache-Control":
                    "no-store"
            }
        }
    );
}
