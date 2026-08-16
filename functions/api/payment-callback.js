// ==========================================
// DOMPETX WEBHOOK - SELL LINK
// ==========================================
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        // ==========================================
        // READ WEBHOOK
        // ==========================================
        const body = await request.json();
        console.log("=================================");
        console.log("DOMPETX WEBHOOK RECEIVED");
        console.log(JSON.stringify(body, null, 2));
        console.log("=================================");
        // ==========================================
        // VALIDATE PAYLOAD
        // ==========================================
        const data = body?.data;
        if (!data) {
            console.error(
                "DOMPETX DATA TIDAK ADA"
            );
            // Tetap 200 supaya DompetX
            // tidak melakukan retry
            return json({
                success: true,
                message:
                    "Payload diterima tetapi data kosong"
            });
        }
        // ==========================================
        // PAYMENT DATA
        // ==========================================
        const paymentId =
            data.id ||
            data.paymentId ||
            body.paymentId ||
            null;
        const reference =
            data.reference ||
            body.reference ||
            null;
        const amount =
            Number(data.amount || 0);
        const status =
            String(
                data.status || ""
            )
                .trim()
                .toLowerCase();
        const eventType =
            body.eventType ||
            null;
        console.log(
            "DOMPETX PAYMENT:",
            {
                paymentId,
                reference,
                amount,
                status,
                eventType
            }
        );
        // ==========================================
        // EVENT TYPE
        // ==========================================
        if (
            eventType &&
            eventType !== "deposit"
        ) {
            console.log(
                "EVENT DIABAIKAN:",
                eventType
            );
            return json({
                success: true,
                message:
                    "Event tidak diproses",
                eventType
            });
        }
        // ==========================================
        // REFERENCE WAJIB
        // ==========================================
        if (!reference) {
            console.error(
                "REFERENCE DOMPETX TIDAK ADA"
            );
            return json({
                success: true,
                message:
                    "Reference tidak ditemukan"
            });
        }
        // ==========================================
        // STATUS PAYMENT
        // ==========================================
        const paidStatuses = [
            "paid",
            "success",
            "completed",
            "settlement",
            "berhasil"
        ];
        if (!paidStatuses.includes(status)) {
            console.log("PAYMENT BELUM PAID:", status);
            return json({success:true,message:"Payment belum paid",status,reference});
        }

        // Never trust a public webhook body for money movement. Confirm the
        // transaction directly with DompetX before changing Click2Pay state.
        const verified = await verifyDompetXPayment(env, paymentId, reference);
        if (!verified.paid) return json({success:true,message:"Payment not confirmed by provider",status:verified.status||status,reference});
        if (verified.reference && String(verified.reference) !== String(reference)) {
            return json({success:false,error:"Payment reference mismatch"},400);
        }
        if (Number.isFinite(verified.amount)) {
            // Use provider-confirmed amount from this point forward.
            // The local order amount is still checked below.
            console.log("DOMPETX VERIFIED AMOUNT:", verified.amount);
        }
        // ==========================================
        // PREMIUM ORDER
        // ==========================================
        if (String(reference).startsWith("PREM-")) {
            const orders = await supabaseRequest(
                env, "premium_orders", "GET", null,
                `?invoice_id=eq.${encodeURIComponent(reference)}&select=*`
            );
            if (!orders.length) return json({success:true,message:"Premium order not found"});
            const order=orders[0];
            if (order.status === "paid") return json({success:true,already_processed:true});
            if (Number(verified.amount) !== Number(order.amount)) return json({success:false,error:"Premium payment amount mismatch"},400);
            const rpcUrl=`${env.SUPABASE_URL}/rest/v1/rpc/process_premium_payment`;
            const rpc=await fetch(rpcUrl,{method:"POST",headers:{"apikey":env.SUPABASE_SERVICE_KEY,"Authorization":`Bearer ${env.SUPABASE_SERVICE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_order_id:order.id})});
            const result=await rpc.json().catch(()=>({}));
            if(!rpc.ok || result?.success===false) throw new Error(result?.error||"Premium processing failed");
            await supabaseRequest(env,"premium_orders","PATCH",JSON.stringify({payment_id:String(paymentId||""),status:"paid",paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}),`?id=eq.${encodeURIComponent(order.id)}`);
            return json({success:true,type:"premium",order_id:order.id,expires_at:result.expires_at});
        }

        // ==========================================
        // FIND SELL ORDER
        // ==========================================
        const orders =
            await supabaseRequest(
                env,
                "sell_orders",
                "GET",
                null,
                `?invoice_id=eq.${encodeURIComponent(
                    reference
                )}&select=*`
            );
        if (!orders.length) {
            console.error(
                "ORDER TIDAK DITEMUKAN:",
                reference
            );
            /*
             * Reference tidak ada.
             *
             * Kita tetap 200 supaya DompetX
             * tidak melakukan retry tanpa akhir.
             */
            return json({
                success: true,
                message:
                    "Order tidak ditemukan",
                reference
            });
        }
        const order =
            orders[0];
        console.log(
            "SELL ORDER FOUND:",
            JSON.stringify(
                order,
                null,
                2
            )
        );
        // ==========================================
        // ANTI DOUBLE PAYMENT
        // ==========================================
        if (
            order.balance_processed === true
        ) {
            console.log(
                "ORDER SUDAH DIPROSES:",
                order.id
            );
            // Ambil destination URL
            const destinationUrl =
                await getDestinationUrl(
                    env,
                    order.link_id
                );
            return json({
                success: true,
                message:
                    "Order sudah diproses",
                data: {
                    order_id:
                        order.id,
                    payment_id:
                        paymentId ||
                        order.payment_id ||
                        null,
                    invoice_id:
                        reference,
                    status:
                        "paid",
                    destination_url:
                        destinationUrl
                }
            });
        }
        // ==========================================
        // VALIDATE ORDER AMOUNT
        // ==========================================
        const orderAmount =
            Number(
                order.price || 0
            );
        if (
            !Number.isFinite(
                orderAmount
            ) ||
            orderAmount <= 0
        ) {
            throw new Error(
                "Harga order tidak valid"
            );
        }
        // ==========================================
        // VALIDATE PAYMENT AMOUNT
        // ==========================================
        if (
            amount <= 0
        ) {
            throw new Error(
                "Nominal dari DompetX tidak valid"
            );
        }
        if (
            Number(verified.amount) !== orderAmount
        ) {
            console.error(
                "NOMINAL TIDAK SESUAI:",
                {
                    provider_amount:
                        verified.amount,
                    order_amount:
                        orderAmount,
                    order_id:
                        order.id
                }
            );
            /*
             * Jangan berikan saldo
             * apabila nominal berbeda.
             */
            return json({
                success: false,
                error:
                    "Nominal pembayaran tidak sesuai",
                data: {
                    order_id:
                        order.id,
                    expected:
                        orderAmount,
                    received:
                        verified.amount
                }
            }, 400);
        }
        // ==========================================
        // SELLER ID
        // ==========================================
        if (!order.seller_id) {
            throw new Error(
                "Seller ID tidak ditemukan"
            );
        }
        // ==========================================
        // SELLER RECEIVE
        // ==========================================
        const receive =
            Number(
                order.seller_receive || 0
            );
        if (
            !Number.isFinite(
                receive
            ) ||
            receive < 0
        ) {
            throw new Error(
                "seller_receive tidak valid"
            );
        }
        // ==========================================
        // GET SELLER
        // ==========================================
        const sellers =
            await supabaseRequest(
                env,
                "profiles",
                "GET",
                null,
                `?id=eq.${encodeURIComponent(
                    order.seller_id
                )}&select=id,balance,sell_earning_total,sell_earning_month,sell_earning_today`
            );
        if (!sellers.length) {
            throw new Error(
                "User seller tidak ditemukan"
            );
        }
        const seller =
            sellers[0];
        // ==========================================
        // CURRENT SELLER VALUES
        // ==========================================
        const currentBalance =
            Number(
                seller.balance || 0
            );
        const currentTotal =
            Number(
                seller.sell_earning_total || 0
            );
        const currentMonth =
            Number(
                seller.sell_earning_month || 0
            );
        const currentToday =
            Number(
                seller.sell_earning_today || 0
            );
        // ==========================================
        // CALCULATE NEW BALANCE
        // ==========================================
        const newBalance =
            currentBalance +
            receive;
        const newSellTotal =
            currentTotal +
            receive;
        const newSellMonth =
            currentMonth +
            receive;
        const newSellToday =
            currentToday +
            receive;
        // ==========================================
        // UPDATE ORDER → PAID
        // ==========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                status:
                    "paid",
                payment_id:
                    paymentId ||
                    order.payment_id ||
                    null,
                paid_at:
                    new Date()
                        .toISOString()
            },
            `?id=eq.${encodeURIComponent(
                order.id
            )}`
        );
        console.log(
            "ORDER STATUS UPDATED: PAID"
        );
        // ==========================================
        // UPDATE SELLER BALANCE
        // ==========================================
        await supabaseRequest(
            env,
            "profiles",
            "PATCH",
            {
                balance:
                    newBalance,
                sell_earning_total:
                    newSellTotal,
                sell_earning_month:
                    newSellMonth,
                sell_earning_today:
                    newSellToday
            },
            `?id=eq.${encodeURIComponent(
                order.seller_id
            )}`
        );
        console.log(
            "SELLER BALANCE UPDATED:",
            {
                seller_id:
                    order.seller_id,
                receive,
                old_balance:
                    currentBalance,
                new_balance:
                    newBalance,
                sell_earning_total:
                    newSellTotal,
                sell_earning_month:
                    newSellMonth,
                sell_earning_today:
                    newSellToday
            }
        );
        // ==========================================
        // LOCK BALANCE PROCESSED
        // ==========================================
        await supabaseRequest(
            env,
            "sell_orders",
            "PATCH",
            {
                balance_processed:
                    true
            },
            `?id=eq.${encodeURIComponent(
                order.id
            )}`
        );
        console.log(
            "BALANCE PROCESSED LOCKED"
        );
        // ==========================================
        // GET DESTINATION URL
        // ==========================================
        const destinationUrl =
            await getDestinationUrl(
                env,
                order.link_id
            );
        // ==========================================
        // FINAL LOG
        // ==========================================
        console.log(
            "================================="
        );
        console.log(
            "DOMPETX SELL PAYMENT SUCCESS"
        );
        console.log({
            order_id:
                order.id,
            payment_id:
                paymentId,
            reference,
            amount,
            seller_id:
                order.seller_id,
            receive,
            balance:
                newBalance,
            destination_url:
                destinationUrl
        });
        console.log(
            "=================================");
        // ==========================================
        // RESPONSE 200
        // ==========================================
        return json({
            success: true,
            message:
                "Pembayaran berhasil diproses",
            data: {
                order_id:
                    order.id,
                payment_id:
                    paymentId,
                invoice_id:
                    reference,
                status:
                    "paid",
                seller_id:
                    order.seller_id,
                receive,
                balance:
                    newBalance,
                destination_url:
                    destinationUrl
            }
        });
    } catch (error) {
        console.error(
            "================================="
        );
        console.error(
            "DOMPETX WEBHOOK ERROR:"
        );
        console.error(
            error
        );
        console.error(
            "================================="
        );
        /*
         * Error internal → 500.
         *
         * DompetX akan melakukan retry
         * sesuai mekanisme webhook-nya.
         */
        return json({
            success: false,
            error:
                error?.message ||
                "Webhook error"
        }, 500);
    }
}
// ==========================================
// GET DESTINATION URL
// ==========================================
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
            `?id=eq.${encodeURIComponent(
                linkId
            )}&select=destination_url,destination,url`
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
// ==========================================
// SUPABASE REQUEST
// ==========================================
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
// ==========================================
// JSON RESPONSE
// ==========================================
async function verifyDompetXPayment(env,paymentId,reference){
    const apiKey=String(env.DOMPETX_API_KEY||"").trim();
    if(!apiKey) throw new Error("DOMPETX_API_KEY belum dikonfigurasi");
    const timestamp=Math.floor(Date.now()/1000).toString();
    const signature=await hmacSha256(`${timestamp}.{}`,apiKey);
    const url=paymentId
      ? `https://api.dompetx.com/v1/payments/check-status/${encodeURIComponent(paymentId)}`
      : `https://api.dompetx.com/v1/payments/check-status?reference=${encodeURIComponent(reference)}`;
    const r=await fetch(url,{headers:{"Content-Type":"application/json","X-DOMPAY-API-Key":apiKey,"X-DOMPAY-Signature":signature,"X-DOMPAY-Timestamp":timestamp}});
    const raw=await r.text();let body={};try{body=JSON.parse(raw)}catch{}
    if(!r.ok) throw new Error(body?.message||body?.error||"DompetX verification failed");
    const d=body?.data&&typeof body.data==="object"?body.data:body;
    const st=String(d?.status||d?.payment_status||d?.paymentStatus||"").toLowerCase();
    return {paid:["paid","success","successful","completed","complete","settlement","settled","berhasil"].includes(st),status:st,amount:Number(d?.amount??d?.gross_amount??d?.total_amount),reference:d?.reference||reference};
}
async function hmacSha256(message,secret){
    const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
    const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));
    return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
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
