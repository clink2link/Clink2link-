export async function onRequestGet(context){

const {env,request}=context;

try{

const url=new URL(request.url);

const invoice_id=url.searchParams.get("invoice_id");

if(!invoice_id){
throw new Error("invoice_id wajib diisi");
}


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
});

}


const order=orders[0];


return json({
success:true,
data:{
order_id:order.id,
status:order.status,
price:order.price,
seller_receive:order.seller_receive,
paid_at:order.paid_at||null
}
});


}catch(error){

return json({
success:false,
error:error.message
},500);

}

}


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


if(!res.ok){
throw new Error(JSON.stringify(data));
}


return data;

}


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
