document.addEventListener("DOMContentLoaded", async()=>{

const buyBox=document.getElementById("buyBox");

if(!buyBox) return;


const code =
window.BUY_CODE ||
location.pathname.split("/").pop();



if(!code || code==="b" || code==="buy"){

buyBox.innerHTML=`

<div class="buy-product-card">
<h3>Link tidak valid</h3>
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
<h3>Link tidak ditemukan</h3>
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
<h3>Bukan Sell Link</h3>
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



let order =
await database.createSellOrder({

link_id:link.id,

seller_id:sellerId,

price

});



if(Array.isArray(order)){

order=order[0];

}



if(!order?.id){

throw new Error(
"Order gagal dibuat"
);

}




const payment =
await database.createPayment({

    order_id:order.id

});


console.log(
    "PAYMENT RESULT:",
    payment
);



const qris =
payment.qris_string ||
payment.data?.qris_string;



const expires =
payment.expires_at ||
payment.data?.expires_at;



const invoiceId =
payment.invoice_id ||
payment.data?.invoice_id;



console.log(
    "INVOICE ID:",
    invoiceId
);



if(
!qris ||
!expires ||
!invoiceId
){

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
style="
background:#10b981;
margin-top:15px;
">

<i class="fa-solid fa-rotate"></i>

Cek Pembayaran

</button>





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
// QR CODE
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




const countdown =
document.getElementById("countdown");


const paymentStatus =
document.getElementById(
"paymentStatus"
);



const qrContainer =
document.getElementById(
"qrcode"
);




const expireTime =
new Date(expires).getTime();



const timer =
setInterval(()=>{


const diff =
expireTime - Date.now();



if(diff<=0){


clearInterval(timer);



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




const minutes =
Math.floor(diff/60000);



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
// CEK PEMBAYARAN
// =====================

document
.getElementById("checkPayment")
.onclick=async()=>{


const btn =
document.getElementById(
"checkPayment"
);



btn.disabled=true;



btn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Mengecek...

`;



try{


const data =
await database.checkSellPayment(
invoiceId
);



if(
data.status==="paid"
){


clearInterval(timer);



paymentStatus.className =
"buy-status buy-success";



paymentStatus.innerHTML=`

<i class="fa-solid fa-circle-check"></i>

Pembayaran Berhasil

`;



btn.style.display="none";



document
.getElementById("cancelPayment")
.style.display="none";



setTimeout(()=>{


if(data.destination_url){

location.href =
data.destination_url;

}else{

alert(
"Link tujuan tidak ditemukan"
);

}


},1000);



return;

}




paymentStatus.className =
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



}catch(err){


alert(
err.message
);



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
