// ============================================
// CREATE DOMPETX CHECKOUT PAYMENT
// Click2Pay / Sell Link
// ============================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        // ========================================
        // READ REQUEST
        // ========================================
        const body = await request.json();
        console.log("================================");
        console.log("CREATE DOMPETX CHECKOUT");
        console.log(JSON.stringify(body, null, 2));
        console.log("================================");
        const orderId =
            body?.order_id ||
            body?.orderId ||
            null;
        if (!orderId) {
            return json({
                success: false,
                error: "Order ID wajib diisi"
            }, 400);
        }
        // ========================================
        // ENV
        // ========================================
        const apiKey =
            env.DOMPETX_API_KEY ||
            env.DOMPAY_API_KEY;
        if (!apiKey) {
            return json({
                success: false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi"
            }, 500);
        }
        if (!env.SUPABASE_URL) {
            throw new Error(
                "SUPABASE_URL belum dikonfigurasi"
            );
        }
        if (!env.SUPABASE_SERVICE_KEY) {
            throw new Error(
                "SUPABASE_SERVICE_KEY belum dikonfigurasi"
            );
        }
        // ========================================
        // GET SELL ORDER
        // ========================================
        const orders =
            await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(orderId)}&select=*`
            );
        if (!orders.length) {
            return json({
                success: false,
                error:
                    "Sell order tidak ditemukan"
            }, 404);
        }
        const order = orders[0];
        console.log(
            "SELL ORDER FOUND:",
            JSON.stringify(order, null, 2)
        );
        // ========================================
        // ORDER SUDAH PAID
        // ========================================
        if (order.status === "paid") {
            return json({
                success: false,
                error:
                    "Order sudah dibayar"
            }, 400);
        }
        // ========================================
        // PRICE
        // ========================================
        const amount =
            Number(order.price || 0);
        if (
            !Number.isFinite(amount) ||
            amount < 1000
        ) {
            return json({
                success: false,
                error:
                    "Nominal pembayaran tidak valid"
            }, 400);
        }
        // ========================================
        // FRONTEND
        // ========================================
        const frontendUrl =
            env.FRONTEND_URL ||
            "https://click2pay.my.id";
        // ========================================
        // REDIRECT URL
        // ========================================
        const redirectUrl =
            `${frontendUrl}/b/${encodeURIComponent(
                order.link_id
            )}?payment=success&order_id=${encodeURIComponent(
                order.id
            )}`;
        // ========================================
        // REFERENCE BARU
        //
        // JANGAN memakai invoice_id lama.
        //
        // Setiap checkout baru harus mempunyai
        // transaction reference yang unik.
        // ========================================
        const reference =
            `SELL-${order.id}-${Date.now()}-${crypto.randomUUID()}`;
        // ========================================
        // IDEMPOTENCY KEY
        //
        // Berbeda dengan reference.
        // Key ini untuk mencegah request HTTP
        // yang sama diproses dua kali.
        // ========================================
        const idempotencyKey =
            `click2pay-${order.id}-${Date.now()}`;
        // ========================================
        // DOMPETX BODY
        //
        // SESUAI DOKUMENTASI:
        //
        // POST /v1/payments/checkout
        // ========================================
        const dompetxBody = {
            amount: amount,
            currency: "IDR",
            reference: reference,
            redirectUrl: redirectUrl,
            metadata: {
                order_name:
                    "Click2Pay Sell Link",
                product_name:
                    `Sell Link #${order.link_id}`,
                notes:
                    "Pembayaran Sell Link Click2Pay"
            }
        };
        const rawBody =
            JSON.stringify(dompetxBody);
        // ========================================
        // TIMESTAMP
        // ========================================
        const timestamp =
            Math.floor(
                Date.now() / 1000
            ).toString();
        // ========================================
        // SIGNATURE
        // ========================================
        const signature =
            await generateSignature(
                `${timestamp}.${rawBody}`,
                apiKey
            );
        console.log(
            "DOMPETX CHECKOUT:",
            {
                amount,
                reference,
                timestamp,
                idempotencyKey
            }
        );
        // ========================================
        // CREATE CHECKOUT
        // ========================================
        const response =
            await fetch(
                "https://api.dompetx.com/v1/payments/checkout",
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
                    body: rawBody
                }
            );
        const responseText =
            await response.text();
        let dompetx = {};
        try {
            dompetx =
                responseText
                    ? JSON.parse(responseText)
                    : {};
        } catch {
            throw new Error(
                "Response DompetX bukan JSON: " +
                responseText
            );
        }
        console.log(
            "DOMPETX RESPONSE:",
            JSON.stringify(
                dompetx,
                null,
                2
            )
        );
        // ========================================
        // DOMPETX ERROR
        // ========================================
        if (!response.ok) {
            console.error(
                "DOMPETX HTTP ERROR:",
                response.status,
                dompetx
            );
            return json({
                success: false,
                error:
                    dompetx?.message ||
                    dompetx?.error ||
                    `DompetX HTTP ${response.status}`,
                details:
                    dompetx
            }, response.status);
        }
        // ========================================
        // PAYMENT ID
        // ========================================
        const paymentId =
            dompetx.id ||
            dompetx.paymentId ||
            null;
        if (!paymentId) {
            throw new Error(
                "Payment ID DompetX tidak ditemukan"
            );
        }
        // ========================================
        // PAYMENT LINK
        // ========================================
        const paymentLink =
            dompetx.payment_link ||
            dompetx.paymentLink ||
            null;
        if (!paymentLink) {
            throw new Error(
                "Payment link DompetX tidak ditemukan"
            );
        }
        // ========================================
        // EXPIRES
        // ========================================
        const expiresAt =
            dompetx.expiresAt ||
            dompetx.expires_at ||
            null;
        // ========================================
        // SAVE TO SELL ORDER
        //
        // Reference terbaru disimpan sebagai
        // invoice_id.
        // ========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                invoice_id:
                    reference,
                payment_id:
                    paymentId,
                payment_status:
                    dompetx.status ||
                    "pending"
            },
            `?id=eq.${encodeURIComponent(
                order.id
            )}`
        );
        console.log(
            "PAYMENT DATA BERHASIL DISIMPAN"
        );
        // ========================================
        // RESPONSE FRONTEND
        // ========================================
        return json({
            success: true,
            data: {
                order_id:
                    order.id,
                payment_id:
                    paymentId,
                invoice_id:
                    reference,
                reference:
                    reference,
                amount:
                    Number(
                        dompetx.amount ||
                        amount
                    ),
                currency:
                    dompetx.currency ||
                    "IDR",
                status:
                    dompetx.status ||
                    "pending",
                payment_link:
                    paymentLink,
                expires_at:
                    expiresAt,
                redirect_url:
                    redirectUrl
            }
        });
    } catch (error) {
        console.error(
            "================================"
        );
        console.error(
            "CREATE DOMPETX CHECKOUT ERROR:",
            error
        );
        console.error(
            "================================"
        );
        return json({
            success: false,
            error:
                error?.message ||
                "Gagal membuat pembayaran DompetX"
        }, 500);
    }
}
// ============================================
// HMAC SHA256
// ============================================
async function generateSignature(
    message,
    secret
) {
    const encoder =
        new TextEncoder();
    const keyData =
        encoder.encode(secret);
    const messageData =
        encoder.encode(message);
    const cryptoKey =
        await crypto.subtle.importKey(
            "raw",
            keyData,
            {
                name: "HMAC",
                hash: "SHA-256"
            },
            false,
            ["sign"]
        );
    const signatureBuffer =
        await crypto.subtle.sign(
            "HMAC",
            cryptoKey,
            messageData
        );
    return Array.from(
        new Uint8Array(
            signatureBuffer
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
