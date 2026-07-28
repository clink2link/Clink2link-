/* =================================
CLICK2PAY SELL LINK SYSTEM
================================= */

document.addEventListener("DOMContentLoaded",()=>{

let sellActive=false;

let sellLinks=[];
let currentUser=null;


/* LOAD USER */

async function loadUser(){
try{
if(window.database){
currentUser =
await database.getUser();
if(currentUser){
sellActive =
currentUser.sell_unlocked ||
currentUser.withdraw_count >= 3;
}
}
}catch(e){
console.log(e);
}
checkAccess();
}

async function loadSellLinks(){
try{
if(!currentUser){
currentUser = await database.getUser();
}
if(!currentUser){
return;
}
let data =
await database.getLinks(currentUser.id);
sellLinks =
data.filter(
item =>
item.link_type==="sell" ||
item.type==="sell"
);
renderLinks();
renderSellStats();
}catch(e){
console.error(
"LOAD SELL LINK ERROR:",
e
);
}
}

function renderSellStats(){

let totalAds =
document.getElementById("totalSellAds");

let totalView =
document.getElementById("totalSellView");

let totalClick =
document.getElementById("totalSellClick");

let totalEarn =
document.getElementById("totalSellEarn");


if(!totalAds) return;


let ads =
sellLinks.length;


let view =
sellLinks.reduce(
(a,b)=>a + Number(b.views || 0),
0
);


let click =
sellLinks.reduce(
(a,b)=>a + Number(b.clicks || 0),
0
);


let earn =
sellLinks.reduce(
(a,b)=>a + Number(b.earnings || 0),
0
);



totalAds.innerText = ads;

totalView.innerText = view;

totalClick.innerText = click;

totalEarn.innerText =
"Rp " + earn.toLocaleString("id-ID");


}
  
/* CEK AKSES */

function checkAccess(){

let status=document.getElementById("sellStatus");
let btn=document.getElementById("createSellBtn");
sellActive =
currentUser.sell_unlocked ||
currentUser.withdraw_count >= 3;
if(sellActive){
if(status)
status.innerHTML=`
<i class="fa-solid fa-circle-check"></i>
Sell Link aktif. Kamu bisa membuat link jual.
`;
if(btn){
btn.disabled=false;
btn.innerText="Buat Sell Link";
}
}else{
if(status)
status.innerHTML=`
<i class="fa-solid fa-lock"></i>
Sell Link terkunci.
Selesaikan 3 withdraw berhasil atau upgrade Premium.
`;
if(btn){
btn.disabled=true;
btn.innerText="Sell Link Terkunci";
}
}
}


/* GENERATE ID */

function generateCode(){

return Math.random()
.toString(36)
.substring(2,10)
.toUpperCase();

}



/* BUAT LINK */

let createBtn=document.getElementById("createSellBtn");


if(createBtn){
createBtn.onclick=async()=>{


if(!sellActive){

alert("Sell Link belum aktif");

return;

}


let title=
document.getElementById("sellTitle").value.trim();


let url=
document.getElementById("sellUrl").value.trim();


let price=
Number(
document.getElementById("sellPrice").value
);



if(!title||!url||!price){

alert("Lengkapi semua data");

return;

}



let code=generateCode();



let saved =
await database.createLink({
user_id:currentUser.id,
type:"sell",
link_type:"sell",
title:title,
destination:url,
destination_url:url,
price:price,
short_code:code
});
if(saved){
await loadSellLinks();
}


document.getElementById("sellTitle").value="";
document.getElementById("sellUrl").value="";
document.getElementById("sellPrice").value="";


alert("Sell Link berhasil dibuat");


};


}




/* TAMPILKAN LIST */

function renderLinks(){

let box=document.getElementById("sellList");


if(!box)return;


box.innerHTML="";


if(sellLinks.length===0){

box.innerHTML=`
<div style="text-align:center;padding:20px;color:#64748b">
Belum ada Sell Link
</div>
`;

return;

}



sellLinks.forEach(item=>{


box.innerHTML+=`

<div class="link-card">

<div class="link-top">

<h3>${item.title}</h3>

<span class="badge success">
AKTIF
</span>

</div>


<div class="link-mid">

<span>
Harga
</span>

<strong>
Rp ${Number(item.price).toLocaleString("id-ID")}
</strong>

</div>


<button class="btn-sell"
onclick="generateLink('${item.id}')">
<i class="fa-solid fa-qrcode"></i>
QR / Link Buy
</button>


</div>

`;

});


}




/* GENERATE LINK ADS BUY */

window.generateLink=function(id){


let item =
sellLinks.find(x=>x.id===id);


if(!item){
return;
}


let code =
item.short_code || item.id;


let buy=`https://click2pay.my.id/b/${code}`;
let ads=`https://click2pay.my.id/a/${code}`;



let box=document.getElementById("generatedBox");


box.innerHTML=`

<section class="sell-card">

<h3>
<i class="fa-solid fa-link"></i>
Link Otomatis
</h3>


<label>
Link Ads
</label>

<input readonly value="${ads}">


<label>
Link Buy
</label>

<input readonly value="${buy}">


<button class="btn-sell"
onclick="copySell('${buy}')">

<i class="fa-solid fa-copy"></i>

Copy Link Buy

</button>


</section>

`;


}



/* COPY */

window.copySell=function(text){
navigator.clipboard.writeText(text)
.then(()=>{
alert("Link berhasil disalin");
})
.catch(err=>{
console.error(
"COPY ERROR:",
err
);
});
};


/* INIT */

(async()=>{
await loadUser();
await loadSellLinks();
})();
});
