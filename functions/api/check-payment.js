// ============================================
// CHECK PAYMENT SELL LINK - DOMPETX
// ============================================
export async function onRequestGet(context) {
    const { env, request } = context;
    try {
        const url = new URL(request.url);
        const invoiceId =
            (url.searchParams.get("invoice_id") || "").trim();
        const paymentId =
            (url.searchParams.get("payment_id") || "").trim();
        console.log("========== CHECK DOMPETX ==========");
        console.log("INVOICE :", invoiceId);
        console.log("PAYMENT :", paymentId);
        console.log("===================================");
        if (!invoiceId && !paymentId) {
            return json({
                success: false,
                error: "invoice_id atau payment_id wajib diisi"
            }, 400);
        }
        // ========================================
        // ENV CHECK
        // ========================================
        if (!env.DOMPAY_API_KEY) {
            throw new Error("DOMPAY_API_KEY belum diset");
        }
        if (!env.DOMPAY_BASE_URL) {
            throw new Error("DOMPAY_BASE_URL belum diset");
        }
        if (!env.SUPABASE_URL) {
            throw new Error("SUPABASE_URL belum diset");
        }
        if (!env.SUPABASE_SERVICE_KEY) {
            throw new Error(
                "SUPABASE_SERVICE_KEY belum diset"
            );
        }
        // ========================================
        // GET ORDER
        // ========================================
        let orders = [];
        if (paymentId) {
            orders = await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?payment_id=eq.${encodeURIComponent(paymentId)}&select=*`
            );
        } else {
            orders = await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?invoice_id=eq.${encodeURIComponent(invoiceId)}&select=*`
            );
        }
        if (!orders.length) {
            return json({
                success: false,
                error: "Order tidak ditemukan"
            }, 404);
        }
        let order = orders[0];
        console.log("ORDER:", order);
        // ========================================
        // SUDAH PAID
        // ========================================
        if (order.status === "paid") {
            const destination =
                await getDestinationUrl(
                    env,
                    order.link_id
                );
            return json({
                success: true,
                data: {
                    order_id:
                        order.id,
                    invoice_id:
                        order.invoice_id || invoiceId,
                    payment_id:
                        order.payment_id || paymentId,
                    status:
                        "paid",
                    price:
                        Number(order.price || 0),
                    expires_at:
                        order.expires_at || null,
                    paid_at:
                        order.paid_at || null,
                    destination_url:
                        destination
                }
            });
        }
        // ========================================
        // PAYMENT ID WAJIB
        // ========================================
        const dompetPaymentId =
            order.payment_id || paymentId;
        if (!dompetPaymentId) {
            throw new Error(
                "Payment ID DompetX tidak ditemukan"
            );
        }
        // ========================================
        // CHECK DOMPETX
        // ========================================
        const payment =
            await dompetXCheckPayment(
                env,
                dompetPaymentId
            );
        console.log(
            "DOMPETX PAYMENT RESULT:",
            payment
        );
        // ========================================
        // PARSE STATUS
        // ========================================
        const paymentStatus =
            String(
                payment.status ||
                payment.payment_status ||
                payment.paymentStatus ||
                payment.state ||
                payment.data?.status ||
                ""
            )
            .trim()
            .toLowerCase();
        console.log(
            "DOMPETX STATUS:",
            paymentStatus
        );
        let status =
            order.status || "pending";
        let paidAt =
            order.paid_at || null;
        // ========================================
        // PAID
        // ========================================
        const isPaid =
            [
                "paid",
                "success",
                "successful",
                "completed",
                "settlement",
                "settled",
                "berhasil"
            ].includes(paymentStatus);
        if (
            isPaid &&
            order.status !== "paid"
        ) {
            console.log(
                "PAYMENT VALID - PROCESS SELL PAYMENT"
            );
            const process =
                await supabaseRpc(
                    env,
                    "process_sell_payment",
                    {
                        p_order_id:
                            order.id
                    }
                );
            console.log(
                "PROCESS SELL PAYMENT:",
                process
            );
            if (
                !process ||
                process.success === false
            ) {
                throw new Error(
                    process?.error ||
                    "Gagal proses pembayaran"
                );
            }
            // ====================================
            // GET UPDATED ORDER
            // ====================================
            const updated =
                await supabaseRequest(
                    env,
                    "sell_orders",
                    "GET",
                    null,
                    `?id=eq.${encodeURIComponent(order.id)}&select=*`
                );
            if (updated.length) {
                order = updated[0];
            }
            status =
                order.status || "paid";
            paidAt =
                order.paid_at ||
                new Date().toISOString();
        } else {
            // ====================================
            // PENDING / EXPIRED
            // ====================================
            if (
                [
                    "expired",
                    "cancelled",
                    "canceled"
                ].includes(paymentStatus)
            ) {
                status =
                    paymentStatus === "expired"
                        ? "expired"
                        : "cancelled";
            } else {
                status = "pending";
            }
        }
        // ========================================
        // DESTINATION
        // ========================================
        let destinationUrl = null;
        if (status === "paid") {
            destinationUrl =
                await getDestinationUrl(
                    env,
                    order.link_id
                );
        }
        // ========================================
        // QR IMAGE URL
        // ========================================
        const qrImageUrl =
            dompetPaymentId
                ? `${normalizeBaseUrl(env.DOMPAY_BASE_URL)}/v1/qr/${encodeURIComponent(dompetPaymentId)}`
                : null;
        // ========================================
        // RESPONSE
        // ========================================
        return json({
            success: true,
            data: {
                order_id:
                    order.id,
                invoice_id:
                    order.invoice_id ||
                    invoiceId ||
                    null,
                payment_id:
                    dompetPaymentId,
                status,
                price:
                    Number(order.price || 0),
                expires_at:
                    order.expires_at ||
                    payment.expiresAt ||
                    payment.expires_at ||
                    null,
                paid_at:
                    order.paid_at ||
                    paidAt,
                link_id:
                    order.link_id,
                seller_id:
                    order.seller_id,
                qr_image_url:
                    qrImageUrl,
                destination_url:
                    destinationUrl
            }
        });
    } catch (error) {
        console.error(
            "CHECK DOMPETX PAYMENT ERROR:",
            error
        );
        return json({
            success: false,
            error:
                error?.message ||
                "Terjadi kesalahan"
        }, 500);
    }
}
// ============================================
// DOMPETX CHECK PAYMENT
// ============================================
async function dompetXCheckPayment(
    env,
    paymentId
) {
    if (!paymentId) {
        throw new Error(
            "Payment ID kosong"
        );
    }
    const timestamp =
        Math.floor(
            Date.now() / 1000
        ).toString();
    // GET request menggunakan
    // body kosong untuk signature.
    const bodyString = "{}";
    const signature =
        await hmacSHA256(
            env.DOMPAY_API_KEY,
            `${timestamp}.${bodyString}`
        );
    const baseUrl =
        normalizeBaseUrl(
            env.DOMPAY_BASE_URL
        );
    const endpoint =
        `${baseUrl}/v1/payments/detail/${encodeURIComponent(paymentId)}`;
    console.log(
        "DOMPETX CHECK URL:",
        endpoint
    );
    const response =
        await fetch(
            endpoint,
            {
                method: "GET",
                headers: {
                    "X-DOMPAY-API-Key":
                        env.DOMPAY_API_KEY,
                    "X-DOMPAY-Timestamp":
                        timestamp,
                    "X-DOMPAY-Signature":
                        signature,
                    "Content-Type":
                        "application/json"
                }
            }
        );
    const text =
        await response.text();
    console.log(
        "DOMPETX CHECK STATUS:",
        response.status
    );
    console.log(
        "DOMPETX CHECK RAW:",
        text
    );
    let data;
    try {
        data =
            JSON.parse(text);
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
    return data;
}
// ============================================
// GET DESTINATION URL
// ============================================
async function getDestinationUrl(
    env,
    linkId
) {
    if (!linkId) {
        return null;
    }
    const links =
        await supabaseRequest(
            env,
            "links",
            "GET",
            null,
            `?id=eq.${encodeURIComponent(linkId)}&select=destination_url,destination,url`
        );
    if (!links.length) {
        return null;
    }
    const link =
        links[0];
    return (
        link.destination_url ||
        link.destination ||
        link.url ||
        null
    );
}
// ============================================
// HMAC SHA256
// ============================================
async function hmacSHA256(
    secret,
    message
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
    return [
        ...new Uint8Array(signature)
    ]
        .map(
            b =>
                b.toString(16)
                    .padStart(2, "0")
        )
        .join("");
}
// ============================================
// SUPABASE RPC
// ============================================
async function supabaseRpc(
    env,
    functionName,
    params = {}
) {
    const response =
        await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/${functionName}`,
            {
                method: "POST",
                headers: {
                    apikey:
                        env.SUPABASE_SERVICE_KEY,
                    Authorization:
                        `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                    "Content-Type":
                        "application/json"
                },
                body:
                    JSON.stringify(params)
            }
        );
    const text =
        await response.text();
    let data;
    try {
        data =
            text
                ? JSON.parse(text)
                : null;
    } catch {
        throw new Error(
            "RPC response bukan JSON:\n" +
            text
        );
    }
    if (!response.ok) {
        throw new Error(
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
// ============================================
// NORMALIZE BASE URL
// ============================================
function normalizeBaseUrl(
    url
) {
    return String(url || "")
        .replace(/\/+$/, "");
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
                    "application/json",
                "Cache-Control":
                    "no-store"
            }
        }
    );
}
