// ===============================
// BAYAR.GG CREATE PAYMENT
// ===============================

async function bayarGGCreatePayment(env, payload) {

    if (!env.BAYARGG_API_KEY) {
        throw new Error("BAYARGG_API_KEY belum diset");
    }

    const response = await fetch(
        "https://www.bayar.gg/api/create-payment.php",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": env.BAYARGG_API_KEY
            },
            body: JSON.stringify({
                amount: Number(payload.amount),
                description: payload.description || "Pembayaran",
                customer_name: payload.customer_name || "",
                customer_email: payload.customer_email || "",
                customer_phone: payload.customer_phone || "",
                callback_url: payload.callback_url || "",
                redirect_url: payload.redirect_url || "",
                payment_url: "https://www.bayar.gg/pay",
                payment_method: "qris"
            })
        }
    );

    const text = await response.text();

    console.log("========== BAYAR.GG ==========");
    console.log("STATUS :", response.status);
    console.log("RAW    :", text);
    console.log("==============================");

    let json;

    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(
            "Response BayarGG bukan JSON:\n\n" + text
        );
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}\n${JSON.stringify(json, null, 2)}`
        );
    }

    if (!json.success) {
        throw new Error(
            json.message ||
            json.error ||
            "Create payment gagal"
        );
    }

    const data = json.data;

    return {
        payment_id: data.payment_id || null,
        invoice_id: data.invoice_id,
        payment_url: data.payment_url,
        qris_string: data.qris_string,
        expires_at: data.expires_at,
        status: data.status,
        amount: data.amount,
        final_amount: data.final_amount
    };

}


// ===============================
// CREATE PAYMENT
// ===============================

export async function onRequestPost(context){

    const { request, env } = context;

    try{

        const body = await request.json();

        const { order_id } = body;

        if(!order_id){
            throw new Error("order_id wajib diisi");
        }

        // =====================
        // GET ORDER
        // =====================

        const orders = await supabaseRequest(
            env,
            "sell_orders",
            "GET",
            null,
            `?id=eq.${order_id}&select=*`
        );

        if(!orders.length){
            throw new Error("Order tidak ditemukan");
        }

        const order = orders[0];

        if(order.status !== "pending"){
            throw new Error("Order sudah diproses");
        }

        const amount = Number(order.price || 0);

        if(amount < 1000){
            throw new Error("Nominal tidak valid");
        }

        // =====================
        // PAYMENT SUDAH ADA
        // =====================

        if(
            order.invoice_id &&
            order.payment_url &&
            order.qris_string &&
            order.expires_at &&
            new Date(order.expires_at) > new Date()
        ){

            return json({
                success:true,
                data:{
                    payment_id:order.payment_id,
                    invoice_id:order.invoice_id,
                    payment_url:order.payment_url,
                    qris_string:order.qris_string,
                    expires_at:order.expires_at
                }
            });

        }

        // =====================
        // CREATE PAYMENT BAYARGG
        // =====================

        const payment = await bayarGGCreatePayment(
            env,
            {
                amount,
                description:`Pembelian Sell Link ${order.link_id}`
            }
        );

        const expiresAt = payment.expires_at ||
            new Date(Date.now()+7*60*1000).toISOString();

        console.log("PAYMENT CREATED",payment);

          // =====================
        // UPDATE ORDER
        // =====================

        const updated = await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                payment_id: payment.payment_id,
                invoice_id: payment.invoice_id,
                payment_url: payment.payment_url,
                qris_string: payment.qris_string,
                expires_at: expiresAt
            },
            `?id=eq.${order_id}`
        );

        console.log("ORDER UPDATED", updated);

        return json({
            success: true,
            data: {
                order_id,
                payment_id: payment.payment_id,
                invoice_id: payment.invoice_id,
                payment_url: payment.payment_url,
                qris_string: payment.qris_string,
                expires_at: expiresAt,
                status: payment.status,
                amount: payment.amount,
                final_amount: payment.final_amount
            }
        });

    }catch(error){

        console.error(
            "CREATE PAYMENT ERROR:",
            error
        );

        return json(
            {
                success:false,
                error:error.message
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
    method="GET",
    body=null,
    query=""
){

    const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/${table}${query}`,
        {
            method,

            headers:{
                apikey:
                    env.SUPABASE_SERVICE_KEY,

                Authorization:
                    `Bearer ${env.SUPABASE_SERVICE_KEY}`,

                "Content-Type":
                    "application/json",

                Prefer:
                    "return=representation"
            },

            body: body
                ? JSON.stringify(body)
                : undefined
        }
    );


    const text =
        await response.text();


    let data=[];


    if(text){

        try{

            data=JSON.parse(text);

        }catch{

            throw new Error(
                "Supabase response bukan JSON:\n"+text
            );

        }

    }


    if(!response.ok){

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



// ===============================
// JSON RESPONSE
// ===============================

function json(
    data,
    status=200
){

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers:{
                "Content-Type":
                    "application/json"
            }
        }
    );

}
