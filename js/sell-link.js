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
if(!currentUser) return;

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

    const totalLink = document.getElementById("totalLink");
    const totalSold = document.getElementById("totalSold");

    if(totalLink){
        totalLink.textContent = sellLinks.length;
    }

    if(totalSold){

        const sold = sellLinks.reduce(
            (a,b)=>a + Number(b.sales || b.sold || 0),
            0
        );

        totalSold.textContent = sold;

    }

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
if(saved){
    await loadSellLinks();
    generateLink(saved.id || code);
}

document.getElementById("sellTitle").value="";
document.getElementById("sellUrl").value="";
document.getElementById("sellPrice").value="";


alert("Sell Link berhasil dibuat");


};


}




/* TAMPILKAN LIST */

function renderLinks(){

    const box = document.getElementById("sellList");

    if(!box) return;

    box.innerHTML = "";

    if(sellLinks.length===0){

        box.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-box-open"></i>
            <h3>Belum Ada Sell Link</h3>
            <p>Buat Sell Link pertama Anda.</p>
        </div>
        `;

        return;

    }

    sellLinks.forEach(item=>{

        const sold = Number(item.sales || item.sold || 0);

        const code = item.short_code || item.id;

        box.innerHTML += `

        <div class="link-card">

            <h3>${item.title}</h3>

            <div class="badge-group">
                <span class="badge green">
                    AKTIF
                </span>

                <span class="badge pink">
                    Terjual ${sold}x
                </span>
            </div>

            <div class="link-meta">

                <span>
                    <i class="fa-solid fa-tag"></i>
                    Rp ${Number(item.price).toLocaleString("id-ID")}
                </span>

                <span>
                    <i class="fa-solid fa-link"></i>
                    ${code}
                </span>

            </div>

            <div class="link-actions">

                <button
                    class="btn-copy"
                    onclick="generateLink('${item.id}')">

                    <i class="fa-solid fa-qrcode"></i>

                    Generate Link

                </button>

            </div>

        </div>

        `;

    });

}




/* GENERATE LINK ADS BUY */

window.generateLink = function(id){

    const item = sellLinks.find(x=>x.id===id);

    if(!item) return;

    const code = item.short_code || item.id;

    const buy = `https://click2pay.my.id/b/${code}`;
    const ads = `https://click2pay.my.id/a/${code}`;

    document.getElementById("generatedBox").innerHTML = `

    <div class="link-card">

        <h3>${item.title}</h3>

        <div class="badge-group">

            <span class="badge green">
                Link Siap Digunakan
            </span>

        </div>

        <label>Ads Link</label>

        <div class="copy-box">

            <input
                id="adsLink"
                readonly
                value="${ads}">

            <button
                onclick="copySell('${ads}')">

                <i class="fa-solid fa-copy"></i>

            </button>

        </div>

        <label>Buy Link</label>

        <div class="copy-box">

            <input
                id="buyLink"
                readonly
                value="${buy}">

            <button
                onclick="copySell('${buy}')">

                <i class="fa-solid fa-copy"></i>

            </button>

        </div>

    </div>

    `;

};



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
