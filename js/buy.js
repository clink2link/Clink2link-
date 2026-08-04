document.addEventListener("DOMContentLoaded",async()=>{

const buyBox=document.getElementById("buyBox");

if(!buyBox) return;

// =====================
// DEBUG PANEL
// =====================

const DEBUG=true;

let debugBox=null;

if(DEBUG){

debugBox=document.createElement("div");

debugBox.id="buyDebug";

debugBox.style=`
position:fixed;
left:10px;
right:10px;
bottom:10px;
max-height:45vh;
overflow:auto;
background:#000;
color:#00ff00;
font-size:12px;
font-family:monospace;
padding:10px;
z-index:999999;
border-radius:10px;
white-space:pre-wrap;
box-shadow:0 0 20px rgba(0,0,0,.5);
`;

document.body.appendChild(debugBox);

}

function log(title,data=null){

console.log(title,data);

if(!debugBox) return;

let text=title;

if(data!==null){

try{

text+="\n"+JSON.stringify(data,null,2);

}catch{

text+="\n"+String(data);

}

}

debugBox.innerHTML+=text+"\n\n";

debugBox.scrollTop=debugBox.scrollHeight;

}

window.onerror=function(msg,url,line,col,error){

log("JS ERROR",{
msg,
url,
line,
col,
stack:error?.stack
});

};

window.onunhandledrejection=function(e){

log("PROMISE ERROR",e.reason);

};

log("BUY PAGE LOADED");

const code=
window.BUY_CODE||
location.pathname.split("/").pop();

log("BUY CODE",code);

if(!code||code==="b"||code==="buy"){

buyBox.innerHTML=`

<div class="buy-product-card">
<h3>Link tidak valid</h3>
</div>

`;

return;

}

try{

log("GET LINK...");

const link=
await database.getLinkByCode(code);

log("LINK RESULT",link);

if(!link){

log("LINK TIDAK DITEMUKAN");

buyBox.innerHTML=`

<div class="buy-product-card">
<h3>Link tidak ditemukan</h3>
</div>

`;

return;

}

if(
link.link_type!=="sell" &&
link.type!=="sell"
){

log("BUKAN SELL LINK",link);

buyBox.innerHTML=`

<div class="buy-product-card">
<h3>Bukan Sell Link</h3>
</div>

`;

return;

}

const title=
escapeHtml(
link.title||"Sell Link"
);

const price=
Number(link.price||0);

log("LINK INFO",{

id:link.id,

title,

price,

seller:
link.user_id||
link.seller_id||
link.owner_id,

views:link.views,

sold:link.sold

});

buyBox.innerHTML=`

<div class="buy-product-card">

<div class="buy-product-title">

<i class="fa-solid fa-link"></i>

${title}

</div>

<div class="buy-price">

Rp ${price.toLocaleString("id-ID")}

</div>

<div class="buy-info-row">

<span class="buy-badge">

<i class="fa-solid fa-cart-shopping"></i>

Terjual ${Number(link.sold||0)}x

</span>

<span class="buy-badge">

<i class="fa-solid fa-eye"></i>

${Number(link.views||0)} View

</span>

</div>

<button
class="buy-btn"
id="payBtn">

<i class="fa-solid fa-bolt"></i>

Bayar Sekarang

</button>

</div>

`;

const payBtn=
document.getElementById("payBtn");

payBtn.onclick=async()=>{

log("BUTTON BAYAR DIKLIK");

payBtn.disabled=true;

payBtn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Membuat Pembayaran...

`;

try{

const sellerId=
link.user_id||
link.seller_id||
link.owner_id;

log("SELLER ID",sellerId);

if(!sellerId){

throw new Error(
"Seller tidak ditemukan"
);

}

log("CREATE ORDER REQUEST",{

link_id:link.id,

seller_id:sellerId,

price

});

let order=
await database.createSellOrder({

link_id:link.id,

seller_id:sellerId,

price

});

log("CREATE ORDER RESPONSE",order);

if(Array.isArray(order)){

order=order[0];

}

if(!order?.id){

throw new Error(
"Order gagal dibuat"
);

}

log("ORDER ID",order.id);

log("CREATE PAYMENT REQUEST",{

order_id:order.id

});

const payment=
await database.createPayment({

order_id:order.id

});

log("CREATE PAYMENT RESPONSE",payment);


const qris=
payment.qris_string||
payment.data?.qris_string;

const expires=
payment.expires_at||
payment.data?.expires_at;

const invoiceId=
payment.invoice_id||
payment.data?.invoice_id;

const paymentUrl=
payment.payment_url||
payment.data?.payment_url;

log("PAYMENT DATA",{
invoiceId,
expires,
paymentUrl,
hasQris:!!qris
});

if(!qris||!expires||!invoiceId){

log("PAYMENT ERROR",payment);

throw new Error(
"Data pembayaran tidak lengkap"
);

}

buyBox.innerHTML=`

<div class="buy-product-card">

<div class="buy-product-title">

<i class="fa-solid fa-qrcode"></i>

Pembayaran

</div>

<div class="buy-price">

Rp ${price.toLocaleString("id-ID")}

</div>

<div
class="buy-countdown"
id="countdown">

Memuat waktu...

</div>

<div
class="buy-qr-box"
id="qrcode">

</div>

<div
class="buy-status buy-pending"
id="paymentStatus">

<i class="fa-solid fa-clock"></i>

Menunggu Pembayaran

</div>

<button
class="buy-btn"
id="checkPayment"
style="background:#10b981;margin-top:15px;">

<i class="fa-solid fa-rotate"></i>

Cek Pembayaran

</button>

<button
class="buy-btn"
id="cancelPayment"
style="background:#ef4444;margin-top:15px;">

<i class="fa-solid fa-xmark"></i>

Batalkan Pembayaran

</button>

</div>

`;

log("QR PAGE CREATED");

const qrBox=
document.getElementById("qrcode");

if(qrBox&&typeof QRCode!=="undefined"){

new QRCode(qrBox,{
text:qris,
width:200,
height:200
});

log("QR CODE GENERATED");

}else{

log("QRCODE LIBRARY TIDAK DITEMUKAN");
}

const countdown=
document.getElementById("countdown");

const paymentStatus=
document.getElementById("paymentStatus");

const qrContainer=
document.getElementById("qrcode");

const expireTime=
new Date(expires).getTime();

log("EXPIRE TIME",expires);

const timer=setInterval(()=>{

const diff=
expireTime-Date.now();

if(diff<=0){

clearInterval(timer);

log("PAYMENT EXPIRED");

countdown.innerHTML=`

<i class="fa-solid fa-hourglass-end"></i>

00:00

`;

qrContainer.innerHTML="";

paymentStatus.className=
"buy-status buy-failed";

paymentStatus.innerHTML=`

<i class="fa-solid fa-circle-xmark"></i>

Pembayaran Expired

`;

return;

}

const minutes=
Math.floor(diff/60000);

const seconds=
Math.floor((diff%60000)/1000);

countdown.innerHTML=`

<i class="fa-solid fa-stopwatch"></i>

${minutes}:${String(seconds).padStart(2,"0")}

`;

},1000);


// =====================
// CEK PEMBAYARAN
// =====================

document
.getElementById("checkPayment")
.onclick=async()=>{

const btn=
document.getElementById("checkPayment");

btn.disabled=true;

btn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Mengecek...

`;

log("CHECK PAYMENT CLICK");

try{

log("CHECK PAYMENT REQUEST",{
invoiceId
});

const data=
await database.checkSellPayment(
invoiceId
);

log("CHECK PAYMENT RESPONSE",data);

if(data.status==="paid"){

clearInterval(timer);

paymentStatus.className=
"buy-status buy-success";

paymentStatus.innerHTML=`

<i class="fa-solid fa-circle-check"></i>

Pembayaran Berhasil

`;

btn.style.display="none";

document
.getElementById("cancelPayment")
.style.display="none";

log("PAYMENT SUCCESS");

setTimeout(()=>{

log("REDIRECT",{
destination:data.destination_url
});

if(data.destination_url){

location.href=
data.destination_url;

}else{

alert(
"Link tujuan tidak ditemukan"
);

}

},1000);

return;

}

paymentStatus.className=
"buy-status buy-pending";

paymentStatus.innerHTML=`

<i class="fa-solid fa-clock"></i>

Belum Dibayar

`;

btn.disabled=false;

btn.innerHTML=`

<i class="fa-solid fa-rotate"></i>

Cek Pembayaran

`;

log("STATUS MASIH PENDING");

}catch(err){

log("CHECK PAYMENT ERROR",{
message:err.message,
stack:err.stack
});

alert(err.message);

btn.disabled=false;

btn.innerHTML=`

<i class="fa-solid fa-rotate"></i>

Cek Pembayaran

`;

}

};

// =====================
// CANCEL
// =====================

document
.getElementById("cancelPayment")
.onclick=()=>{

log("PAYMENT CANCEL");

clearInterval(timer);

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>

<i class="fa-solid fa-ban"></i>

Pembayaran Dibatalkan

</h3>

<p>

Silakan buat pembayaran baru.

</p>

<button
class="buy-btn"
onclick="location.reload()">

Buat Pembayaran Baru

</button>

</div>

`;

};

}catch(err){

log("PAYMENT FLOW ERROR",{
message:err.message,
stack:err.stack
});

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>

<i class="fa-solid fa-triangle-exclamation"></i>

Pembayaran Gagal

</h3>

<p>

${escapeHtml(err.message)}

</p>

<button
class="buy-btn"
onclick="location.reload()">

Coba Lagi

</button>

</div>

`;

}

};

}catch(err){

log("BUY PAGE ERROR",{
message:err.message,
stack:err.stack
});

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>

Terjadi Kesalahan

</h3>

<p>

${escapeHtml(err.message)}

</p>

</div>

`;

}

});

function escapeHtml(str){

return String(str)
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}
