// ============================================
// CREATE DOMPETX CHECKOUT PAYMENT
// Click2Pay / Sell Link
//
// FLOW:
// Click Bayar
//     ↓
// create_payment.js
//     ↓
// POST https://api.dompetx.com/v1/payments/checkout
//     ↓
// payment_link
//     ↓
// Frontend menampilkan checkout DompetX
//
// TIDAK REDIRECT KE HALAMAN LAIN
// ============================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        console.log("========================================");
        console.log("CLICK2PAY CREATE DOMPETX PAYMENT");
        console.log("========================================");
        // ========================================
        // READ REQUEST
        // ========================================
        let body;
        try {
            body = await request.json();
        } catch {
            return json({
                success: false,
                error: "Request body bukan JSON"
            }, 400);
        }
        console.log(
            "REQUEST:",
            JSON.stringify(body, null, 2)
        );
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
            env.DOMPAY_API_KEY ||
            null;
        if (!apiKey) {
            console.error(
                "DOMPETX API KEY TIDAK ADA"
            );
            return json({
                success: false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi"
            }, 500);
        }
        if (!env.SUPABASE_URL) {
            return json({
                success: false,
                error:
                    "SUPABASE_URL belum dikonfigurasi"
            }, 500);
        }
        if (!env.SUPABASE_SERVICE_KEY) {
            return json({
                success: false,
                error:
                    "SUPABASE_SERVICE_KEY belum dikonfigurasi"
            }, 500);
        }
        // ========================================
        // GET ORDER
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
        const order = orders[0];
        console.log(
            "ORDER:",
            JSON.stringify(
                order,
                null,
                2
            )
        );
        // ========================================
        // JIKA SUDAH PAID
        // ========================================
        if (order.status === "paid") {
            return json({
                success: false,
                error:
                    "Order sudah dibayar"
            }, 400);
        }
        // ========================================
        // JIKA SUDAH ADA PAYMENT LINK
        //
        // Jangan membuat checkout baru.
        // Ini mencegah duplicate reference.
        // ========================================
        if (
            order.payment_link &&
            typeof order.payment_link === "string" &&
            order.payment_link.startsWith("http")
        ) {
            console.log(
                "PAYMENT LINK EXISTING:",
                order.payment_link
            );
            return json({
                success: true,
                existing: true,
                data: {
                    order_id:
                        order.id,
                    payment_id:
                        order.payment_id ||
                        null,
                    invoice_id:
                        order.invoice_id ||
                        null,
                    amount:
                        Number(order.price || 0),
                    currency:
                        "IDR",
                    status:
                        order.status ||
                        "pending",
                    payment_link:
                        order.payment_link
                }
            });
        }
        // ========================================
        // AMOUNT
        // ========================================
        const amount =
            Math.floor(
                Number(order.price || 0)
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
        // REFERENCE
        //
        // HARUS UNIK.
        //
        // Jangan menggunakan reference lama
        // yang mungkin pernah dikirim ke DompetX.
        // ========================================
        const reference =
            `SELL-${String(order.id)
                .replace(/-/g, "")
                .slice(0, 20)}-${Date.now()}`;
        console.log(
            "NEW DOMPETX REFERENCE:",
            reference
        );
        // ========================================
        // REDIRECT URL
        //
        // Hanya digunakan setelah pembayaran.
        // BUKAN untuk membuka checkout.
        // ========================================
        const frontendUrl =
            env.FRONTEND_URL ||
            "https://click2pay.my.id";
        const redirectUrl =
            `${frontendUrl}/b/${encodeURIComponent(
                order.link_id
            )}?payment=success&order_id=${encodeURIComponent(
                order.id
            )}`;
        // ========================================
        // CHECKOUT BODY
        //
        // SESUAI DOKUMENTASI DOMPETX:
        //
        // POST /v1/payments/checkout
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
        // ========================================
        // TIMESTAMP
        // ========================================
        const timestamp =
            Math.floor(
                Date.now() / 1000
            ).toString();
        // ========================================
        // SIGNATURE
        //
        // PRIORITAS:
        // DOMPETX_API_SECRET
        // DOMPAY_API_SECRET
        //
        // Jangan diam-diam memakai API KEY
        // sebagai secret kecuali dokumentasi
        // DompetX memang menyatakan demikian.
        // ========================================
        const secret =
            env.DOMPETX_API_SECRET ||
            env.DOMPAY_API_SECRET ||
            null;
        if (!secret) {
            console.error(
                "DOMPETX API SECRET TIDAK ADA"
            );
            return json({
                success: false,
                error:
                    "DOMPETX_API_SECRET belum dikonfigurasi"
            }, 500);
        }
        const signature =
            await generateSignature(
                `${timestamp}.${rawBody}`,
                secret
            );
        console.log(
            "DOMPETX REQUEST INFO:",
            {
                endpoint:
                    "https://api.dompetx.com/v1/payments/checkout",
                amount,
                reference,
                timestamp
            }
        );
        // ========================================
        // CALL DOMPETX
        // ========================================
        let response;
        try {
            response =
                await fetch(
                    "https://api.dompetx.com/v1/payments/checkout",
                    {
                        method:
                            "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
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
        } catch (fetchError) {
            console.error(
                "FETCH DOMPETX ERROR:",
                fetchError
            );
            return json({
                success: false,
                error:
                    "Tidak dapat terhubung ke server DompetX",
                details:
                    fetchError?.message ||
                    String(fetchError)
            }, 502);
        }
        // ========================================
        // READ RESPONSE
        //
        // JANGAN LANGSUNG JSON.parse.
        //
        // Karena error sebelumnya berupa HTML 502.
        // ========================================
        const responseText =
            await response.text();
        const contentType =
            response.headers.get(
                "content-type"
            ) || "";
        console.log(
            "DOMPETX HTTP STATUS:",
            response.status
        );
        console.log(
            "DOMPETX CONTENT TYPE:",
            contentType
        );
        console.log(
            "DOMPETX RAW RESPONSE:",
            responseText.slice(
                0,
                5000
            )
        );
        // ========================================
        // RESPONSE BUKAN JSON
        // ========================================
        if (
            !contentType
                .toLowerCase()
                .includes("application/json")
        ) {
            console.error(
                "DOMPETX RETURN NON JSON"
            );
            return json({
                success: false,
                error:
                    `Server pembayaran mengembalikan response non-JSON (HTTP ${response.status})`,
                http_status:
                    response.status,
                content_type:
                    contentType,
                provider:
                    "DompetX",
                response_preview:
                    responseText.slice(
                        0,
                        1000
                    )
            }, 502);
        }
        // ========================================
        // PARSE JSON
        // ========================================
        let dompetx;
        try {
            dompetx =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};
        } catch (parseError) {
            console.error(
                "DOMPETX JSON PARSE ERROR:",
                parseError
            );
            return json({
                success: false,
                error:
                    "Response DompetX gagal dibaca sebagai JSON",
                http_status:
                    response.status,
                response_preview:
                    responseText.slice(
                        0,
                        1000
                    )
            }, 502);
        }
        console.log(
            "DOMPETX JSON RESPONSE:",
            JSON.stringify(
                dompetx,
                null,
                2
            )
        );
        // ========================================
        // PROVIDER ERROR
        // ========================================
        if (!response.ok) {
            return json({
                success: false,
                error:
                    dompetx?.message ||
                    dompetx?.error ||
                    `DompetX HTTP ${response.status}`,
                http_status:
                    response.status,
                details:
                    dompetx
            }, response.status);
        }
        // ========================================
        // PAYMENT ID
        // ========================================
        const paymentId =
            dompetx?.id ||
            dompetx?.paymentId ||
            null;
        // ========================================
        // PAYMENT LINK
        // ========================================
        const paymentLink =
            dompetx?.payment_link ||
            dompetx?.paymentLink ||
            dompetx?.checkout_url ||
            dompetx?.checkoutUrl ||
            null;
        console.log(
            "PAYMENT ID:",
            paymentId
        );
        console.log(
            "PAYMENT LINK:",
            paymentLink
        );
        // ========================================
        // PAYMENT LINK WAJIB
        // ========================================
        if (
            !paymentLink ||
            typeof paymentLink !== "string"
        ) {
            console.error(
                "DOMPETX TIDAK MEMBERIKAN PAYMENT LINK",
                dompetx
            );
            return json({
                success: false,
                error:
                    "DompetX tidak mengembalikan payment_link",
                details:
                    dompetx
            }, 502);
        }
        // ========================================
        // SAVE PAYMENT
        // ========================================
        const paymentData = {
            invoice_id:
                reference,
            payment_id:
                paymentId,
            payment_link:
                paymentLink
        };
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            paymentData,
            `?id=eq.${encodeURIComponent(
                order.id
            )}`
        );
        console.log(
            "PAYMENT DATA SAVED"
        );
        // ========================================
        // SUCCESS
        // ========================================
        return json({
            success: true,
            existing: false,
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
                    "pending",
                payment_link:
                    paymentLink,
                expires_at:
                    dompetx?.expiresAt ||
                    dompetx?.expires_at ||
                    null,
                redirect_url:
                    redirectUrl
            }
        });
    } catch (error) {
        console.error(
            "========================================"
        );
        console.error(
            "CREATE DOMPETX PAYMENT ERROR"
        );
        console.error(
            error
        );
        console.error(
            "========================================"
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
    const key =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
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
            encoder.encode(message)
        );
    return Array.from(
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
                JSON.parse(
                    text
                );
        } catch {
            throw new Error(
                "Supabase response bukan JSON: " +
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
                    "application/json",
                "Cache-Control":
                    "no-store"
            }
        }
    );
}
