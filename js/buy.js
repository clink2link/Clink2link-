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
buyBox.innerHTML="<h3>Link bukan Sell Link</h3>";
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


payBtn.onclick=async()=>{

payBtn.disabled=true;

payBtn.innerHTML=`
<i class="fa-solid fa-spinner fa-spin"></i>
Membuat Pesanan...
`;


try{

const price=Number(link.price||0);


const orderPayload={

link_id:link.id,

seller_id:link.user_id,

price

};


showBuyDebug(
"CREATE ORDER\n"+
JSON.stringify(orderPayload,null,2)
);



const order=
await database.createSellOrder(
orderPayload
);



showBuyDebug(
"ORDER RESULT\n"+
JSON.stringify(order,null,2)
);



const payment=
await database.createPayment({

order_id:order.id

});



showBuyDebug(
"PAYMENT RESULT\n"+
JSON.stringify(payment,null,2)
);



const paymentUrl=
payment.payment_url||
payment.data?.payment_url;



if(!paymentUrl){

throw new Error(
"Payment URL tidak tersedia"
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


<a 
class="buy-btn"
href="${paymentUrl}"
target="_blank">

<i class="fa-solid fa-credit-card"></i>
Buka Pembayaran

</a>


<span class="buy-badge">

<i class="fa-solid fa-clock"></i>
Menunggu Pembayaran

</span>


</div>

`;



}catch(err){

showBuyDebug(
"ERROR\n"+err.message
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


box.innerHTML+="\n\n"+text;

}
