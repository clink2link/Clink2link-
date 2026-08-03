document.addEventListener("DOMContentLoaded",async()=>{

const buyBox=document.getElementById("buyBox");

const code=window.BUY_CODE||location.pathname.split("/").pop();

if(!code||code==="b"||code==="buy"){
    buyBox.innerHTML="<h3>Link tidak valid</h3>";
    return;
}


console.log("BUY CODE:",code);


try{

const link=await database.getLinkByCode(code);

console.log("LINK:",link);


if(!link){

    buyBox.innerHTML="<h3>Link tidak ditemukan</h3>";
    return;

}


if(link.link_type!=="sell"&&link.type!=="sell"){

    buyBox.innerHTML="<h3>Link ini bukan Sell Link</h3>";
    return;

}



buyBox.innerHTML=`

<div class="buy-product-card">

<div class="buy-product-title">

<i class="fa-solid fa-link"></i>

${link.title||"Sell Link"}

</div>


<div class="buy-price">

Rp ${Number(link.price||0).toLocaleString("id-ID")}

</div>


<div class="buy-info-row">

<span class="buy-badge">

<i class="fa-solid fa-cart-shopping"></i>

Terjual ${link.sold||0}x

</span>


<span class="buy-badge">

<i class="fa-solid fa-eye"></i>

${link.views||0} View

</span>

</div>


<button class="buy-btn" id="payBtn">

<i class="fa-solid fa-bolt"></i>

Bayar Sekarang

</button>


</div>

`;



const payBtn=document.getElementById("payBtn");



payBtn.addEventListener("click",async()=>{


payBtn.disabled=true;


payBtn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Membuat Pembayaran...

`;



try{


if(typeof calculateSellPayment!=="function"){

throw new Error(
"Fungsi calculateSellPayment belum tersedia"
);

}



const payment=
calculateSellPayment(
Number(link.price)
);



const order=
await database.createSellOrder({

link_id:
link.id,

seller_id:
link.user_id,

buyer_id:
null,

price:
Number(link.price),

fee:
payment.fee,

seller_receive:
payment.seller_receive,

destination_url:
link.destination_url||link.destination,

status:
"pending"

});



console.log(
"ORDER CREATED:",
order
);



const invoice=
await database.createPayment({

order_id:
order.id,

amount:
Number(link.price),

type:
"sell"

});



console.log(
"INVOICE:",
invoice
);



const qr=
invoice.qr_url||
invoice.qr_code||
invoice.qr||
invoice.payment_url;



if(!qr){

throw new Error(
"QR pembayaran tidak tersedia"
);

}



buyBox.innerHTML=`

<div class="buy-product-card">

<div class="buy-product-title">

<i class="fa-solid fa-qrcode"></i>

Pembayaran Sell Link

</div>


<div class="buy-price">

Rp ${Number(link.price).toLocaleString("id-ID")}

</div>


<div class="buy-qr-box">

<img src="${qr}" alt="QR Pembayaran">

</div>


<span class="buy-badge">

<i class="fa-solid fa-clock"></i>

Menunggu Pembayaran

</span>


<p style="
margin-top:15px;
font-size:14px;
color:#666;
">

Scan QR menggunakan Mobile Banking atau E-Wallet.

</p>


</div>

`;



}catch(err){


console.error(
"PAYMENT ERROR:",
err
);


buyBox.innerHTML=`

<div class="buy-product-card">


<h3>

<i class="fa-solid fa-triangle-exclamation"></i>

Pembayaran Gagal

</h3>


<p>
${err.message}
</p>


<button class="buy-btn" onclick="location.reload()">

Coba Lagi

</button>


</div>

`;

}


});



}catch(err){


console.error(
"BUY ERROR:",
err
);


buyBox.innerHTML=`

<div class="buy-product-card">

<h3>
Terjadi kesalahan
</h3>

<p>
${err.message}
</p>

</div>

`;

}


});
