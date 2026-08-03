export async function onRequestPost(context){

const {request,env}=context;

try{

const bodyText=await request.text();

const body=JSON.parse(bodyText);


// VERIFY SIGNATURE

const signature=request.headers.get(
"X-Webhook-Signature"
);


if(!signature)
throw new Error("Signature webhook kosong");


const signData=
`${body.invoice_id}|${body.status}|${body.final_amount}|${body.timestamp}`;


const expected=await generateHmac(
signData,
env.BAYARGG_WEBHOOK_SECRET
);


if(expected!==signature)
throw new Error("Signature tidak valid");


// CEK STATUS

if(body.status!=="paid"){

return json({
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


if(!orders.length)
throw new Error("Order tidak ditemukan");


const order=orders[0];


if(order.status==="paid"){

return json({
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


return json({
success:true,
message:"Pembayaran berhasil diproses"
});


}catch(error){

return json({
success:false,
error:error.message
},500);

}

}


// HMAC SHA256

async function generateHmac(
data,
secret
){

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


// SUPABASE

async function supabaseRequest(
env,
table,
method="GET",
body=null,
query=""
){

const res=await fetch(
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


const data=await res.json();


if(!res.ok)
throw new Error(JSON.stringify(data));


return data;

}


// RESPONSE

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
