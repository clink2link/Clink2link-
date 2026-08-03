/**
 * CLICK2PAY WORKER
 * Cloudflare Workers Backend
 *
 * Routes:
 * POST /api/create-sell-order
 * POST /api/create-payment
 * POST /api/payment-callback
 * GET  /api/check-payment
 */

export default {
async fetch(request,env){

const url=new URL(request.url);

if(request.method==="OPTIONS"){
return new Response(null,{
headers:corsHeaders()
});
}

try{

if(url.pathname==="/api/create-sell-order"&&request.method==="POST"){
return await createSellOrder(request,env);
}

if(url.pathname==="/api/create-payment"&&request.method==="POST"){
return await createPayment(request,env);
}

if(url.pathname==="/api/payment-callback"&&request.method==="POST"){
return await paymentCallback(request,env);
}

if(url.pathname==="/api/check-payment"&&request.method==="GET"){
return await checkPayment(request,env);
}

return jsonResponse({
success:false,
message:"Endpoint tidak ditemukan"
},404);

}catch(error){

console.error(error);

return jsonResponse({
success:false,
error:error.message
},500);

}

}
};


// =================================
// RESPONSE HELPER
// =================================

function corsHeaders(){

return {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Headers":"Content-Type, Authorization",
"Access-Control-Allow-Methods":"GET,POST,OPTIONS",
"Content-Type":"application/json"
};

}


function jsonResponse(data,status=200){

return new Response(
JSON.stringify(data),
{
status,
headers:corsHeaders()
}
);

}


// =================================
// SUPABASE HELPER
// =================================

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
"apikey":env.SUPABASE_SERVICE_KEY,
"Authorization":`Bearer ${env.SUPABASE_SERVICE_KEY}`,
"Content-Type":"application/json",
"Prefer":"return=representation"
},
body:body?JSON.stringify(body):undefined
}
);


const text=await response.text();

let data;

try{
data=JSON.parse(text);
}catch{
data=text;
}


if(!response.ok){
throw new Error(JSON.stringify(data));
}


return data;

}


// =================================
// BAYARGG CREATE PAYMENT HELPER
// =================================

async function bayarGGCreatePayment(
env,
payload
){

const response=await fetch(
"https://www.bayar.gg/api/create-payment.php",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"X-API-Key":env.BAYARGG_API_KEY
},
body:JSON.stringify(payload)
}
);


const data=await response.json();


if(!data.success){
throw new Error("BayarGG payment gagal");
}


return data.data;

}



// =================================
// CREATE SELL ORDER
// =================================

async function createSellOrder(request,env){

const body=await request.json();

const {
link_id,
seller_id,
buyer_id=null,
price
}=body;


if(!link_id){
throw new Error("link_id wajib diisi");
}

if(!seller_id){
throw new Error("seller_id wajib diisi");
}


const amount=Number(price||0);

if(amount<1000){
throw new Error("Harga tidak valid");
}


// CEK LINK

const links=await supabaseRequest(
env,
"links",
"GET",
null,
`?id=eq.${link_id}&select=*`
);


if(!links.length){
throw new Error("Sell link tidak ditemukan");
}


const link=links[0];


if(
link.link_type!=="sell" &&
link.type!=="sell"
){
throw new Error("Link bukan Sell Link");
}


// HITUNG FEE

const fee=Math.floor(
amount*
(Number(env.MARKET_FEE||20)/100)
);


const seller_receive=amount-fee;


// INSERT ORDER

const order=await supabaseRequest(
env,
"sell_orders",
"POST",
{
link_id,
seller_id,
buyer_id,
price:amount,
fee,
seller_receive,
status:"pending"
}
);


return jsonResponse({
success:true,
message:"Sell order berhasil dibuat",
data:order[0]
});

}



// =================================
// CREATE PAYMENT
// =================================

async function createPayment(request,env){

const body=await request.json();

const {
order_id
}=body;


if(!order_id){
throw new Error("order_id wajib diisi");
}


// AMBIL ORDER

const orders=await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?id=eq.${order_id}&select=*`
);


if(!orders.length){
throw new Error("Order tidak ditemukan");
}


const order=orders[0];


if(order.status!=="pending"){
throw new Error("Order sudah diproses");
}


// CREATE BAYARGG

const payment=await bayarGGCreatePayment(
env,
{
amount:Number(order.price),
description:`Pembelian Sell Link ${order.link_id}`,
payment_url:`${env.FRONTEND_URL}/payment-success`,
payment_method:"qris_bayar_gg"
}
);


// SIMPAN INVOICE

await supabaseRequest(
env,
"sell_orders",
"PATCH",
{
invoice_id:payment.invoice_id,
payment_url:payment.payment_url,
qris_string:payment.qris_string,
expires_at:payment.expires_at
},
`?id=eq.${order_id}`
);


return jsonResponse({
success:true,
data:{
order_id,
invoice_id:payment.invoice_id,
payment_url:payment.payment_url,
qris_string:payment.qris_string,
expires_at:payment.expires_at
}
});

}

// =================================
// PAYMENT CALLBACK BAYARGG
// =================================

async function paymentCallback(request,env){

const bodyText=await request.text();

const body=JSON.parse(bodyText);


// VERIFY SIGNATURE

const signature=request.headers.get(
"X-Webhook-Signature"
);


if(!signature){
throw new Error("Signature webhook kosong");
}


const signData=
`${body.invoice_id}|${body.status}|${body.final_amount}|${body.timestamp}`;


const expected=await generateHmac(
signData,
env.BAYARGG_WEBHOOK_SECRET
);


if(expected!==signature){
throw new Error("Signature tidak valid");
}


// CEK STATUS

if(body.status!=="paid"){

return jsonResponse({
success:true,
message:"Status belum paid"
});

}


// CARI ORDER

const orders=await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?invoice_id=eq.${body.invoice_id}&select=*`
);


if(!orders.length){
throw new Error("Order tidak ditemukan");
}


const order=orders[0];


if(order.status==="paid"){

return jsonResponse({
success:true,
message:"Sudah diproses"
});

}


// UPDATE ORDER

await supabaseRequest(
env,
"sell_orders",
"PATCH",
{
status:"paid",
paid_at:body.paid_at,
buyer_id:body.customer_phone||null
},
`?id=eq.${order.id}`
);


// TAMBAH SALDO SELLER

const profiles=await supabaseRequest(
env,
"profiles",
"GET",
null,
`?id=eq.${order.seller_id}&select=*`
);


if(profiles.length){

const profile=profiles[0];


await supabaseRequest(
env,
"profiles",
"PATCH",
{
balance:
Number(profile.balance||0)
+
Number(order.seller_receive||0)
},
`?id=eq.${order.seller_id}`
);

}


return jsonResponse({
success:true,
message:"Pembayaran berhasil diproses"
});

}



// =================================
// HMAC SHA256
// =================================

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


return Array.from(
new Uint8Array(signature)
)
.map(
b=>b.toString(16).padStart(2,"0")
)
.join("");

}
