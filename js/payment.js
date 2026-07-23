"use strict";

let supabase=null;
let user=null;
let withdrawOpen=false;

const $=id=>document.getElementById(id);

document.addEventListener("DOMContentLoaded",async()=>{

if(!window.database){
console.error("Database belum siap");
return;
}

supabase=database.supabase;

user=await database.getCurrentProfile();

if(!user){
location.href="login.html";
return;
}

checkWithdrawService();
await loadBalance();
await checkPayment();
await loadWithdrawStats();

bindEvent();

});


// =============================
// SERVICE WD
// =============================

function checkWithdrawService(){

const box=$("withdrawService");
const btn=$("manualScrollBtn");

const now=new Date();

const day=now.getDay();
const hour=now.getHours();

if(day>=1&&day<=5&&hour>=8&&hour<18){

withdrawOpen=true;

if(box){

box.innerHTML=`
<i class="fa-solid fa-circle-check"></i>
Withdraw sedang buka
<br>
Senin - Jumat | 08:00 - 18:00
`;

box.style.color="#16a34a";

}

if(btn){
btn.disabled=false;
btn.style.opacity="1";
}

}else{

withdrawOpen=false;

if(box){

box.innerHTML=`
<i class="fa-solid fa-circle-xmark"></i>
Withdraw sedang tutup
<br>
Buka Senin - Jumat | 08:00 - 18:00
`;

box.style.color="#dc2626";

}

if(btn){

btn.disabled=true;
btn.style.opacity="0.5";

}

}

}



// =============================
// LOAD SALDO
// =============================

async function loadBalance(){

if(!user)return;

$("balance").innerText=rupiah(user.balance);

$("adsBalance").innerText=
rupiah(user.ads_earning_total);

$("sellBalance").innerText=
rupiah(user.sell_earning_total);

}



// =============================
// CEK REKENING
// =============================

async function checkPayment(){

const warning=$("paymentWarning");

if(!warning)return;


const {data,error}=await supabase
.from("payment_methods")
.select("id")
.eq("user_id",user.id)
.maybeSingle();


if(error){

console.log(error);
return;

}


if(data){

warning.style.display="none";

}else{

warning.style.display="flex";

}

}



// =============================
// STATISTIK WD
// =============================

async function loadWithdrawStats(){

const {data,error}=await supabase
.from("withdraws")
.select("*")
.eq("user_id",user.id);


if(error){

console.log(error);
return;

}


let success=0;
let pending=0;
let failed=0;


(data||[]).forEach(w=>{

const amount=Number(w.amount)||0;


if(w.status==="success")
success+=amount;


if(w.status==="pending")
pending+=amount;


if(w.status==="failed")
failed+=amount;


});


if($("successWD"))
$("successWD").innerText=rupiah(success);


if($("pendingWD"))
$("pendingWD").innerText=rupiah(pending);


if($("failedWD"))
$("failedWD").innerText=rupiah(failed);


}



// =============================
// BUTTON
// =============================

function bindEvent(){

const btn=$("manualScrollBtn");

if(!btn)return;


btn.onclick=()=>{


if(!withdrawOpen){

alert(
"Withdraw sedang tutup.\n\nJam buka:\nSenin - Jumat\n08:00 - 18:00"
);

return;

}


const box=$("withdrawBox");

if(box){

box.scrollIntoView({
behavior:"smooth"
});

}


};


}



// =============================
// FORMAT RUPIAH
// =============================

function rupiah(value){

return new Intl.NumberFormat("id-ID",{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}).format(Number(value)||0);

}
