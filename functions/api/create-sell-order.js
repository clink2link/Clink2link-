export async function onRequestPost(context) {

    const { request, env } = context;

    try {

        const body = await request.json();

        const {
            link_id,
            seller_id,
            buyer_id = null
        } = body;

        if (!link_id) {
            throw new Error("link_id wajib diisi");
        }

        if (!seller_id) {
            throw new Error("seller_id wajib diisi");
        }

        // =====================
        // GET LINK
        // =====================

        const links = await supabaseRequest(
            env,
            "links",
            "GET",
            null,
            `?id=eq.${link_id}&select=*`
        );

        if (!links.length) {
            throw new Error("Link tidak ditemukan");
        }

        const link = links[0];

        if (link.status !== "active") {
            throw new Error("Link tidak aktif");
        }

        const amount = Number(link.price || 0);

        if (amount < 1000) {
            throw new Error("Harga link tidak valid");
        }

        // =====================
        // VALIDASI SELLER
        // =====================

        const sellers = await supabaseRequest(
            env,
            "users",
            "GET",
            null,
            `?id=eq.${seller_id}&select=id`
        );

        if (!sellers.length) {
            throw new Error("Seller tidak ditemukan");
        }

        // =====================
        // HITUNG FEE
        // =====================

        const marketFee =
            Number(env.MARKET_FEE || 20);

        const fee =
            Math.floor(
                amount * marketFee / 100
            );

        const seller_receive =
            amount - fee;

        // =====================
        // INSERT ORDER
        // =====================

        const order = await supabaseRequest(
            env,
            "sell_orders",
            "POST",
            {
                link_id,
                seller_id,
                buyer_id,
                price: amount,
                fee,
                seller_receive,
                status: "pending"
            }
        );

        return json({
            success: true,
            data: order[0]
        });

    } catch (error) {

        console.error(
            "CREATE SELL ORDER ERROR:",
            error
        );

        return json({
            success: false,
            error: error.message
        }, 500);

    }

}

async function supabaseRequest(
    env,
    table,
    method = "GET",
    body = null,
    query = ""
) {

    const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/${table}${query}`,
        {
            method,
            headers: {
                apikey: env.SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=representation"
            },
            body: body
                ? JSON.stringify(body)
                : undefined
        }
    );

    const text = await response.text();

    let data = [];

    if (text) {
        data = JSON.parse(text);
    }

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;

}

function json(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

}
