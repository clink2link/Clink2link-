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


const price=Number(link.price||0);


const orderPayload={

link_id:link.id,

seller_id:link.user_id,

buyer_id:null,

price:price

};



showBuyDebug(
"ORDER PAYLOAD:\n"+
JSON.stringify(orderPayload,null,2)
);



const order=
await database.createSellOrder(
orderPayload
);



showBuyDebug(
"ORDER SUCCESS:\n"+
JSON.stringify(order,null,2)
);



if(!database.createPayment){

throw new Error(
"createPayment belum tersedia"
);

}



const invoice=
await database.createPayment({

order_id:order.id,

amount:price,

type:"sell"

});



showBuyDebug(
"INVOICE:\n"+
JSON.stringify(invoice,null,2)
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
Rp ${price.toLocaleString("id-ID")}
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
Silakan scan QR menggunakan Mobile Banking atau E-Wallet.
</p>

</div>

`;



}catch(err){


showBuyDebug(
"ERROR:\n"+
err.message
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

function showBuyDebug(text){

let box=document.getElementById("buyDebug");


if(!box){

box=document.createElement("div");

box.id="buyDebug";

box.style.position="fixed";
box.style.bottom="10px";
box.style.left="10px";
box.style.right="10px";
box.style.maxHeight="50vh";
box.style.overflow="auto";
box.style.zIndex="999999";
box.style.background="#111";
box.style.color="#00ff00";
box.style.padding="15px";
box.style.borderRadius="10px";
box.style.fontSize="12px";
box.style.whiteSpace="pre-wrap";

document.body.appendChild(box);

}


box.innerHTML+=
"\n\n"+text;

}
