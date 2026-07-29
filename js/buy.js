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
<div class="sell-card">
<h2>${link.title||"Sell Link"}</h2>

<p>
Harga:
<b>Rp ${Number(link.price||0).toLocaleString("id-ID")}</b>
</p>

<p>
Terjual:
<b>${link.sold||0}x</b>
</p>

<button class="btn-sell" id="payBtn">
<i class="fa-solid fa-cart-shopping"></i>
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
