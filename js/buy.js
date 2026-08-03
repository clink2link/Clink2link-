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

${link.title || "Sell Link"}

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

document.getElementById("payBtn").addEventListener("click",async()=>{

console.log("PAY:",link);

try{

const payment=calculateSellPayment(link.price);

const order=await database.createSellOrder({

link_id:link.id,

seller_id:link.user_id,

buyer_id:null,

price:Number(link.price),

fee:payment.fee,

seller_receive:payment.seller_receive,

destination_url:link.destination_url||link.destination

});

console.log("ORDER CREATED:",order);

alert("Order berhasil dibuat. Lanjut pembayaran.");

// NANTI BAYARGG:
// location.href="../payment.html?id="+order.id;

}catch(err){

console.error("CREATE ORDER ERROR:",err);

alert("Gagal membuat order.");

}

});

}catch(err){

console.error("BUY ERROR:",err);

buyBox.innerHTML="<h3>Terjadi kesalahan</h3>";

}

});
