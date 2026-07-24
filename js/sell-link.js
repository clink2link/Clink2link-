/* =================================
CLICK2PAY SELL LINK SYSTEM
================================= */

document.addEventListener("DOMContentLoaded",()=>{

let userPremium=false;
let withdrawSuccess=0;
let sellActive=false;

let sellLinks=[];


/* LOAD USER */

async function loadUser(){

try{

if(window.database){

let user=await database.getUser();

if(user){

userPremium=user.is_premium||false;
withdrawSuccess=user.withdraw_success||0;

}

}

}catch(e){

console.log(e);

}


checkAccess();

}


/* CEK AKSES */

function checkAccess(){

let status=document.getElementById("sellStatus");
let btn=document.getElementById("createSellBtn");


sellActive=
userPremium ||
withdrawSuccess>=3;



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

return "C2P-"+Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();

}



/* BUAT LINK */

let createBtn=document.getElementById("createSellBtn");


if(createBtn){

createBtn.onclick=()=>{


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



let data={

id:code,

title:title,

url:url,

price:price,

ads:
`https://click2pay.com/ads/${code}`,

buy:
`https://click2pay.com/buy/${code}`,

created:
new Date().toLocaleDateString("id-ID")

};



sellLinks.unshift(data);



renderLinks();


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
Rp ${item.price.toLocaleString("id-ID")}
</strong>

</div>


<button class="btn-sell"
onclick="generateLink('${item.id}')">

Generate Link

</button>


</div>

`;

});


}




/* GENERATE LINK ADS BUY */

window.generateLink=function(id){


let item=
sellLinks.find(x=>x.id===id);


if(!item)return;



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

<input readonly value="${item.ads}">


<label>
Link Buy
</label>

<input readonly value="${item.buy}">


<button class="btn-sell"
onclick="copySell('${item.buy}')">

Copy Link Buy

</button>


</section>

`;



}




/* COPY */

window.copySell=function(text){

navigator.clipboard.writeText(text);

alert("Link berhasil disalin");

}





loadUser();


});
