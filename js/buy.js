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



console.log(
"BUY CODE:",
code
);



try{


const link =
await database.getLinkByCode(code);



console.log(
"LINK:",
link
);



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



const order = await database.createSellOrder({

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



console.log(
"ORDER:",
finalOrder
);



const payment =
await database.createPayment({

order_id:
finalOrder.id

});



console.log(
"PAYMENT:",
payment
);



const paymentData =
payment.data || payment;



const paymentUrl =
paymentData.payment_url;



const qris =
paymentData.qris_string;



if(!paymentUrl && !qris){

throw new Error(
"QRIS dan Payment URL kosong"
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
class="buy-qr-box"
id="qrcode">

</div>



${
paymentUrl
?
`

<a
href="${paymentUrl}"
target="_blank"
class="buy-btn">

<i class="fa-solid fa-credit-card"></i>

Buka Pembayaran

</a>

`
:
""

}



<div class="buy-status buy-pending">

<i class="fa-solid fa-clock"></i>

Menunggu Pembayaran

</div>



</div>

`;




// GENERATE QR

if(qris){


const qrBox =
document.getElementById(
"qrcode"
);



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


}else{


console.error(
"QRCode library belum masuk"
);


}


}



}catch(err){


console.error(
"PAY ERROR:",
err
);



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


console.error(
"BUY ERROR:",
err
);



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
