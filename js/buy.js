document.addEventListener("DOMContentLoaded", async()=>{

const buyBox=document.getElementById("buyBox");

if(!buyBox) return;


const code =
window.BUY_CODE ||
location.pathname.split("/").pop();


if(!code || code==="b" || code==="buy"){

buyBox.innerHTML=`
<h3>Link tidak valid</h3>
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
<h3>Link tidak ditemukan</h3>
`;

return;

}



if(
link.link_type!=="sell" &&
link.type!=="sell"
){

buyBox.innerHTML=`
<h3>Link bukan Sell Link</h3>
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


if(payBtn.disabled)
return;



payBtn.disabled=true;



payBtn.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Membuat Pesanan...

`;



try{


const sellerId =
link.user_id ||
link.seller_id ||
link.owner_id;



if(!sellerId){

throw new Error(
"Seller ID tidak ditemukan"
);

}



const orderPayload={

link_id:link.id,

seller_id:sellerId,

price:price

};



showBuyDebug(
"CREATE ORDER\n"+
JSON.stringify(
orderPayload,
null,
2
)
);




let order =
await database.createSellOrder(
orderPayload
);



if(Array.isArray(order)){

order=order[0];

}



if(!order?.id){

throw new Error(
"Order gagal dibuat"
);

}



showBuyDebug(
"ORDER RESULT\n"+
JSON.stringify(
order,
null,
2
)
);




const payment =
await database.createPayment({

order_id:order.id

});





showBuyDebug(
"PAYMENT RESULT\n"+
JSON.stringify(
payment,
null,
2
)
);





const paymentUrl =
payment?.payment_url ||
payment?.data?.payment_url;



const qris =
payment?.qris_string ||
payment?.data?.qris_string;



if(!paymentUrl && !qris){

throw new Error(
"Data pembayaran kosong"
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



<div id="qrcode"
style="
display:flex;
justify-content:center;
margin:20px 0;
">
</div>



${
paymentUrl
?
`
<a
class="buy-btn"
href="${paymentUrl}"
target="_blank">

<i class="fa-solid fa-credit-card"></i>

Buka Pembayaran

</a>
`
:
""
}



<span class="buy-badge">

<i class="fa-solid fa-clock"></i>

Menunggu Pembayaran

</span>


</div>

`;





if(qris){


const qrBox =
document.getElementById(
"qrcode"
);



if(qrBox && window.QRCode){


new QRCode(
qrBox,
{

text:qris,

width:220,

height:220

}

);


}else{


qrBox.innerHTML=`

<p>
QR tidak bisa dibuat.
Gunakan tombol pembayaran.
</p>

`;

}


}




}catch(err){


console.error(
"PAY ERROR:",
err
);



showBuyDebug(
"ERROR\n"+
err.message
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
Terjadi kesalahan
</h3>


<p>

${escapeHtml(err.message)}

</p>


</div>

`;



}



});





function showBuyDebug(text){

let box =
document.getElementById(
"buyDebug"
);



if(!box){


box=document.createElement(
"div"
);


box.id="buyDebug";


box.style.cssText=`

position:fixed;
bottom:10px;
left:10px;
right:10px;
max-height:50vh;
overflow:auto;
z-index:999999;
background:#111;
color:#00ff00;
padding:15px;
border-radius:10px;
font-size:12px;
white-space:pre-wrap;

`;



document.body.appendChild(box);

}



box.innerHTML +=
"\n\n"+text;



}




function escapeHtml(str){

return String(str)

.replaceAll("&","&amp;")

.replaceAll("<","&lt;")

.replaceAll(">","&gt;")

.replaceAll('"',"&quot;")

.replaceAll("'","&#039;");

}
