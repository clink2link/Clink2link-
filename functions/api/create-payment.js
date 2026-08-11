// ===============================
// DOMPETX CREATE PAYMENT
// ===============================
async function hmacSHA256(secret, message) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        {
            name: "HMAC",
            hash: "SHA-256"
        },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(message)
    );
    return [...new Uint8Array(signature)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}
// ===============================
// CREATE DOMPETX PAYMENT
// ===============================
async function dompetXCreatePayment(env, payload) {
    if (!env.DOMPAY_API_KEY) {
        throw new Error("DOMPAY_API_KEY belum diset");
    }
    if (!env.DOMPAY_BASE_URL) {
        throw new Error("DOMPAY_BASE_URL belum diset");
    }
    const baseUrl =
        env.DOMPAY_BASE_URL.replace(/\/+$/, "");
    const timestamp =
        Math.floor(Date.now() / 1000).toString();
    const body = {
        amount: Number(payload.amount),
        currency: "IDR",
        reference: payload.reference,
        redirectUrl:
            payload.redirect_url,
        metadata: {
            order_name:
                payload.description ||
                "Pembayaran",
            product_name:
                payload.product_name ||
                "Sell Link",
            customer_name:
                payload.customer_name ||
                "",
            customer_email:
                payload.customer_email ||
                ""
        }
    };
    const bodyString =
        JSON.stringify(body);
    const signature =
        await hmacSHA256(
            env.DOMPAY_API_KEY,
            `${timestamp}.${bodyString}`
        );
    const response =
        await fetch(
            `${baseUrl}/v1/payments/checkout`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    "X-DOMPAY-API-Key":
                        env.DOMPAY_API_KEY,
                    "X-DOMPAY-Timestamp":
                        timestamp,
                    "X-DOMPAY-Signature":
                        signature,
                    "Idempotency-Key":
                        crypto.randomUUID()
                },
                body: bodyString
            }
        );
    const text =
        await response.text();
    console.log(
        "========== DOMPETX =========="
    );
    console.log(
        "STATUS:",
        response.status
    );
    console.log(
        "RAW:",
        text
    );
    console.log(
        "============================="
    );
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            "Response DompetX bukan JSON:\n" +
            text
        );
    }
    if (!response.ok) {
        throw new Error(
            `DompetX HTTP ${response.status}: ` +
            JSON.stringify(
                data,
                null,
                2
            )
        );
    }
    if (!data.id) {
        throw new Error(
            "DompetX tidak mengembalikan payment ID"
        );
    }
    // =================================
    // QRIS URL
    // GET /v1/qr/{paymentId}
    // =================================
    const qrisImageUrl =
        `${baseUrl}/v1/qr/${encodeURIComponent(data.id)}`;
    console.log(
        "DOMPETX PAYMENT ID:",
        data.id
    );
    console.log(
        "DOMPETX QRIS URL:",
        qrisImageUrl
    );
    return {
        payment_id:
            data.id,
        invoice_id:
            data.reference ||
            payload.reference,
        payment_url:
            data.payment_url ||
            null,
        qris_image_url:
            qrisImageUrl,
        expires_at:
            data.expiresAt ||
            null,
        status:
            data.status ||
            "pending",
        amount:
            Number(
                data.amount ||
                payload.amount
            ),
        final_amount:
            Number(
                data.amount ||
                payload.amount
            )
    };
}
// ===============================
// CREATE PAYMENT
// ===============================
export async function onRequestPost(context) {
    const {
        request,
        env
    } = context;
    try {
        const body =
            await request.json();
        const order_id =
            body.order_id;
        if (!order_id) {
            throw new Error(
                "order_id wajib diisi"
            );
        }
        // =========================
        // ENV CHECK
        // =========================
        if (!env.DOMPAY_API_KEY) {
            throw new Error(
                "DOMPAY_API_KEY belum diset"
            );
        }
        if (!env.DOMPAY_BASE_URL) {
            throw new Error(
                "DOMPAY_BASE_URL belum diset"
            );
        }
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
        if (!env.FRONTEND_URL) {
            throw new Error(
                "FRONTEND_URL belum diset"
            );
        }
        // =========================
        // GET ORDER
        // =========================
        const orders =
            await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(order_id)}&select=*`
            );
        if (!orders.length) {
            throw new Error(
                "Order tidak ditemukan"
            );
        }
        const order =
            orders[0];
        // =========================
        // SUDAH PAID
        // =========================
        if (order.status === "paid") {
            let qrisImageUrl = null;
            if (order.payment_id) {
                const baseUrl =
                    env.DOMPAY_BASE_URL
                        .replace(/\/+$/, "");
                qrisImageUrl =
                    `${baseUrl}/v1/qr/${encodeURIComponent(order.payment_id)}`;
            }
            return json({
                success: true,
                already_paid: true,
                data: {
                    order_id:
                        order.id,
                    payment_id:
                        order.payment_id ||
                        null,
                    invoice_id:
                        order.invoice_id ||
                        null,
                    payment_url:
                        order.payment_url ||
                        null,
                    qris_image_url:
                        qrisImageUrl,
                    expires_at:
                        order.expires_at ||
                        null,
                    status:
                        "paid"
                }
            });
        }
        // =========================
        // CEK STATUS ORDER
        // =========================
        if (order.status !== "pending") {
            throw new Error(
                `Order tidak dapat dibayar. Status: ${order.status}`
            );
        }
        // =========================
        // NOMINAL
        // =========================
        const amount =
            Number(
                order.price || 0
            );
        if (
            !Number.isFinite(amount) ||
            amount < 1000
        ) {
            throw new Error(
                "Nominal pembayaran tidak valid"
            );
        }
        // =========================
        // PAYMENT MASIH AKTIF
        // =========================
        if (
            order.payment_id &&
            order.expires_at &&
            new Date(
                order.expires_at
            ) > new Date()
        ) {
            const baseUrl =
                env.DOMPAY_BASE_URL
                    .replace(/\/+$/, "");
            const qrisImageUrl =
                `${baseUrl}/v1/qr/${encodeURIComponent(order.payment_id)}`;
            return json({
                success: true,
                data: {
                    order_id:
                        order.id,
                    payment_id:
                        order.payment_id,
                    invoice_id:
                        order.invoice_id ||
                        null,
                    payment_url:
                        order.payment_url ||
                        null,
                    qris_image_url:
                        qrisImageUrl,
                    expires_at:
                        order.expires_at,
                    status:
                        "pending",
                    amount:
                        amount
                }
            });
        }
        // =========================
        // GET SHORT CODE
        // =========================
        const links =
            await supabaseRequest(
                env,
                "links",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(order.link_id)}&select=short_code`
            );
        if (!links.length) {
            throw new Error(
                "Short code link tidak ditemukan"
            );
        }
        const shortCode =
            links[0].short_code;
        // =========================
        // REFERENCE
        // =========================
        const reference =
            `SELL-${order.id}-${Date.now()}`;
        // =========================
        // REDIRECT URL
        // =========================
        const frontendUrl =
            env.FRONTEND_URL.endsWith("/")
                ? env.FRONTEND_URL.slice(0, -1)
                : env.FRONTEND_URL;
        const redirectUrl =
            `${frontendUrl}/b/${encodeURIComponent(shortCode)}`;
        // =========================
        // CREATE DOMPETX
        // =========================
        const payment =
            await dompetXCreatePayment(
                env,
                {
                    amount,
                    reference,
                    description:
                        `Pembelian Sell Link ${shortCode}`,
                    product_name:
                        `Sell Link ${shortCode}`,
                    redirect_url:
                        redirectUrl
                }
            );
        console.log(
            "DOMPETX PAYMENT CREATED:",
            payment
        );
        // =========================
        // EXPIRES
        // =========================
        const expiresAt =
            payment.expires_at
                ? new Date(
                    payment.expires_at
                ).toISOString()
                : new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                ).toISOString();
        // =========================
        // UPDATE ORDER
        //
        // PENTING:
        // JANGAN UPDATE qris_image_url
        // KARENA KOLOM TIDAK ADA
        // =========================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                payment_id:
                    payment.payment_id,
                invoice_id:
                    payment.invoice_id,
                payment_url:
                    payment.payment_url,
                expires_at:
                    expiresAt
            },
            `?id=eq.${encodeURIComponent(order_id)}`
        );
        // =========================
        // RESPONSE
        // =========================
        return json({
            success: true,
            data: {
                order_id:
                    order.id,
                payment_id:
                    payment.payment_id,
                invoice_id:
                    payment.invoice_id,
                payment_url:
                    payment.payment_url,
                // QRIS LANGSUNG
                qris_image_url:
                    payment.qris_image_url,
                expires_at:
                    expiresAt,
                status:
                    payment.status,
                amount:
                    payment.amount,
                final_amount:
                    payment.final_amount
            }
        });
    } catch (error) {
        console.error(
            "CREATE PAYMENT ERROR:",
            error
        );
        return json(
            {
                success: false,
                error:
                    error?.message ||
                    "Terjadi kesalahan"
            },
            500
        );
    }
}
// ===============================
// SUPABASE REQUEST
// ===============================
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
// ===============================
// JSON RESPONSE
// ===============================
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
