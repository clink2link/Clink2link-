document.addEventListener("DOMContentLoaded",async()=>{

const code=location.pathname.split("/").pop();

if(!code){
document.getElementById("buyBox").innerHTML="<h3>Link tidak valid</h3>";
return;
}

console.log("BUY CODE:",code);

try{

const link=await database.getLinkByCode(code);

if(!link||link.link_type!=="sell"){
document.getElementById("buyBox").innerHTML="<h3>Link tidak ditemukan</h3>";
return;
}

document.getElementById("buyBox").innerHTML=`
<div class="sell-card">
<h2>${link.title}</h2>
<p>Harga: <b>Rp ${Number(link.price).toLocaleString("id-ID")}</b></p>
<button class="btn-sell" id="payBtn">Bayar Sekarang</button>
</div>
`;

document.getElementById("payBtn").onclick=()=>{
console.log("Bayar:",link);
};

}catch(err){

console.error("BUY ERROR:",err);

document.getElementById("buyBox").innerHTML="<h3>Terjadi kesalahan</h3>";

}

});
