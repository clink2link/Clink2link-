export async function onRequestPost(context){

const {request,env}=context;


try{


const body=await request.json();


const {
order_id
}=body;


if(!order_id){

throw new Error(
"order_id wajib diisi"
);

}



// =====================
// GET ORDER
// =====================

const orders=await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?id=eq.${order_id}&select=*`
);



if(!orders.length){

throw new Error(
"Order tidak ditemukan"
);

}



const order=orders[0];



if(order.status!=="pending"){

throw new Error(
"Order sudah diproses"
);

}



// =====================
// CREATE BAYARGG PAYMENT
// =====================

const payment=await bayarGGCreatePayment(
env,
{

amount:Number(order.price),

description:
`Pembelian Sell Link ${order.link_id}`,

payment_url:
"https://www.bayar.gg/pay"

}

);



// =====================
// REAL EXPIRED 7 MENIT
// =====================

const expiresAt =
new Date(
Date.now() + 7 * 60 * 1000
).toISOString();




// =====================
// UPDATE ORDER PAYMENT DATA
// =====================

const updated=await supabaseRequest(
env,
"sell_orders",
"PATCH",
{

invoice_id:
payment.invoice_id,

payment_url:
payment.payment_url,

qris_string:
payment.qris_string,

expires_at:
expiresAt

},

`?id=eq.${order_id}&select=*`
);



if(!updated.length){

throw new Error(
"Gagal menyimpan data payment"
);

}





return json({

success:true,

data:{

order_id,

invoice_id:
payment.invoice_id,

payment_url:
payment.payment_url,

qris_string:
payment.qris_string,

expires_at:
expiresAt

}

});



}catch(error){


console.log(
"CREATE PAYMENT ERROR:",
error
);



return json({

success:false,

error:error.message

},500);


}

}





// =====================
// BAYARGG CREATE PAYMENT
// =====================

async function bayarGGCreatePayment(
env,
payload
){


if(!env.BAYARGG_API_KEY){

throw new Error(
"BAYARGG_API_KEY kosong"
);

}



const res=await fetch(

"https://www.bayar.gg/api/create-payment.php",

{

method:"POST",

headers:{

"Content-Type":
"application/json",

"X-API-Key":
env.BAYARGG_API_KEY

},

body:
JSON.stringify(payload)

}

);



const text=await res.text();


let data;



try{

data=JSON.parse(text);

}

catch{

throw new Error(
"BayarGG bukan JSON: "+text
);

}



if(!res.ok){

throw new Error(
"BayarGG HTTP ERROR: "+text
);

}



if(!data.success){

throw new Error(
"BayarGG ERROR: "+
JSON.stringify(data)
);

}



return data.data;

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


const res=await fetch(

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



const text=await res.text();


let data=[];



if(text){

try{

data=JSON.parse(text);

}

catch{

throw new Error(
"Supabase bukan JSON: "+text
);

}

}



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
