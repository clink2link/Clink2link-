document.addEventListener("DOMContentLoaded", async()=>{

const buyBox=document.getElementById("buyBox");

if(!buyBox) return;


const code =
window.BUY_CODE ||
location.pathname.split("/").pop();



if(!code || code==="b" || code==="buy"){

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>
Link tidak valid
</h3>

</div>

`;

return;

}



try{


const link =
await database.getLinkByCode(code);



if(!link){

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>
Link tidak ditemukan
</h3>

</div>

`;

return;

}



if(
link.link_type!=="sell" &&
link.type!=="sell"
){

buyBox.innerHTML=`

<div class="buy-product-card">

<h3>
Bukan Sell Link
</h3>

</div>

`;

return;

}



const title =
escapeHtml(
link.title || "Sell Link"
);



const price =
Number(link.price || 0);



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




const payBtn =
document.getElementById("payBtn");



payBtn.onclick=async()=>{


payBtn.disabled=true;


payBtn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Membuat Pembayaran...

`;



try{


const sellerId =
link.user_id ||
link.seller_id ||
link.owner_id;



if(!sellerId){

throw new Error(
"Seller tidak ditemukan"
);

}



const order =
await database.createSellOrder({

link_id:link.id,

seller_id:sellerId,

price

});



const finalOrder =
Array.isArray(order)
?
order[0]
:
order;



if(!finalOrder?.id){

throw new Error(
"Order gagal dibuat"
);

}



const payment =
await database.createPayment({

order_id:
finalOrder.id

});



const paymentData =
payment.data || payment;



const qris =
paymentData.qris_string;



const expires =
paymentData.expires_at;



if(!qris){

throw new Error(
"QRIS tidak tersedia"
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
id="cancelPayment"
style="
background:#ef4444;
margin-top:15px;
">

<i class="fa-solid fa-xmark"></i>

Batalkan Pembayaran

</button>


</div>

`;




// =====================
// QR GENERATE
// =====================


const qrBox =
document.getElementById("qrcode");


if(
qrBox &&
typeof QRCode !== "undefined"
){

new QRCode(
qrBox,
{

text:qris,

width:200,

height:200

}

);

}



// =====================
// COUNTDOWN
// =====================


const countdown =
document.getElementById(
"countdown"
);



const status =
document.getElementById(
"paymentStatus"
);



const expireTime =
new Date(expires).getTime();



const timer =
setInterval(()=>{


const now =
Date.now();


const diff =
expireTime-now;



if(diff<=0){


clearInterval(timer);



countdown.innerHTML=
"Pembayaran Kadaluarsa";



status.className=
"buy-status buy-failed";


status.innerHTML=`

<i class="fa-solid fa-circle-xmark"></i>

Expired

`;



return;

}



const minutes =
Math.floor(
diff/60000
);



const seconds =
Math.floor(
(diff%60000)/1000
);



countdown.innerHTML=`

<i class="fa-solid fa-stopwatch"></i>

${minutes}:${String(seconds).padStart(2,"0")}

`;



},1000);





// =====================
// CANCEL PAYMENT
// =====================


document
.getElementById("cancelPayment")
.onclick=()=>{


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
