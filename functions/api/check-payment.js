export async function onRequestGet(context){

const {
    env,
    request
}=context;


try{


const url =
new URL(request.url);


const invoice_id =
(url.searchParams.get("invoice_id") || "").trim();



console.log(
    "CHECK PAYMENT INVOICE:",
    invoice_id
);



if(!invoice_id){

return json({

    success:false,

    error:"invoice_id wajib diisi"

},400);

}



// =====================
// GET SELL ORDER
// =====================

const orders =
await supabaseRequest(

    env,

    "sell_orders",

    "GET",

    null,

    `?select=*&invoice_id=eq.${invoice_id}`

);



if(!orders.length){

return json({

    success:false,

    error:"Order tidak ditemukan"

},404);

}



let order =
orders[0];




// =====================
// CHECK BAYARGG
// =====================

const payment =
await bayarGGCheckPayment(

    env,

    invoice_id

);



console.log(
    "BAYARGG RESULT:",
    payment
);



let status =
order.status || "pending";


let paid_at =
order.paid_at || null;



const paymentStatus = String(
    payment.status ??
    payment.payment_status ??
    payment.paymentStatus ??
    payment.state ??
    payment.paymentState ??
    ""
).trim().toLowerCase();




// =====================
// UPDATE PAID
// =====================

if (
    (paymentStatus === "paid" || paymentStatus === "success") &&
    order.status !== "paid"
) {


const process =
await supabaseRpc(
    env,
    "process_sell_payment",
    {
        p_order_id: order.id
    }
);



console.log(
    "PROCESS SELL PAYMENT:",
    process
);



if(
!process ||
process.success === false
){

throw new Error(
process?.error || "Gagal proses pembayaran"
);

}



const updated =
await supabaseRequest(

    env,

    "sell_orders",

    "GET",

    null,

    `?id=eq.${order.id}&select=*`

);



if(updated.length){

order =
updated[0];

}


// update status terbaru
status = order.status;

}

// =====================
// GET DESTINATION
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


const link =
links[0];


destination_url =

link.destination_url ||

link.destination ||

link.url ||

null;


}


}




// =====================
// RESPONSE
// =====================

return json({

success:true,


data:{


order_id:
order.id,


invoice_id:
order.invoice_id || invoice_id,


status,


price:
Number(order.price || 0),



qris_string:
order.qris_string || null,



expires_at:
order.expires_at || null,



paid_at:
order.paid_at || paid_at,



link_id:
order.link_id,



seller_id:
order.seller_id,



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

    if(!env.BAYARGG_API_KEY){
        throw new Error(
            "BAYARGG_API_KEY kosong"
        );
    }

    if(!invoice_id){
        throw new Error(
            "invoice_id kosong"
        );
    }


    const payload = {
        invoice_id: String(invoice_id),
        invoiceId: String(invoice_id)
    };


    console.log(
        "BAYARGG CHECK PAYLOAD:",
        JSON.stringify(payload)
    );


    const response = await fetch(
        "https://www.bayar.gg/api/check-payment.php",
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json",
                "X-API-Key":env.BAYARGG_API_KEY
            },

            body:JSON.stringify(payload)
        }
    );


    const text = await response.text();


    console.log(
        "BAYARGG CHECK STATUS:",
        response.status
    );

    console.log(
        "BAYARGG CHECK RAW:",
        text
    );


    let data;

    try{

        data = JSON.parse(text);

    }catch{

        throw new Error(
            "BayarGG response bukan JSON: "+text
        );

    }


    if(!response.ok){

        throw new Error(
            `BayarGG HTTP ${response.status}: ${text}`
        );

    }


    if(data.success === false){

        throw new Error(
            data.error ||
            data.message ||
            "Check payment gagal"
        );

    }


    return (
        data.data ||
        data.result ||
        data
    );

}


// =====================
// SUPABASE RPC
// =====================

async function supabaseRpc(
env,
functionName,
params={}
){


const response =
await fetch(

`${env.SUPABASE_URL}/rest/v1/rpc/${functionName}`,

{

method:"POST",

headers:{

apikey:
env.SUPABASE_SERVICE_KEY,


Authorization:
`Bearer ${env.SUPABASE_SERVICE_KEY}`,


"Content-Type":
"application/json"

},


body:
JSON.stringify(params)

}

);



const text =
await response.text();



let data;



try{

data =
JSON.parse(text);

}
catch{

throw new Error(
"RPC response bukan JSON: "+text
);

}



if(!response.ok){

throw new Error(
JSON.stringify(data)
);

}



return data;

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


const response =
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
await response.text();



let data=[];


if(text){

try{

data =
JSON.parse(text);

}
catch{

throw new Error(
"Supabase response bukan JSON"
);

}

}



if(!response.ok){

throw new Error(
JSON.stringify(data)
);

}



return data;

}





// =====================
// JSON
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
