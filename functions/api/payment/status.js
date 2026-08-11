// ============================================================
// CLICK2PAY
// DOMPETX PAYMENT STATUS
//
// GET /api/payment/status?order_id=UUID_ORDER
//
// Fungsi:
// - Ambil sell_orders dari Supabase
// - Ambil invoice/reference DompetX
// - Cek status payment ke DompetX
// - Mengembalikan status pembayaran
//
// BELUM mengubah saldo seller.
// BELUM menyelesaikan order.
// Itu kita kerjakan di langkah berikutnya setelah status
// checking ini terbukti bekerja.
// ============================================================
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        // =====================================================
        // ENV
        // =====================================================
        const apiKey = env.DOMPETX_API_KEY;
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_KEY;
        if (!apiKey) {
            return jsonResponse({
                success: false,
                error: "DOMPETX_API_KEY belum dikonfigurasi"
            }, 500);
        }
        if (!supabaseUrl) {
            return jsonResponse({
                success: false,
                error: "SUPABASE_URL belum dikonfigurasi"
            }, 500);
        }
        if (!supabaseKey) {
            return jsonResponse({
                success: false,
                error: "SUPABASE_SERVICE_KEY belum dikonfigurasi"
            }, 500);
        }
        // =====================================================
        // READ ORDER ID
        // =====================================================
        const url = new URL(request.url);
        const orderId = String(
            url.searchParams.get("order_id") || ""
        ).trim();
        if (!orderId) {
            return jsonResponse({
                success: false,
                error: "order_id wajib diisi"
            }, 400);
        }
        // =====================================================
        // GET SELL ORDER
        // =====================================================
        const orderResponse = await fetch(
            `${supabaseUrl}/rest/v1/sell_orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
            {
                method: "GET",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json"
                }
            }
        );
        const orderText = await orderResponse.text();
        let orders;
        try {
            orders = JSON.parse(orderText);
        } catch {
            console.error(
                "SUPABASE ORDER NON JSON:",
                orderText
            );
            return jsonResponse({
                success: false,
                error: "Response Supabase bukan JSON"
            }, 502);
        }
        if (!orderResponse.ok) {
            console.error(
                "SUPABASE ORDER ERROR:",
                orders
            );
            return jsonResponse({
                success: false,
                error: "Gagal mengambil sell order",
                detail: orders
            }, 500);
        }
        if (
            !Array.isArray(orders) ||
            !orders.length
        ) {
            return jsonResponse({
                success: false,
                error: "Sell order tidak ditemukan"
            }, 404);
        }
        const order = orders[0];
        // =====================================================
        // ORDER STATUS LOKAL
        // =====================================================
        const localStatus = String(
            order.status || ""
        )
            .trim()
            .toLowerCase();
        // Kalau database sudah paid,
        // tidak perlu request ulang ke DompetX.
        if (
            [
                "paid",
                "completed",
                "success"
            ].includes(localStatus)
        ) {
            return jsonResponse({
                success: true,
                paid: true,
                status: "paid",
                source: "database",
                order: {
                    id: order.id,
                    status: order.status,
                    price: order.price
                }
            });
        }
        // =====================================================
        // GET DOMPETX REFERENCE
        // =====================================================
        const reference = String(
            order.invoice_id || ""
        ).trim();
        if (!reference) {
            return jsonResponse({
                success: true,
                paid: false,
                status: "pending",
                message:
                    "Order belum memiliki reference DompetX",
                order: {
                    id: order.id,
                    status: order.status,
                    price: order.price
                }
            });
        }
        // =====================================================
        // PAYMENT ID
        //
        // Kalau nanti create payment menyimpan payment_id
        // di kolom terpisah, kode ini otomatis bisa digunakan.
        //
        // Untuk sementara kita coba beberapa kemungkinan
        // nama kolom.
        // =====================================================
        const paymentId =
            order.payment_id ||
            order.dompetx_payment_id ||
            order.paymentId ||
            null;
        // =====================================================
        // DOMPETX STATUS URL
        //
        // Prioritas:
        // 1. payment ID
        // 2. reference
        //
        // Dokumentasi status endpoint DompetX dapat berbeda
        // berdasarkan versi API. Kita coba payment ID dahulu.
        // =====================================================
        let statusUrl;
        if (paymentId) {
            statusUrl =
                `https://api.dompetx.com/v1/payments/${encodeURIComponent(
                    paymentId
                )}`;
        } else {
            statusUrl =
                `https://api.dompetx.com/v1/payments/${encodeURIComponent(
                    reference
                )}`;
        }
        // =====================================================
        // TIMESTAMP
        // =====================================================
        const timestamp = Math.floor(
            Date.now() / 1000
        ).toString();
        // =====================================================
        // SIGNATURE
        //
        // Untuk GET:
        //
        // timestamp + "." + path
        //
        // =====================================================
        const requestPath =
            new URL(statusUrl).pathname;
        const signatureData =
            timestamp +
            "." +
            requestPath;
        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );
        // =====================================================
        // CALL DOMPETX
        // =====================================================
        console.log(
            "DOMPETX STATUS CHECK:",
            {
                orderId,
                reference,
                paymentId,
                statusUrl
            }
        );
        const dompetResponse =
            await fetch(
                statusUrl,
                {
                    method: "GET",
                    headers: {
                        "X-DOMPAY-API-Key":
                            apiKey,
                        "X-DOMPAY-Signature":
                            signature,
                        "X-DOMPAY-Timestamp":
                            timestamp,
                        "Accept":
                            "application/json"
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
        // DOMPETX ERROR
        // =====================================================
        if (!dompetResponse.ok) {
            return jsonResponse({
                success: false,
                error:
                    "Gagal mengecek status DompetX",
                status:
                    dompetResponse.status,
                detail:
                    dompetData
            }, dompetResponse.status);
        }
        // =====================================================
        // EXTRACT STATUS
        // =====================================================
        const rawStatus =
            dompetData.status ||
            dompetData.payment_status ||
            dompetData.paymentStatus ||
            dompetData.data?.status ||
            dompetData.data?.payment_status ||
            dompetData.data?.paymentStatus ||
            "";
        const paymentStatus =
            String(
                rawStatus
            )
                .trim()
                .toLowerCase();
        // =====================================================
        // NORMALIZE STATUS
        // =====================================================
        let normalizedStatus = "pending";
        let paid = false;
        if (
            [
                "paid",
                "success",
                "successful",
                "completed",
                "settled"
            ].includes(
                paymentStatus
            )
        ) {
            normalizedStatus = "paid";
            paid = true;
        } else if (
            [
                "expired",
                "expire"
            ].includes(
                paymentStatus
            )
        ) {
            normalizedStatus = "expired";
        } else if (
            [
                "failed",
                "failure",
                "cancelled",
                "canceled",
                "rejected"
            ].includes(
                paymentStatus
            )
        ) {
            normalizedStatus = "failed";
        } else {
            normalizedStatus = "pending";
        }
        // =====================================================
        // IMPORTANT
        //
        // DI LANGKAH INI KITA BELUM UPDATE DATABASE.
        //
        // Tujuannya hanya memastikan API DompetX dapat
        // memberikan status pembayaran dengan benar.
        // =====================================================
        return jsonResponse({
            success: true,
            paid: paid,
            status:
                normalizedStatus,
            dompetx_status:
                paymentStatus || null,
            order: {
                id:
                    order.id,
                status:
                    order.status,
                price:
                    order.price,
                reference:
                    reference,
                payment_id:
                    paymentId
            },
            dompetx:
                dompetData
        }, 200);
    } catch (error) {
        console.error(
            "DOMPETX STATUS ERROR:",
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
            encoder.encode(secret),
            {
                name: "HMAC",
                hash: "SHA-256"
            },
            false,
            ["sign"]
        );
    const signature =
        await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(message)
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
                    .padStart(2, "0")
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
        JSON.stringify(data),
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
