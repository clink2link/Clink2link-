// ============================================================
// CLICK2PAY
// DOMPETX PAYMENT STATUS CHECKER
//
// GET /api/payment/status?order_id=UUID_ORDER
//
// FLOW:
//
// 1. Ambil sell_orders
// 2. Ambil payment_id / invoice_id
// 3. Jika kosong -> fallback reference CLP-{order_id}
// 4. Cek status DompetX
// 5. Jika paid:
//      -> validasi nominal
//      -> process_sell_payment(order_id)
//      -> saldo seller masuk
//      -> order menjadi paid
//      -> ambil destination URL
// 6. Return redirect_url
//
// ENV:
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
            String(env.DOMPETX_API_KEY || "").trim();

        const supabaseUrl =
            String(env.SUPABASE_URL || "").trim();

        const supabaseKey =
            String(env.SUPABASE_SERVICE_KEY || "").trim();

        if (!apiKey) {
            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi di Cloudflare"
            }, 500);
        }

        if (!supabaseUrl) {
            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "SUPABASE_URL belum dikonfigurasi"
            }, 500);
        }

        if (!supabaseKey) {
            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "SUPABASE_SERVICE_KEY belum dikonfigurasi"
            }, 500);
        }

        // =====================================================
        // GET ORDER ID
        // =====================================================

        const requestUrl =
            new URL(request.url);

        const orderId =
            String(
                requestUrl.searchParams.get("order_id") || ""
            ).trim();

        if (!orderId) {
            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "order_id wajib diisi"
            }, 400);
        }

        // =====================================================
        // GET SELL ORDER
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
                JSON.parse(orderText);
        } catch {
            console.error(
                "SUPABASE ORDER NON JSON:",
                orderText
            );

            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
                error:
                    "Response Supabase bukan JSON",
                detail:
                    orderText.substring(
                        0,
                        2000
                    )
            }, 502);
        }

        if (!orderResponse.ok) {
            console.error(
                "SUPABASE ORDER ERROR:",
                orders
            );

            return jsonResponse({
                success: false,
                paid: false,
                processed: false,
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
                paid: false,
                processed: false,
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

        // =====================================================
        // JIKA ORDER SUDAH PAID
        // =====================================================

        if (
            [
                "paid",
                "completed",
                "success",
                "settlement"
            ].includes(orderStatus)
        ) {
            const destination =
                await getDestinationUrl(
                    supabaseUrl,
                    supabaseKey,
                    order.link_id
                );

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
                        order.paid_at || null,

                    redirect_url:
                        destination,

                    destination_url:
                        destination
                }
            }, 200);
        }

        // =====================================================
        // PAYMENT ID
        // =====================================================

        const paymentId =
            String(
                order.payment_id ||
                order.dompetx_payment_id ||
                ""
            ).trim();

        // =====================================================
        // REFERENCE
        //
        // Prioritas:
        //
        // 1. invoice_id
        // 2. reference
        // 3. fallback CLP-{orderId}
        //
        // Ini penting karena sebelumnya database kamu
        // ternyata belum menyimpan payment_id/reference.
        // =====================================================

        const storedReference =
            String(
                order.invoice_id ||
                order.reference ||
                ""
            ).trim();

        const reference =
            storedReference ||
            `CLP-${orderId}`;

        console.log(
            "PAYMENT IDENTIFIER:",
            {
                order_id:
                    orderId,

                payment_id:
                    paymentId || null,

                stored_reference:
                    storedReference || null,

                effective_reference:
                    reference,

                fallback_used:
                    !storedReference
            }
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
        // GET request menggunakan "{}"
        // =====================================================

        const dompetBodyString =
            "{}";

        const signatureData =
            `${timestamp}.${dompetBodyString}`;

        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );

        // =====================================================
        // DOMPETX STATUS URL
        //
        // PAYMENT ID > REFERENCE
        // =====================================================

        let statusUrl;

        if (paymentId) {
            statusUrl =
                `https://api.dompetx.com/v1/payments/check-status/${encodeURIComponent(
                    paymentId
                )}`;
        } else {
            statusUrl =
                `https://api.dompetx.com/v1/payments/check-status?reference=${encodeURIComponent(
                    reference
                )}`;
        }

        console.log(
            "DOMPETX STATUS CHECK:",
            {
                order_id:
                    orderId,

                payment_id:
                    paymentId || null,

                reference:
                    reference,

                mode:
                    paymentId
                        ? "payment_id"
                        : "reference"
            }
        );

        // =====================================================
        // CALL DOMPETX
        // =====================================================

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

        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "DOMPETX STATUS DEBUG:",
            {
                status:
                    dompetResponse.status,

                content_type:
                    dompetResponse.headers.get(
                        "content-type"
                    ),

                requested_url:
                    statusUrl,

                final_url:
                    dompetResponse.url,

                preview:
                    dompetText.substring(
                        0,
                        1000
                    )
            }
        );

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
                "DOMPETX STATUS NON JSON:",
                dompetText.substring(
                    0,
                    3000
                )
            );

            return jsonResponse({
                success: false,
                paid: false,
                processed: false,

                error:
                    "Response cek payment bukan JSON",

                status:
                    dompetResponse.status,

                detail:
                    dompetText.substring(
                        0,
                        3000
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
            const errorMessage =
                dompetData?.message ||
                dompetData?.error ||
                dompetData?.data?.message ||
                dompetData?.data?.error ||
                "Gagal mengecek status pembayaran DompetX";

            return jsonResponse({
                success: false,
                paid: false,
                processed: false,

                error:
                    errorMessage,

                status:
                    dompetResponse.status,

                detail:
                    dompetData
            }, dompetResponse.status);
        }

        // =====================================================
        // NORMALIZE PAYMENT DATA
        // =====================================================

        const payment =
            dompetData?.data &&
            typeof dompetData.data === "object"
                ? dompetData.data
                : (
                    dompetData?.payment &&
                    typeof dompetData.payment === "object"
                        ? dompetData.payment
                        : dompetData
                );

        // =====================================================
        // PAYMENT STATUS
        // =====================================================

        const paymentStatus =
            String(
                payment?.status ||
                payment?.payment_status ||
                payment?.paymentStatus ||
                payment?.transaction_status ||
                dompetData?.status ||
                ""
            )
                .trim()
                .toLowerCase();

        // =====================================================
        // PAYMENT ID DARI DOMPETX
        // =====================================================

        const returnedPaymentId =
            payment?.paymentId ||
            payment?.payment_id ||
            payment?.id ||
            payment?.transactionId ||
            payment?.transaction_id ||
            dompetData?.paymentId ||
            dompetData?.payment_id ||
            paymentId ||
            null;

        // =====================================================
        // AMOUNT
        // =====================================================

        const paymentAmount =
            Number(
                payment?.amount ??
                dompetData?.amount ??
                0
            );

        // =====================================================
        // REFERENCE
        // =====================================================

        const paymentReference =
            payment?.reference ||
            dompetData?.reference ||
            reference ||
            null;

        // =====================================================
        // LOG NORMALIZED
        // =====================================================

        console.log(
            "NORMALIZED DOMPETX PAYMENT:",
            {
                order_id:
                    orderId,

                payment_id:
                    returnedPaymentId,

                reference:
                    paymentReference,

                amount:
                    paymentAmount,

                status:
                    paymentStatus
            }
        );

        // =====================================================
        // PAID STATUS
        // =====================================================

        const paidStatuses = [
            "paid",
            "success",
            "successful",
            "completed",
            "complete",
            "settled",
            "settlement",
            "berhasil"
        ];

        const isPaid =
            paidStatuses.includes(
                paymentStatus
            );

        // =====================================================
        // BELUM BAYAR
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
                        returnedPaymentId,

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
        // VALIDATE ORDER AMOUNT
        // =====================================================

        const orderAmount =
            Number(
                order.price
            );

        if (
            !Number.isInteger(orderAmount) ||
            orderAmount < 1000
        ) {
            console.error(
                "INVALID ORDER AMOUNT:",
                {
                    order_id:
                        orderId,

                    order_amount:
                        orderAmount
                }
            );

            return jsonResponse({
                success: false,
                paid: true,
                processed: false,

                error:
                    "Harga order tidak valid",

                data: {
                    order_id:
                        orderId,

                    order_amount:
                        orderAmount
                }
            }, 409);
        }

        // =====================================================
        // VALIDATE PAYMENT AMOUNT
        // =====================================================

        if (
            !Number.isInteger(paymentAmount) ||
            paymentAmount !== orderAmount
        ) {
            console.error(
                "DOMPETX AMOUNT MISMATCH:",
                {
                    order_id:
                        orderId,

                    order_amount:
                        orderAmount,

                    payment_amount:
                        paymentAmount,

                    payment_status:
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
        // RPC HARUS IDEMPOTENT.
        //
        // Artinya kalau status endpoint dipanggil 10x,
        // seller hanya menerima saldo 1x.
        // =====================================================

        console.log(
            "PROCESS SELL PAYMENT:",
            {
                order_id:
                    orderId,

                payment_id:
                    returnedPaymentId,

                amount:
                    paymentAmount
            }
        );

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
                    "Pembayaran berhasil tetapi response RPC bukan JSON",

                detail:
                    rpcText.substring(
                        0,
                        3000
                    )
            }, 502);
        }

        console.log(
            "PROCESS SELL PAYMENT RESPONSE:",
            rpcData
        );

        // =====================================================
        // RPC ERROR
        // =====================================================

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
        // RPC SUCCESS
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
                        returnedPaymentId,

                    payment_status:
                        paymentStatus,

                    rpc:
                        rpcData
                }
            }, 500);
        }

        // =====================================================
        // GET DESTINATION
        // =====================================================

        const destination =
            await getDestinationUrl(
                supabaseUrl,
                supabaseKey,
                order.link_id
            );

        // =====================================================
        // SUCCESS
        // =====================================================

        console.log(
            "PAYMENT COMPLETED:",
            {
                order_id:
                    orderId,

                payment_id:
                    returnedPaymentId,

                reference:
                    paymentReference,

                amount:
                    paymentAmount,

                destination:
                    destination
            }
        );

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
                    returnedPaymentId,

                reference:
                    paymentReference,

                payment_status:
                    paymentStatus,

                amount:
                    paymentAmount,

                seller_receive:
                    rpcData?.seller_receive ??
                    null,

                redirect_url:
                    destination,

                destination_url:
                    destination,

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
            paid: false,
            processed: false,

            error:
                "Terjadi kesalahan server",

            message:
                error?.message ||
                "Unknown error"
        }, 500);
    }
}

// ============================================================
// GET DESTINATION URL
// ============================================================

async function getDestinationUrl(
    supabaseUrl,
    supabaseKey,
    linkId
) {
    if (!linkId) {
        return null;
    }

    try {
        const response =
            await fetch(
                `${supabaseUrl}/rest/v1/links?id=eq.${encodeURIComponent(
                    linkId
                )}&select=destination_url,destination`,
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

        if (!response.ok) {
            console.error(
                "GET DESTINATION ERROR:",
                await response.text()
            );

            return null;
        }

        const data =
            await response.json();

        if (
            !Array.isArray(data) ||
            !data.length
        ) {
            return null;
        }

        return (
            data[0].destination_url ||
            data[0].destination ||
            null
        );

    } catch (error) {

        console.error(
            "DESTINATION ERROR:",
            error
        );

        return null;
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
