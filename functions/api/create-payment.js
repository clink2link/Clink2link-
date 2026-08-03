export async function onRequestPost(context){

const {request,env}=context;

try{

const body=await request.json();

const {order_id}=body;

if(!order_id){
throw new Error("order_id wajib diisi");
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
throw new Error("Order tidak ditemukan");
}

const order=orders[0];


// =====================
// STATUS
// =====================

if(order.status!=="pending"){
throw new Error("Order sudah diproses");
}


// =====================
// VALIDASI HARGA
// =====================

const amount=Number(order.price||0);

if(amount<1000){
throw new Error("Harga order tidak valid");
}


// =====================
// QR MASIH BERLAKU
// =====================

if(
order.invoice_id &&
order.payment_url &&
order.expires_at &&
new Date(order.expires_at)>new Date()
){

return json({

success:true,

data:{

order_id:order.id,

invoice_id:order.invoice_id,

payment_id:order.payment_id,

payment_url:order.payment_url,

qris_string:order.qris_string,

expires_at:order.expires_at

}

});

}


// =====================
// CREATE BAYARGG PAYMENT
// =====================

const payment=await bayarGGCreatePayment(
env,
{

amount,

description:`Pembelian Sell Link ${order.link_id}`,

payment_url:"https://www.bayar.gg/pay"

}
);


// =====================
// EXPIRED 7 MENIT
// =====================

const expiresAt=new Date(
Date.now()+7*60*1000
).toISOString();


// =====================
// UPDATE ORDER
// =====================

const updated=await supabaseRequest(
env,
"sell_orders",
"PATCH",
{

payment_id:
payment.payment_id||
payment.id||
null,

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
throw new Error("Gagal menyimpan data payment");
}


console.log(
"PAYMENT CREATED:",
payment.invoice_id
);


return json({

success:true,

data:{

order_id,

payment_id:
payment.payment_id||
payment.id||
null,

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

console.error(
"CREATE PAYMENT ERROR:",
error
);

return json({

success:false,

error:error.message

},500);

}

}
