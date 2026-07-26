document.addEventListener("DOMContentLoaded",async()=>{

const adsBox=document.getElementById("adsBox");

const code=window.ADS_CODE;

if(!code){
adsBox.innerHTML="<h3>Link tidak valid</h3>";
return;
}

const link=await database.getLinkByCode(code);

if(!link){
adsBox.innerHTML="<h3>Link tidak ditemukan</h3>";
return;
}

if(link.link_type!=="sell"){
adsBox.innerHTML="<h3>Bukan Sell Link</h3>";
return;
}

let time=10;

adsBox.innerHTML=`
<div class="sell-card">

<h2>${link.title}</h2>

<p>
Silakan tunggu <b id="timer">${time}</b> detik
</p>

<p>
Iklan sedang dimuat...
</p>

</div>
`;

const timer=document.getElementById("timer");

const interval=setInterval(()=>{

time--;

timer.textContent=time;

if(time<=0){

clearInterval(interval);

location.href="/s/"+code;

}

},1000);

});
