export async function onRequestPost(context){

const {request,env}=context;

try{

const body=JSON.parse(await request.text());

console.log("PAYMENT CALLBACK:",body);

const signature=request.headers.get("X-Webhook-Signature");

if(!signature) throw new Error("Signature kosong");

if(!env.BAYARGG_WEBHOOK_SECRET)
throw new Error("Webhook secret kosong");


const signData=
`${body.invoice_id}|${body.status}|${body.final_amount}|${body.timestamp}`;

const expected=await generateHmac(
signData,
env.BAYARGG_WEBHOOK_SECRET
);

if(signature!==expected)
throw new Error("Signature tidak valid");


if(body.status!=="paid"){
return json({
success:true,
message:"Belum paid"
});
}


// =====================
// FIND ORDER
// =====================

const orders=await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?invoice_id=eq.${body.invoice_id}&select=*`
);

if(!orders.length)
throw new Error("Order tidak ditemukan");


const order=orders[0];


// =====================
// ANTI DOUBLE
// =====================

if(order.balance_processed){

return json({
success:true,
message:"Saldo sudah diproses"
});

}


// =====================
// UPDATE ORDER PAID
// =====================

await supabaseRequest(
env,
"sell_orders",
"PATCH",
{
status:"paid",
paid_at:body.paid_at || new Date().toISOString(),
buyer_id:body.buyer_id || null
},
`?id=eq.${order.id}`
);


// =====================
// GET SELLER
// =====================

const sellers = await supabaseRequest(
    env,
    "users",
    "GET",
    null,
    `?id=eq.${order.seller_id}&select=id,balance,sell_earning_total,sell_earning_month,sell_earning_today`
);


if(!sellers.length)
throw new Error("User seller tidak ditemukan");


const seller=sellers[0];


const receive = Number(order.seller_receive || 0);

const newBalance =
    Number(seller.balance || 0) + receive;

const newSellTotal =
    Number(seller.sell_earning_total || 0) + receive;

const newSellMonth =
    Number(seller.sell_earning_month || 0) + receive;

const newSellToday =
    Number(seller.sell_earning_today || 0) + receive;



// =====================
// UPDATE USER SALDO
// =====================

await supabaseRequest(
    env,
    "users",
    "PATCH",
    {
        balance: newBalance,
        sell_earning_total: newSellTotal,
        sell_earning_month: newSellMonth,
        sell_earning_today: newSellToday
    },
    `?id=eq.${order.seller_id}`
);

// =====================
// LOCK PROCESSED
// =====================

await supabaseRequest(
env,
"sell_orders",
"PATCH",
{
balance_processed:true
},
`?id=eq.${order.id}`
);


console.log(
    "SELL SALDO MASUK",
    {
        seller: order.seller_id,
        receive,
        balance: newBalance,
        sell_earning_total: newSellTotal,
        sell_earning_month: newSellMonth,
        sell_earning_today: newSellToday
    }
);

return json({
    success: true,
    message: "Pembayaran berhasil",
    data: {
        order_id: order.id,
        seller_id: order.seller_id,
        receive,
        balance: newBalance,
        sell_earning_total: newSellTotal,
        sell_earning_month: newSellMonth,
        sell_earning_today: newSellToday
    }
});


}catch(error){

console.error("CALLBACK ERROR:",error);

return json({
success:false,
error:error.message
},500);

}

}


// =====================
// HMAC
// =====================

async function generateHmac(data,secret){

const encoder=new TextEncoder();

const key=await crypto.subtle.importKey(
"raw",
encoder.encode(secret),
{
name:"HMAC",
hash:"SHA-256"
},
false,
["sign"]
);


const signature=await crypto.subtle.sign(
"HMAC",
key,
encoder.encode(data)
);


return Array.from(new Uint8Array(signature))
.map(b=>b.toString(16).padStart(2,"0"))
.join("");

}


// =====================
// SUPABASE REQUEST
// =====================

async function supabaseRequest(
env,
table,
method="GET",
body=null,
query=""
){

const response=await fetch(
`${env.SUPABASE_URL}/rest/v1/${table}${query}`,
{
method,
headers:{
apikey:env.SUPABASE_SERVICE_KEY,
Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,
"Content-Type":"application/json",
Prefer:"return=representation"
},
body:body?JSON.stringify(body):undefined
}
);


const text=await response.text();

let data=[];

try{
data=text?JSON.parse(text):[];
}catch{
throw new Error("Response Supabase bukan JSON");
}


if(!response.ok){
throw new Error(JSON.stringify(data));
}


return data;

}


// =====================
// JSON
// =====================

function json(data,status=200){

return new Response(
JSON.stringify(data),
{
status,
headers:{
"Content-Type":"application/json"
}
}
);

}
