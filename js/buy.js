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

if(link.link_type!=="sell"){
buyBox.innerHTML="<h3>Link ini bukan Sell Link</h3>";
return;
}

buyBox.innerHTML=`
<div class="sell-card">
<h2>${link.title}</h2>
<p>Harga: <b>Rp ${Number(link.price||0).toLocaleString("id-ID")}</b></p>
<button class="btn-sell" id="payBtn">Bayar Sekarang</button>
</div>
`;

document.getElementById("payBtn").addEventListener("click",()=>{

console.log("PAY:",link);

// TODO:
// Panggil BayarGG / payment.html di sini

});

}catch(err){

console.error("BUY ERROR:",err);

buyBox.innerHTML="<h3>Terjadi kesalahan</h3>";

}

});
