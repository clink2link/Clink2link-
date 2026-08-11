import crypto from "node:crypto";

export async function onRequestGet({ env }) {

    try {

        if (!env.DOMPAY_API_KEY) {
            throw new Error("DOMPAY_API_KEY belum diset");
        }

        if (!env.DOMPAY_BASE_URL) {
            throw new Error("DOMPAY_BASE_URL belum diset");
        }

        const timestamp =
            Math.floor(Date.now() / 1000).toString();

        const body = {
            amount: 5000,
            currency: "IDR",
            reference: "TEST-" + Date.now(),
            redirectUrl: "https://example.com",
            metadata: {
                order_name: "DompetX Test",
                product_name: "Test Product",
                customer_name: "Tester",
                customer_email: "test@example.com"
            }
        };

        const bodyString =
            JSON.stringify(body);

        const signature =
            crypto
                .createHmac(
                    "sha256",
                    env.DOMPAY_API_KEY
                )
                .update(
                    `${timestamp}.${bodyString}`
                )
                .digest("hex");

        const response =
            await fetch(
                `${env.DOMPAY_BASE_URL}/v1/payments/checkout`,
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

        let json;

        try {
            json = JSON.parse(text);
        } catch {
            json = text;
        }

        return new Response(
            JSON.stringify(
                {
                    status: response.status,
                    headers: Object.fromEntries(
                        response.headers.entries()
                    ),
                    response: json
                },
                null,
                2
            ),
            {
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );

    } catch (err) {

        return new Response(
            JSON.stringify(
                {
                    success: false,
                    error: err.message,
                    stack: err.stack
                },
                null,
                2
            ),
            {
                status: 500,
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );

    }

}
