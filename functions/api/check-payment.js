export async function onRequestGet(context){

const {env,request}=context;


try{


const url=new URL(request.url);


const invoice_id =
url.searchParams.get("invoice_id");



if(!invoice_id){

return json({

success:false,

error:"invoice_id wajib diisi"

},400);

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
// CHECK BAYARGG
// =====================

const payment =
await bayarGGCheckPayment(
env,
invoice_id
);




// =====================
// UPDATE STATUS JIKA PAID
// =====================

let status =
order.status;



if(
payment.status==="paid" ||
payment.status==="success"
){


status="paid";


await supabaseRequest(

env,

"sell_orders",

"PATCH",

{

status:"paid",

paid_at:new Date().toISOString()

},

`?id=eq.${order.id}`

);


}




// =====================
// GET LINK ASLI
// =====================

let destination_url=null;



if(status==="paid"){


const links =
await supabaseRequest(

env,

"links",

"GET",

null,

`?id=eq.${order.link_id}&select=*`

);



if(links.length){


destination_url =
links[0].destination_url ||
links[0].destination ||
links[0].url ||
null;


}


}





return json({

success:true,


data:{


order_id:order.id,


invoice_id,


status,


price:Number(order.price||0),


payment_url:
order.payment_url||null,


qris_string:
order.qris_string||null,


expires_at:
order.expires_at||null,


paid_at:
order.paid_at||null,


destination_url


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
// BAYARGG CHECK PAYMENT
// =====================

async function bayarGGCheckPayment(
env,
invoice_id
){



const res =
await fetch(

"https://www.bayar.gg/api/check-payment.php",

{

method:"POST",

headers:{

"Content-Type":
"application/json",

"X-API-Key":
env.BAYARGG_API_KEY

},

body:JSON.stringify({

invoice_id

})

}

);



const text =
await res.text();



let data;


try{

data=JSON.parse(text);

}
catch{

throw new Error(
"BayarGG bukan JSON: "+text
);

}




if(!data.success){

throw new Error(
JSON.stringify(data)
);

}




return data.data;


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



let data=[];



if(text){

try{

data=JSON.parse(text);

}
catch{

throw new Error(
"Supabase bukan JSON"
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
// JSON
// =====================

function json(data,status=200){

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
