// ============================================
// CREATE DOMPETX CHECKOUT PAYMENT
// Click2Pay / Sell Link
// Endpoint:
// POST /api/create-payment
//
// DompetX:
// POST https://api.dompetx.com/v1/payments/checkout
// ============================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
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
        console.log("================================");
        console.log("CREATE DOMPETX CHECKOUT");
        console.log(JSON.stringify(body, null, 2));
        console.log("================================");
        // ========================================
        // ORDER ID
        // ========================================
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
        // ENVIRONMENT
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
        const order = orders[0];
        console.log(
            "SELL ORDER:",
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
        // REFERENCE
        //
        // JANGAN menggunakan reference lama
        // karena DompetX menolak duplicate reference.
        //
        // Setiap pembuatan checkout harus
        // mempunyai reference baru.
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
        // Setelah pembayaran selesai,
        // DompetX akan mengarahkan kembali
        // ke halaman sell link.
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
        // METADATA
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
        // Gunakan secret jika tersedia.
        // ========================================
        const signatureSecret =
            env.DOMPETX_API_SECRET ||
            env.DOMPAY_API_SECRET ||
            apiKey;
        const signature =
            await generateSignature(
                `${timestamp}.${rawBody}`,
                signatureSecret
            );
        console.log(
            "DOMPETX CHECKOUT REQUEST:",
            {
                amount,
                reference,
                redirectUrl,
                timestamp
            }
        );
        // ========================================
        // CALL DOMPETX
        //
        // Endpoint SESUAI DOKUMENTASI
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
                            "Accept":
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
                "DOMPETX FETCH ERROR:",
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
        // READ DOMPETX RESPONSE
        //
        // Jangan langsung JSON.parse.
        // Cek content-type terlebih dahulu.
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
            responseText
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
                "DOMPETX RESPONSE BUKAN JSON"
            );
            return json({
                success:
                    false,
                error:
                    response.ok
                        ? "Response DompetX bukan JSON"
                        : `DompetX HTTP ${response.status}`,
                details:
                    responseText
                        .slice(0, 3000)
            }, response.ok ? 502 : response.status);
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
        } catch {
            return json({
                success:
                    false,
                error:
                    "Response DompetX JSON tidak valid",
                details:
                    responseText
                        .slice(0, 3000)
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
        // DOMPETX ERROR
        // ========================================
        if (!response.ok) {
            const dompetxError =
                dompetx?.message ||
                dompetx?.error ||
                dompetx?.detail ||
                `DompetX HTTP ${response.status}`;
            console.error(
                "DOMPETX PAYMENT ERROR:",
                dompetxError
            );
            return json({
                success:
                    false,
                error:
                    dompetxError,
                details:
                    dompetx,
                reference:
                    reference
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
        //
        // DARI DOKUMENTASI:
        //
        // payment_link:
        // https://checkout.dompetx.com/checkoutV2?refId=...
        // ========================================
        const paymentLink =
            dompetx?.payment_link ||
            dompetx?.paymentLink ||
            null;
        if (!paymentLink) {
            console.error(
                "DOMPETX PAYMENT LINK TIDAK ADA"
            );
            return json({
                success:
                    false,
                error:
                    "Payment link DompetX tidak ditemukan",
                details:
                    dompetx,
                reference:
                    reference,
                payment_id:
                    paymentId
            }, 502);
        }
        // ========================================
        // EXPIRES
        // ========================================
        const expiresAt =
            dompetx?.expiresAt ||
            dompetx?.expires_at ||
            null;
        // ========================================
        // SAVE PAYMENT
        //
        // invoice_id = reference
        // payment_id = DompetX payment ID
        // payment_link = checkout URL
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
                        paymentLink
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
                "GAGAL SAVE PAYMENT DATA:",
                saveError
            );
            /*
             * Jangan menghapus payment_link
             * dari response.
             *
             * Payment sudah berhasil dibuat
             * di DompetX.
             */
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
                paymentLink
        });
        console.log(
            "================================"
        );
        // ========================================
        // RESPONSE FRONTEND
        // ========================================
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
    const response =
        await fetch(
            `${env.SUPABASE_URL}/rest/v1/${table}${query}`,
            {
                method:
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
            status:
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
