// ============================================
// CREATE DOMPETX CHECKOUT PAYMENT
// CLICK2PAY / SELL LINK
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
        console.log(
            JSON.stringify(body, null, 2)
        );
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
            console.error(
                "DOMPETX API KEY BELUM DISET"
            );
            return json({
                success: false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi"
            }, 500);
        }
        const signatureSecret =
            env.DOMPETX_API_SECRET ||
            env.DOMPAY_API_SECRET ||
            apiKey;
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
                `?id=eq.${encodeURIComponent(
                    orderId
                )}&select=*`
            );
        if (!orders.length) {
            return json({
                success: false,
                error:
                    "Sell order tidak ditemukan"
            }, 404);
        }
        const order =
            orders[0];
        console.log(
            "SELL ORDER FOUND:"
        );
        console.log(
            JSON.stringify(
                order,
                null,
                2
            )
        );
        // ========================================
        // ORDER SUDAH PAID
        // ========================================
        if (
            String(order.status || "")
                .toLowerCase() === "paid"
        ) {
            return json({
                success: false,
                error:
                    "Order sudah dibayar"
            }, 400);
        }
        // ========================================
        // AMOUNT
        // ========================================
        const amount =
            Number(
                order.price || 0
            );
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
        // CEK PAYMENT LINK YANG SUDAH ADA
        //
        // Kalau user klik BAYAR berkali-kali,
        // jangan membuat transaksi DompetX baru.
        //
        // Ini juga mencegah:
        //
        // duplicate transaction reference
        // ========================================
        const existingPaymentLink =
            order.payment_link ||
            order.paymentLink ||
            null;
        const existingPaymentId =
            order.payment_id ||
            order.paymentId ||
            null;
        const existingReference =
            order.invoice_id ||
            order.reference ||
            null;
        if (
            existingPaymentLink
        ) {
            console.log(
                "PAYMENT LINK EXISTING:"
            );
            console.log(
                existingPaymentLink
            );
            return json({
                success: true,
                data: {
                    order_id:
                        order.id,
                    payment_id:
                        existingPaymentId,
                    invoice_id:
                        existingReference,
                    reference:
                        existingReference,
                    amount:
                        amount,
                    currency:
                        "IDR",
                    status:
                        "pending",
                    payment_link:
                        existingPaymentLink,
                    expires_at:
                        order.payment_expires_at ||
                        null
                }
            });
        }
        // ========================================
        // BUAT REFERENCE BARU
        //
        // JANGAN menggunakan invoice_id lama
        // kalau checkout sebelumnya tidak mempunyai
        // payment_link.
        //
        // Karena DompetX bisa menganggap reference
        // tersebut sudah pernah digunakan.
        // ========================================
        const reference =
            createUniqueReference(
                order.id
            );
        console.log(
            "NEW DOMPETX REFERENCE:",
            reference
        );
        // ========================================
        // FRONTEND URL
        // ========================================
        const frontendUrl =
            env.FRONTEND_URL ||
            "https://click2pay.my.id";
        // ========================================
        // REDIRECT URL
        //
        // Redirect hanya dilakukan setelah
        // pembayaran selesai.
        // ========================================
        const redirectUrl =
            `${frontendUrl}/b/${encodeURIComponent(
                order.link_id
            )}?payment=success&order_id=${encodeURIComponent(
                order.id
            )}`;
        // ========================================
        // CHECKOUT BODY
        //
        // SESUAI DOKUMENTASI:
        //
        // POST /v1/payments/checkout
        //
        // Tidak menggunakan:
        // method: "QRIS"
        //
        // karena dokumentasi checkout yang kamu
        // kirim tidak meminta field method.
        // ========================================
        const checkoutBody = {
            amount:
                amount,
            currency:
                "IDR",
            reference:
                reference,
            redirectUrl:
                redirectUrl,
            metadata: {
                order_name:
                    "Click2Pay Sell Link",
                product_name:
                    `Sell Link #${order.link_id}`,
                notes:
                    "Pembayaran Sell Link Click2Pay",
                items: [
                    {
                        name:
                            `Sell Link #${order.link_id}`,
                        quantity:
                            1,
                        price:
                            amount
                    }
                ]
            }
        };
        const rawBody =
            JSON.stringify(
                checkoutBody
            );
        console.log(
            "DOMPETX REQUEST BODY:"
        );
        console.log(
            JSON.stringify(
                checkoutBody,
                null,
                2
            )
        );
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
                signatureSecret
            );
        // ========================================
        // DOMPETX CHECKOUT
        // ========================================
        const response =
            await fetch(
                "https://api.dompetx.com/v1/payments/checkout",
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
                            timestamp
                    },
                    body:
                        rawBody
                }
            );
        const responseText =
            await response.text();
        let dompetx =
            {};
        try {
            dompetx =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};
        } catch {
            console.error(
                "DOMPETX RAW RESPONSE:",
                responseText
            );
            throw new Error(
                "Response DompetX bukan JSON: " +
                responseText
            );
        }
        // ========================================
        // LOG RESPONSE
        // ========================================
        console.log(
            "================================"
        );
        console.log(
            "DOMPETX CHECKOUT RESPONSE"
        );
        console.log(
            JSON.stringify(
                dompetx,
                null,
                2
            )
        );
        console.log(
            "================================"
        );
        // ========================================
        // DOMPETX ERROR
        // ========================================
        if (!response.ok) {
            console.error(
                "DOMPETX HTTP ERROR:",
                response.status
            );
            return json({
                success:
                    false,
                error:
                    dompetx?.message ||
                    dompetx?.error ||
                    dompetx?.detail ||
                    `DompetX HTTP ${response.status}`,
                details:
                    dompetx
            }, response.status);
        }
        // ========================================
        // PAYMENT ID
        //
        // Support beberapa kemungkinan struktur.
        // ========================================
        const paymentId =
            dompetx?.id ||
            dompetx?.paymentId ||
            dompetx?.data?.id ||
            dompetx?.data?.paymentId ||
            null;
        // ========================================
        // PAYMENT LINK
        //
        // Dokumentasi DompetX:
        //
        // payment_link
        //
        // Kita juga support beberapa kemungkinan
        // struktur response.
        // ========================================
        const paymentLink =
            dompetx?.payment_link ||
            dompetx?.paymentLink ||
            dompetx?.checkout_url ||
            dompetx?.checkoutUrl ||
            dompetx?.url ||
            dompetx?.data?.payment_link ||
            dompetx?.data?.paymentLink ||
            dompetx?.data?.checkout_url ||
            dompetx?.data?.checkoutUrl ||
            dompetx?.data?.url ||
            dompetx?.checkout?.payment_link ||
            dompetx?.checkout?.paymentLink ||
            dompetx?.checkout?.url ||
            dompetx?.result?.payment_link ||
            dompetx?.result?.paymentLink ||
            dompetx?.result?.url ||
            null;
        // ========================================
        // PAYMENT LINK WAJIB
        // ========================================
        if (!paymentLink) {
            console.error(
                "================================"
            );
            console.error(
                "PAYMENT LINK DOMPETX TIDAK DITEMUKAN"
            );
            console.error(
                "RAW RESPONSE:"
            );
            console.error(
                JSON.stringify(
                    dompetx,
                    null,
                    2
                )
            );
            console.error(
                "================================"
            );
            return json({
                success:
                    false,
                error:
                    "Payment link DompetX tidak ditemukan",
                payment_id:
                    paymentId,
                reference:
                    reference,
                details:
                    dompetx
            }, 502);
        }
        // ========================================
        // EXPIRES
        // ========================================
        const expiresAt =
            dompetx?.expiresAt ||
            dompetx?.expires_at ||
            dompetx?.data?.expiresAt ||
            dompetx?.data?.expires_at ||
            null;
        // ========================================
        // SAVE PAYMENT DATA
        // ========================================
        try {
            await supabaseRequest(
                env,
                "sell_orders",
                "PATCH",
                {
                    invoice_id:
                        reference,
                    payment_id:
                        paymentId,
                    payment_link:
                        paymentLink,
                    payment_expires_at:
                        expiresAt
                },
                `?id=eq.${encodeURIComponent(
                    order.id
                )}`
            );
            console.log(
                "PAYMENT DATA BERHASIL DISIMPAN"
            );
        } catch (saveError) {
            console.error(
                "GAGAL MENYIMPAN PAYMENT DATA:"
            );
            console.error(
                saveError
            );
            // Jangan menghilangkan payment link
            // dari response hanya karena database
            // gagal menyimpan metadata.
        }
        // ========================================
        // SUCCESS
        // ========================================
        console.log(
            "================================"
        );
        console.log(
            "DOMPETX CHECKOUT BERHASIL"
        );
        console.log({
            order_id:
                order.id,
            payment_id:
                paymentId,
            reference:
                reference,
            amount:
                amount,
            payment_link:
                paymentLink,
            expires_at:
                expiresAt
        });
        console.log(
            "================================"
        );
        return json({
            success:
                true,
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
                    amount,
                currency:
                    "IDR",
                status:
                    dompetx?.status ||
                    dompetx?.data?.status ||
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
            "CREATE DOMPETX CHECKOUT ERROR"
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
                "Gagal membuat checkout DompetX"
        }, 500);
    }
}
// ============================================
// CREATE UNIQUE REFERENCE
// ============================================
function createUniqueReference(
    orderId
) {
    const cleanOrderId =
        String(orderId)
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(
                0,
                24
            );
    const timestamp =
        Date.now()
            .toString(
                36
            )
            .toUpperCase();
    const random =
        crypto
            .randomUUID()
            .replace(
                /-/g,
                ""
            )
            .slice(
                0,
                8
            )
            .toUpperCase();
    return (
        `SELL-${cleanOrderId}-${timestamp}-${random}`
    );
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
        encoder.encode(
            secret
        );
    const messageData =
        encoder.encode(
            message
        );
    const cryptoKey =
        await crypto.subtle.importKey(
            "raw",
            keyData,
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
                    .toString(
                        16
                    )
                    .padStart(
                        2,
                        "0"
                    )
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
                        ? JSON.stringify(
                            body
                        )
                        : undefined
            }
        );
    const text =
        await response.text();
    let data =
        [];
    if (text) {
        try {
            data =
                JSON.parse(
                    text
                );
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
        JSON.stringify(
            data
        ),
        {
            status,
            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );
}
