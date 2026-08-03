export async function onRequestPost(context){

const {request,env}=context;

console.log("CREATE SELL ORDER START");

console.log("ENV CHECK",{
SUPABASE_URL:env.SUPABASE_URL,
HAS_KEY:!!env.SUPABASE_SERVICE_KEY,
MARKET_FEE:env.MARKET_FEE
});

try{

const body=await request.json();

const {
link_id,
seller_id,
buyer_id=null,
price
}=body;


console.log("PAYLOAD",body);


if(!link_id)
throw new Error("link_id wajib diisi");

if(!seller_id)
throw new Error("seller_id wajib diisi");


const amount=Number(price||0);

if(amount<1000)
throw new Error("Harga tidak valid");


// CEK LINK

const links=await supabaseRequest(
env,
"links",
"GET",
null,
`?id=eq.${link_id}&select=*`
);


console.log("LINK RESPONSE",links);


if(!links.length)
throw new Error("Sell link tidak ditemukan");


const link=links[0];


if(
link.link_type!=="sell" &&
link.type!=="sell"
){
throw new Error("Link bukan Sell Link");
}


// FEE

const fee=Math.floor(
amount*(Number(env.MARKET_FEE||20)/100)
);

const seller_receive=amount-fee;


console.log("ORDER DATA",{
link_id,
seller_id,
price:amount,
fee,
seller_receive
});


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


console.log("ORDER RESULT",order);


return json({
success:true,
data:order[0]
});


}catch(error){

console.error(
"CREATE SELL ORDER ERROR",
error
);

return json({
success:false,
error:error.message
},500);

}

}


// ===============================
// SUPABASE
// ===============================

async function supabaseRequest(
env,
table,
method="GET",
body=null,
query=""
){

const url=
`${env.SUPABASE_URL}/rest/v1/${table}${query}`;


console.log("SUPABASE REQUEST",{
url,
method
});


const res=await fetch(
url,
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


console.log("SUPABASE RESPONSE",{
status:res.status,
body:text
});


let data;

try{
data=JSON.parse(text);
}catch{
data=text;
}


if(!res.ok)
throw new Error(JSON.stringify(data));


return data;

}


// ===============================
// RESPONSE
// ===============================

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
