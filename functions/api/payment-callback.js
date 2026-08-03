export async function onRequestPost(context){

const {request,env}=context;


try{


const bodyText = await request.text();

const body = JSON.parse(bodyText);


console.log(
"PAYMENT CALLBACK BODY:",
body
);


// =====================
// VERIFY SIGNATURE
// =====================

const signature =
request.headers.get(
"X-Webhook-Signature"
);


if(!signature){

throw new Error(
"Signature webhook kosong"
);

}



const signData =
`${body.invoice_id}|${body.status}|${body.final_amount}|${body.timestamp}`;



const expected =
await generateHmac(
signData,
env.BAYARGG_WEBHOOK_SECRET
);



if(expected !== signature){

throw new Error(
"Signature tidak valid"
);

}



// =====================
// CHECK STATUS
// =====================

if(body.status !== "paid"){

return json({

success:true,

message:"Status belum paid"

});

}



// =====================
// GET ORDER
// =====================

const orders =
await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?invoice_id=eq.${body.invoice_id}&select=*`
);



if(!orders.length){

throw new Error(
"Order tidak ditemukan"
);

}



const order = orders[0];



// CEGAH DOUBLE PAYMENT

if(order.status === "paid"){

return json({

success:true,

message:"Pembayaran sudah diproses"

});

}



// =====================
// UPDATE ORDER
// =====================

await supabaseRequest(
env,
"sell_orders",
"PATCH",
{

status:"paid",

paid_at:
body.paid_at ||
new Date().toISOString(),

buyer_id:
body.buyer_id || null

},

`?id=eq.${order.id}`
);




// =====================
// TAMBAH SALDO SELLER
// =====================

const profiles =
await supabaseRequest(
env,
"profiles",
"GET",
null,
`?id=eq.${order.seller_id}&select=*`
);



if(!profiles.length){

throw new Error(
"Profile seller tidak ditemukan"
);

}



const profile =
profiles[0];



const newBalance =
Number(profile.balance || 0)
+
Number(order.seller_receive || 0);



await supabaseRequest(
env,
"profiles",
"PATCH",
{

balance:newBalance

},

`?id=eq.${order.seller_id}`
);




console.log(
"SALDO SELLER UPDATE:",
{
seller_id:order.seller_id,
receive:order.seller_receive,
balance:newBalance
}
);



return json({

success:true,

message:"Pembayaran berhasil diproses",

data:{

order_id:order.id,

seller_id:order.seller_id,

seller_receive:order.seller_receive,

balance:newBalance

}

});



}catch(error){


console.log(
"CALLBACK ERROR:",
error
);


return json({

success:false,

error:error.message

},500);


}

}




// =====================
// HMAC SHA256
// =====================

async function generateHmac(
data,
secret
){


const encoder =
new TextEncoder();



const key =
await crypto.subtle.importKey(
"raw",
encoder.encode(secret),
{
name:"HMAC",
hash:"SHA-256"
},
false,
["sign"]
);



const signature =
await crypto.subtle.sign(
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


const res =
await fetch(
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

body:
body
?
JSON.stringify(body)
:
undefined

}

);



const text =
await res.text();


const data =
text
?
JSON.parse(text)
:
[];



if(!res.ok){

throw new Error(
JSON.stringify(data)
);

}



return data;

}




// =====================
// RESPONSE
// =====================

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
