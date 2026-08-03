export async function onRequestGet(context){

const {env,request}=context;

try{

const url=new URL(request.url);

const invoice_id=url.searchParams.get("invoice_id");

if(!invoice_id){

return json({
success:false,
error:"invoice_id wajib diisi"
},400);

}

console.log("CHECK PAYMENT:",invoice_id);


// =====================
// GET ORDER
// =====================

const orders=await supabaseRequest(
env,
"sell_orders",
"GET",
null,
`?invoice_id=eq.${invoice_id}&select=*`
);


if(!orders.length){

return json({
success:false,
message:"Order tidak ditemukan"
},404);

}


const order=orders[0];


// =====================
// RESPONSE
// =====================

return json({

success:true,

data:{

order_id:order.id,

invoice_id:order.invoice_id,

status:order.status,

price:Number(order.price||0),

fee:Number(order.fee||0),

seller_receive:Number(order.seller_receive||0),

payment_url:order.payment_url||null,

qris_string:order.qris_string||null,

expires_at:order.expires_at||null,

paid_at:order.paid_at||null,

link_id:order.link_id,

seller_id:order.seller_id

}

});


}catch(error){

console.error(
"CHECK PAYMENT ERROR:",
error
);

return json({
success:false,
error:error.message
},500);

}

}



// =====================
// SUPABASE
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
apikey:env.SUPABASE_SERVICE_KEY,
Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,
"Content-Type":"application/json",
Prefer:"return=representation"
},
body:body?JSON.stringify(body):undefined
}
);


const text=await res.text();

let data=[];

try{

data=text?JSON.parse(text):[];

}catch{

throw new Error("Response Supabase bukan JSON");

}


if(!res.ok){

throw new Error(JSON.stringify(data));

}


return data;

}



// =====================
// JSON RESPONSE
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
