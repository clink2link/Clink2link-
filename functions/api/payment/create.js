// ============================================================
// CLICK2PAY
// DOMPETX QRIS DYNAMIC - CREATE PAYMENT
//
// POST /api/payment/create
//
// Body:
// {
//     "order_id": "UUID_ORDER"
// }
//
// Environment:
// DOMPETX_API_KEY
//
// Supabase:
// SUPABASE_URL
// SUPABASE_SERVICE_KEY
// ============================================================
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        // =====================================================
        // ENV CHECK
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
        // READ REQUEST
        // =====================================================
        let body;
        try {
            body =
                await request.json();
        } catch {
            return jsonResponse({
                success: false,
                error:
                    "Request body harus JSON"
            }, 400);
        }
        const orderId =
            String(
                body.order_id || ""
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
        //
        // IMPORTANT:
        // Harga diambil dari database.
        // Jangan percaya amount dari frontend.
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
                "SUPABASE ORDER RESPONSE:",
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
        // =====================================================
        const orderStatus =
            String(
                order.status || ""
            )
                .trim()
                .toLowerCase();
        // Jangan membuat pembayaran
        // untuk order yang sudah selesai.
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
                success: false,
                error:
                    "Order sudah dibayar"
            }, 409);
        }
        // =====================================================
        // PRICE
        // =====================================================
        const amount =
            Number(
                order.price
            );
        if (
            !Number.isInteger(amount) ||
            amount < 1000
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Harga order tidak valid"
            }, 400);
        }
        if (
            amount > 10000000
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Harga order melebihi batas QRIS"
            }, 400);
        }
        // =====================================================
        // CHECK EXISTING DOMPETX PAYMENT
        //
        // Jika order sudah memiliki invoice/payment,
        // jangan membuat transaksi baru.
        // =====================================================
        const existingReference =
            order.invoice_id ||
            null;
        if (existingReference) {
            return jsonResponse({
                success: true,
                existing: true,
                data: {
                    order_id:
                        orderId,
                    reference:
                        existingReference,
                    amount:
                        amount
                }
            });
        }
        // =====================================================
        // GENERATE DOMPETX REFERENCE
        // =====================================================
        const reference =
            `CLP-${orderId}`;
        // =====================================================
        // DOMPETX BODY
        //
        // JSON STRING INI HARUS SAMA PERSIS
        // DENGAN BODY YANG DI-SEND.
        // =====================================================
        const dompetBody = {
            method: "QRIS",
            amount:
                amount,
            currency: "IDR",
            reference:
                reference
        };
        const dompetBodyString =
            JSON.stringify(
                dompetBody
            );
        // =====================================================
        // TIMESTAMP
        // =====================================================
        const timestamp =
            Math.floor(
                Date.now() / 1000
            ).toString();
        // =====================================================
        // SIGNATURE
        //
        // timestamp + "." + body
        //
        // HMAC-SHA256
        // key = API KEY
        // =====================================================
        const signatureData =
            timestamp +
            "." +
            dompetBodyString;
        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );
        // =====================================================
        // IDEMPOTENCY
        //
        // Gunakan reference sebagai dasar.
        // =====================================================
        const idempotencyKey =
            `clp-${orderId}`;
        // =====================================================
        // CALL DOMPETX
        // =====================================================
        console.log(
            "DOMPETX CREATE:",
            {
                reference,
                amount,
                orderId
            }
        );
        const dompetResponse =
            await fetch(
                "https://api.dompetx.com/v1/payments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "X-DOMPAY-API-Key":
                            apiKey,
                        "X-DOMPAY-Signature":
                            signature,
                        "X-DOMPAY-Timestamp":
                            timestamp,
                        "Idempotency-Key":
                            idempotencyKey
                    },
                    body:
                        dompetBodyString
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
                "DOMPETX NON JSON:",
                dompetText
            );
            return jsonResponse({
                success: false,
                error:
                    "Response DompetX bukan JSON",
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
            "DOMPETX RESPONSE:",
            dompetData
        );
        // =====================================================
        // DOMPETX ERROR
        // =====================================================
        if (
            !dompetResponse.ok
        ) {
            return jsonResponse({
                success: false,
                error:
                    "DompetX menolak pembayaran",
                status:
                    dompetResponse.status,
                detail:
                    dompetData
            }, dompetResponse.status);
        }
        // =====================================================
        // EXTRACT PAYMENT ID
        //
        // Menangani beberapa kemungkinan struktur response.
        // =====================================================
        const paymentId =
            dompetData.paymentId ||
            dompetData.payment_id ||
            dompetData.id ||
            dompetData.data?.paymentId ||
            dompetData.data?.payment_id ||
            dompetData.data?.id ||
            null;
        if (!paymentId) {
            console.error(
                "DOMPETX PAYMENT ID MISSING:",
                dompetData
            );
            return jsonResponse({
                success: false,
                error:
                    "Payment ID tidak ditemukan dari DompetX",
                detail:
                    dompetData
            }, 502);
        }
        // =====================================================
        // QR IMAGE
        // =====================================================
        let qrImage =
            dompetData.qrData?.qrImage ||
            dompetData.qr_data?.qrImage ||
            dompetData.qrData?.qr_image ||
            dompetData.qr_data?.qr_image ||
            dompetData.data?.qrData?.qrImage ||
            dompetData.data?.qr_data?.qrImage ||
            dompetData.qrImage ||
            dompetData.qr_image ||
            dompetData.data?.qrImage ||
            dompetData.data?.qr_image ||
            null;
        // =====================================================
        // FALLBACK QR ENDPOINT
        //
        // Dokumentasi DompetX:
        // GET /v1/qr/{paymentId}
        // =====================================================
        if (!qrImage) {
            qrImage =
                `https://api.dompetx.com/v1/qr/${encodeURIComponent(
                    paymentId
                )}`;
        }
        // =====================================================
        // EXPIRES
        // =====================================================
        const expiresAt =
            dompetData.expiresAt ||
            dompetData.expires_at ||
            dompetData.data?.expiresAt ||
            dompetData.data?.expires_at ||
            null;
        // =====================================================
        // SAVE DOMPETX DATA INTO SELL ORDER
        //
        // Kita simpan reference ke invoice_id
        // agar order tidak membuat payment baru.
        // =====================================================
        const updateOrder = {
            invoice_id:
                reference,
            updated_at:
                new Date().toISOString()
        };
        const updateResponse =
            await fetch(
                `${supabaseUrl}/rest/v1/sell_orders?id=eq.${encodeURIComponent(orderId)}`,
                {
                    method: "PATCH",
                    headers: {
                        "apikey":
                            supabaseKey,
                        "Authorization":
                            `Bearer ${supabaseKey}`,
                        "Content-Type":
                            "application/json",
                        "Prefer":
                            "return=minimal"
                    },
                    body:
                        JSON.stringify(
                            updateOrder
                        )
                }
            );
        if (
            !updateResponse.ok
        ) {
            const updateText =
                await updateResponse.text();
            console.error(
                "SUPABASE UPDATE ORDER ERROR:",
                updateText
            );
            /*
             * Jangan membatalkan pembayaran DompetX
             * hanya karena penyimpanan lokal gagal.
             *
             * Tetapi log wajib dicatat.
             */
        }
        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================
        return jsonResponse({
            success:
                true,
            data: {
                order_id:
                    orderId,
                payment_id:
                    paymentId,
                reference:
                    reference,
                amount:
                    amount,
                currency:
                    "IDR",
                qrImage:
                    qrImage,
                qr_image_url:
                    qrImage,
                expiresAt:
                    expiresAt,
                expires_at:
                    expiresAt
            }
        }, 200);
    } catch (error) {
        console.error(
            "CREATE DOMPETX PAYMENT ERROR:",
            error
        );
        return jsonResponse({
            success:
                false,
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
