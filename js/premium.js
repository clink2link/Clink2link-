/* =========================
CONFIG
========================= */
const USER_KEY = "c2p_user";

/* =========================
USER HELPERS
========================= */
function getUser(){
return JSON.parse(localStorage.getItem(USER_KEY)) || {};
}

function saveUser(user){
localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isPremium(){
return getUser().premium === true;
}

/* =========================
INIT BUTTON
========================= */
document.addEventListener("DOMContentLoaded", () => {

const btnTop = document.getElementById("btnUpgrade");
const btnBottom = document.getElementById("btnUpgradeBottom");

// jika sudah premium
if(isPremium()){
updatePremiumUI();
}

// klik tombol upgrade
if(btnTop){
btnTop.addEventListener("click", upgradePremium);
}

if(btnBottom){
btnBottom.addEventListener("click", upgradePremium);
}

});

/* =========================
UPGRADE (DUMMY)
========================= */
function upgradePremium(){

const confirmBuy = confirm("Upgrade ke Premium Rp25.000 / bulan?");

if(!confirmBuy) return;

let user = getUser();

user.premium = true;
user.premium_since = new Date().toISOString();

saveUser(user);

showToast("🔥 Kamu sekarang Premium!");

setTimeout(()=>{
location.reload();
},800);

}

/* =========================
UPDATE UI PREMIUM
========================= */
function updatePremiumUI(){

// tombol upgrade disable
document.querySelectorAll(".btn-upgrade").forEach(btn=>{
btn.innerText = "Kamu sudah Premium 💎";
btn.disabled = true;
btn.style.opacity = "0.7";
});

// optional: kasih badge
const title = document.querySelector(".page-title h1");
if(title){
title.innerHTML += " <span style='color:gold'>💎</span>";
}

}

/* =========================
ADS SYSTEM
========================= */

function getAdsDelay(){
return isPremium() ? 0 : 10;
}

function openAdsLink(url){

const delay = getAdsDelay();

if(delay === 0){
window.location.href = url;
return;
}

showAdsLoading(delay, url);

}

/* =========================
ADS LOADER UI
========================= */
function showAdsLoading(seconds, url){

let overlay = document.createElement("div");
overlay.className = "ads-loading";

overlay.innerHTML = `
<div class="ads-box">
<h3>⏳ Tunggu ${seconds} detik</h3>
<p>Iklan sedang diproses...</p>
<div class="ads-timer" id="adsTimer">${seconds}</div>
</div>
`;

document.body.appendChild(overlay);

let time = seconds;

const interval = setInterval(()=>{
time--;

const timerEl = document.getElementById("adsTimer");
if(timerEl){
timerEl.innerText = time;
}

if(time <= 0){
clearInterval(interval);
window.location.href = url;
}

},1000);

}

/* =========================
TOAST NOTIFICATION
========================= */
function showToast(message){

let toast = document.createElement("div");
toast.className = "c2p-toast";
toast.innerText = message;

document.body.appendChild(toast);

setTimeout(()=>{
toast.classList.add("show");
},100);

setTimeout(()=>{
toast.classList.remove("show");

setTimeout(()=>{
toast.remove();
},300);

},2500);

}
