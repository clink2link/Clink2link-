// ============================================================
// CLICK2PAY
// DOMPETX - CHECK PAYMENT CHANNELS
//
// GET /api/payment/channels
//
// Cloudflare Pages Functions
//
// Environment:
// DOMPETX_API_KEY
//
// Endpoint DompetX:
// GET https://api.dompetx.com/v1/payments/channel
// ============================================================
export async function onRequestGet(context) {
    try {
        const { env } = context;
        // =====================================================
        // ENV
        // =====================================================
        const apiKey =
            String(
                env.DOMPETX_API_KEY || ""
            ).trim();
        if (!apiKey) {
            return jsonResponse({
                success:
                    false,
                error:
                    "DOMPETX_API_KEY belum dikonfigurasi di Cloudflare"
            }, 500);
        }
        // =====================================================
        // TIMESTAMP
        // =====================================================
        const timestamp =
            Math.floor(
                Date.now() / 1000
            ).toString();
        // =====================================================
        // BODY
        //
        // GET /payments/channel
        // DompetX menggunakan "{}" untuk signature.
        // =====================================================
        const body =
            "{}";
        // =====================================================
        // SIGNATURE
        //
        // timestamp + "." + body
        //
        // HMAC-SHA256
        // key = DOMPETX_API_KEY
        // =====================================================
        const signatureData =
            `${timestamp}.${body}`;
        const signature =
            await generateHmacSha256(
                signatureData,
                apiKey
            );
        // =====================================================
        // REQUEST DOMPETX
        // =====================================================
        console.log(
            "DOMPETX CHANNEL CHECK"
        );
        const response =
            await fetch(
                "https://api.dompetx.com/v1/payments/channel",
                {
                    method:
                        "GET",
                    headers: {
                        "X-DOMPAY-API-Key":
                            apiKey,
                        "X-DOMPAY-Signature":
                            signature,
                        "X-DOMPAY-Timestamp":
                            timestamp,
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        // =====================================================
        // READ RESPONSE
        // =====================================================
        const responseText =
            await response.text();
        let data;
        try {
            data =
                JSON.parse(
                    responseText
                );
        } catch {
            console.error(
                "DOMPETX CHANNEL NON JSON:",
                responseText
            );
            return jsonResponse({
                success:
                    false,
                error:
                    "Response DompetX bukan JSON",
                status:
                    response.status,
                detail:
                    responseText.substring(
                        0,
                        3000
                    )
            }, 502);
        }
        // =====================================================
        // LOG RESPONSE
        // =====================================================
        console.log(
            "DOMPETX CHANNEL RESPONSE:",
            data
        );
        // =====================================================
        // DOMPETX ERROR
        // =====================================================
        if (
            !response.ok
        ) {
            const errorMessage =
                data?.message ||
                data?.error ||
                data?.data?.message ||
                data?.data?.error ||
                "Gagal mengambil payment channels";
            return jsonResponse({
                success:
                    false,
                error:
                    errorMessage,
                status:
                    response.status,
                detail:
                    data
            }, response.status);
        }
        // =====================================================
        // NORMALIZE DATA
        //
        // Bisa berupa:
        //
        // {
        //     data: [...]
        // }
        //
        // atau:
        //
        // [...]
        //
        // atau object lainnya.
        // =====================================================
        const channels =
            Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.channels)
                        ? data.channels
                        : Array.isArray(data?.data?.channels)
                            ? data.data.channels
                            : data;
        // =====================================================
        // CARI QRIS
        // =====================================================
        let qris = null;
        if (
            Array.isArray(channels)
        ) {
            qris =
                channels.find(
                    channel => {
                        const code =
                            String(
                                channel?.code ||
                                channel?.method ||
                                channel?.channel ||
                                channel?.id ||
                                ""
                            )
                                .trim()
                                .toUpperCase();
                        const name =
                            String(
                                channel?.name ||
                                channel?.label ||
                                channel?.title ||
                                ""
                            )
                                .trim()
                                .toUpperCase();
                        return (
                            code === "QRIS" ||
                            name.includes("QRIS")
                        );
                    }
                ) || null;
        }
        // =====================================================
        // RETURN
        // =====================================================
        return jsonResponse({
            success:
                true,
            status:
                response.status,
            qris_available:
                Boolean(
                    qris
                ),
            qris:
                qris,
            channels:
                channels,
            raw:
                data
        }, 200);
    } catch (error) {
        console.error(
            "CHECK DOMPETX CHANNEL ERROR:",
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
// Cloudflare Web Crypto API
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
            data,
            null,
            2
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
