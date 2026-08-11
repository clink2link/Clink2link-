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
// Cloudflare Environment:
// DOMPETX_API_KEY
// SUPABASE_URL
// SUPABASE_SERVICE_KEY
// ============================================================
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        // =====================================================
        // ENV
        // =====================================================
        const apiKey =
            String(env.DOMPETX_API_KEY || "").trim();
        const supabaseUrl =
            String(env.SUPABASE_URL || "").trim();
        const supabaseKey =
            String(env.SUPABASE_SERVICE_KEY || "").trim();
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
                body?.order_id || ""
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
        // Harga selalu dari database.
        // Jangan percaya amount dari frontend.
        // =====================================================
        const orderUrl =
            `${supabaseUrl}/rest/v1/sell_orders` +
            `?id=eq.${encodeURIComponent(orderId)}` +
            `&select=*`;
        const orderResponse =
            await fetch(
                orderUrl,
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
            orders.length === 0
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
        if (
            [
                "paid",
                "completed",
                "success",
                "settlement"
            ].includes(
                orderStatus
            )
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Order sudah dibayar",
                order_status:
                    order.status
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
            !Number.isInteger(amount)
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Harga order harus berupa angka bulat"
            }, 400);
        }
        if (
            amount < 1000
        ) {
            return jsonResponse({
                success: false,
                error:
                    "Harga minimum QRIS adalah Rp1.000"
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
        // REFERENCE
        //
        // Satu reference untuk satu sell order.
        // =====================================================
        const reference =
            order.invoice_id
                ? String(order.invoice_id)
                : `CLP-${orderId}`;
        // =====================================================
        // EXISTING PAYMENT
        //
        // Kalau sebelumnya sudah ada payment_id,
        // jangan membuat transaksi DompetX baru.
        // =====================================================
        const existingPaymentId =
            order.payment_id ||
            order.dompetx_payment_id ||
            null;
        if (
            existingPaymentId &&
            order.invoice_id
        ) {
            const existingQr =
                `https://api.dompetx.com/v1/qr/${encodeURIComponent(
                    existingPaymentId
                )}`;
            return jsonResponse({
                success: true,
                existing: true,
                data: {
                    order_id:
                        orderId,
                    payment_id:
                        existingPaymentId,
                    reference:
                        reference,
                    amount:
                        amount,
                    currency:
                        "IDR",
                    qrImage:
                        existingQr,
                    qr_image_url:
                        existingQr,
                    expiresAt:
                        order.expires_at ||
                        null,
                    expires_at:
                        order.expires_at ||
                        null
                }
            }, 200);
        }
        // =====================================================
        // DOMPETX REQUEST BODY
        //
        // BODY STRING INI HARUS SAMA PERSIS
        // DENGAN BODY YANG DIKIRIM.
        // =====================================================
        const dompetBody = {
            method:
                "QRIS",
            amount:
                amount,
            currency:
                "IDR",
            reference:
                reference,
            settlementSpeed:
                "standard"
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
        // key = DOMPETX_API_KEY
        // =====================================================
        const signatureData =
            `${timestamp}.${dompetBodyString}`;
        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );
        // =====================================================
        // IDEMPOTENCY KEY
        // =====================================================
        const idempotencyKey =
            `clp-${orderId}`;
        // =====================================================
        // LOG
        //
        // JANGAN LOG API KEY / SIGNATURE.
        // =====================================================
        console.log(
            "DOMPETX CREATE PAYMENT:",
            {
                order_id:
                    orderId,
                reference:
                    reference,
                amount:
                    amount,
                method:
                    "QRIS"
            }
        );
        // =====================================================
        // CALL DOMPETX
        // =====================================================
        const dompetResponse =
            await fetch(
                "https://api.dompetx.com/v1/payments",
                {
                    method:
                        "POST",
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
        // =====================================================
        // PARSE DOMPETX RESPONSE
        // =====================================================
        let dompetData;
        try {
            dompetData =
                JSON.parse(
                    dompetText
                );
        } catch {
            console.error(
                "DOMPETX NON JSON:",
                dompetText.substring(
                    0,
                    2000
                )
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
                        2000
                    )
            }, 502);
        }
        console.log(
            "DOMPETX RESPONSE:",
            dompetData
        );
        // =====================================================
        // DOMPETX ERROR
        //
        // Kembalikan pesan asli.
        // =====================================================
        if (
            !dompetResponse.ok
        ) {
            const realError =
                dompetData?.message ||
                dompetData?.error ||
                dompetData?.errors?.[0]?.message ||
                dompetData?.data?.message ||
                dompetData?.data?.error ||
                "DompetX menolak pembayaran";
            console.error(
                "DOMPETX ERROR:",
                {
                    status:
                        dompetResponse.status,
                    error:
                        realError,
                    response:
                        dompetData
                }
            );
            return jsonResponse({
                success:
                    false,
                error:
                    realError,
                status:
                    dompetResponse.status,
                detail:
                    dompetData
            }, dompetResponse.status);
        }
        // =====================================================
        // NORMALIZE RESPONSE
        // =====================================================
        const paymentData =
            dompetData?.data &&
            typeof dompetData.data === "object"
                ? dompetData.data
                : dompetData;
        // =====================================================
        // PAYMENT ID
        // =====================================================
        const paymentId =
            paymentData?.paymentId ||
            paymentData?.payment_id ||
            paymentData?.id ||
            paymentData?.transactionId ||
            paymentData?.transaction_id ||
            null;
        if (!paymentId) {
            console.error(
                "DOMPETX PAYMENT ID MISSING:",
                dompetData
            );
            return jsonResponse({
                success:
                    false,
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
            paymentData?.qrData?.qrImage ||
            paymentData?.qr_data?.qrImage ||
            paymentData?.qrData?.qr_image ||
            paymentData?.qr_data?.qr_image ||
            paymentData?.qrImage ||
            paymentData?.qr_image ||
            paymentData?.qrUrl ||
            paymentData?.qr_url ||
            paymentData?.qrisImage ||
            paymentData?.qris_image ||
            null;
        // =====================================================
        // QR FALLBACK
        //
        // Public endpoint:
        // GET /v1/qr/{paymentId}
        // =====================================================
        if (
            !qrImage
        ) {
            qrImage =
                `https://api.dompetx.com/v1/qr/${encodeURIComponent(
                    paymentId
                )}`;
        }
        // =====================================================
        // EXPIRES
        // =====================================================
        const expiresAt =
            paymentData?.expiresAt ||
            paymentData?.expires_at ||
            paymentData?.expiredAt ||
            paymentData?.expired_at ||
            null;
        // =====================================================
        // SAVE PAYMENT DATA
        //
        // Kita coba menyimpan payment_id.
        //
        // Jika kolom payment_id belum ada,
        // update tidak boleh membuat pembayaran gagal.
        // =====================================================
        const updateOrder = {
            invoice_id: reference,
            payment_id: paymentId,
            updated_at: new Date().toISOString()
        };
        // Hanya masukkan payment_id kalau
        // database memang sudah punya kolom tersebut.
        //
        // Jika belum ada, Supabase akan menolak PATCH.
        // Karena itu kita simpan reference terlebih dahulu.
        const updateResponse =
            await fetch(
                `${supabaseUrl}/rest/v1/sell_orders?id=eq.${encodeURIComponent(orderId)}`,
                {
                    method:
                        "PATCH",
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
        }
        // =====================================================
        // SUCCESS
        // =====================================================
        return jsonResponse({
            success:
                true,
            existing:
                false,
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
            status:
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
