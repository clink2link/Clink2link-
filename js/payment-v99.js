"use strict";

// ======================================================
// PAYMENT V2
// Click2Pay
// Part 1
// ======================================================

let db = null;
let supabase = null;
let user = null;

const instantFee = 15000;
const instantDailyLimit = 500000;

const $ = id => document.getElementById(id);

const currentBalance = $("currentBalance");
const adsBalance = $("adsBalance");
const sellLinkBalance = $("sellLinkBalance");

const requestWithdraw = $("requestWithdraw");
const pendingWithdraw = $("pendingWithdraw");
const successWithdraw = $("successWithdraw");
const failedWithdraw = $("failedWithdraw");
const totalWithdraw = $("totalWithdraw");

const withdrawStatus = $("withdrawStatus");

const paymentForm = $("paymentForm");
const paymentDetail = $("paymentDetail");
const detailContent = $("detailContent");

const paymentName = $("paymentName");
const paymentNumber = $("paymentNumber");
const paymentMethod = $("paymentMethod");

const savePayment = $("savePayment");
const editPayment = $("editPayment");

const withdrawAmount = $("withdrawAmount");
const withdrawBtn = $("withdrawBtn");
const withdrawTopBtn = $("withdrawTopBtn");

const instantLimitText = $("instantLimitText");
const instantProgress = $("instantProgress");

const instantName = $("instantName");
const instantMethod = $("instantMethod");
const instantOtherMethod = $("instantOtherMethod");
const instantOtherBox = $("instantOtherBox");
const instantNumber = $("instantNumber");
const instantAmount = $("instantAmount");
const instantWithdrawBtn = $("instantWithdrawBtn");

let instantSelected = 0;

function rupiah(v){

return new Intl.NumberFormat("id-ID",{

style:"currency",

currency:"IDR",

maximumFractionDigits:0

}).format(Number(v)||0);

}

function status(text,color="#2563eb"){

if(!withdrawStatus)return;

withdrawStatus.innerHTML=
`<span style="color:${color};">${text}</span>`;

}

async function init(){

console.log("PAYMENT INIT");

db=window.database;

if(!db){

console.error("DATABASE NULL");

status("Database belum siap","#ef4444");

return;

}

supabase=db.supabase;

try{

user=await db.getCurrentProfile();

console.log("PROFILE:",user);

if(!user){

location.replace("login.html");

return;

}

await refreshPage();

await loadPaymentMethod();

await loadInstantLimit();

bindEvents();

startRealtime();

}catch(err){

console.error(err);

status("Gagal memuat data pembayaran","#ef4444");

}

}

async function refreshPage(){

await loadBalance();

await loadWithdrawStatistic();

await loadPaymentMethod();

await loadInstantLimit();

}

async function loadBalance(){

if(!user)return;

if(currentBalance)
currentBalance.innerText=rupiah(user.balance);

if(adsBalance)
adsBalance.innerText=rupiah(user.ads_earning_total);

if(sellLinkBalance)
sellLinkBalance.innerText=rupiah(user.sell_earning_total);

}

async function loadWithdrawStatistic(){

const {data,error}=await supabase

.from("withdraws")

.select("*")

.eq("user_id",user.id);

if(error){

console.error(error);

status("Gagal mengambil data withdraw","#ef4444");

return;

}

let pending=0;

let process=0;

let success=0;

let failed=0;

let total=0;

(data||[]).forEach(item=>{

const amount=Number(item.amount)||0;

total+=amount;

switch(item.status){

case "pending":

pending+=amount;

break;

case "process":

process+=amount;

break;

case "success":

success+=amount;

break;

case "failed":

failed+=amount;

break;

}

});

if(requestWithdraw)
requestWithdraw.innerText=rupiah(pending);

if(pendingWithdraw)
pendingWithdraw.innerText=rupiah(process);

if(successWithdraw)
successWithdraw.innerText=rupiah(success);

if(failedWithdraw)
failedWithdraw.innerText=rupiah(failed);

if(totalWithdraw)
totalWithdraw.innerText=rupiah(total);

status("Status pembayaran berhasil dimuat","#16a34a");

}

function bindEvents(){

if(withdrawBtn)
withdrawBtn.onclick=submitWithdraw;

if(withdrawTopBtn)
withdrawTopBtn.onclick=submitWithdraw;

if(savePayment)
savePayment.onclick=savePaymentMethod;

if(editPayment){

editPayment.onclick=()=>{

paymentForm.scrollIntoView({

behavior:"smooth"

});

};

}

if(instantMethod){

instantMethod.onchange=()=>{

instantOtherBox.style.display=

instantMethod.value==="Lainnya"

?"block"

:"none";

};

}

document

.querySelectorAll(".instant-options button")

.forEach(btn=>{

btn.onclick=()=>{

document

.querySelectorAll(".instant-options button")

.forEach(x=>x.classList.remove("active"));

btn.classList.add("active");

instantSelected=Number(btn.dataset.value);

instantAmount.value=instantSelected;

};

});

if(instantWithdrawBtn)
instantWithdrawBtn.onclick=submitInstantWithdraw;

}

document.addEventListener("DOMContentLoaded",init);

// ======================================================
// PAYMENT METHOD
// ======================================================

async function loadPaymentMethod(){

const {data,error}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();

if(error){

console.error(error);

return;

}

if(!data){

if(paymentDetail)
paymentDetail.style.display="none";

if(paymentForm)
paymentForm.style.display="block";

return;

}

if(paymentName)
paymentName.value=data.account_name||"";

if(paymentNumber)
paymentNumber.value=data.account_number||"";

if(paymentMethod)
paymentMethod.value=data.method||"";

renderPaymentMethod(data);

}

function renderPaymentMethod(data){

if(!paymentDetail)return;

paymentDetail.style.display="block";

paymentForm.style.display="none";

detailContent.innerHTML=`

<div class="detail-row">
<span class="detail-label">
Nama
</span>
<span class="detail-value">
${data.account_name||"-"}
</span>
</div>

<div class="detail-row">
<span class="detail-label">
Metode
</span>
<span class="detail-value">
${data.method||"-"}
</span>
</div>

<div class="detail-row">
<span class="detail-label">
Nomor
</span>
<span class="detail-value">
${data.account_number||"-"}
</span>
</div>

`;

}

async function savePaymentMethod(){

const name=paymentName.value.trim();

const number=paymentNumber.value.trim();

const method=paymentMethod.value;

if(name.length<3){

alert("Nama rekening belum benar");

paymentName.focus();

return;

}

if(number.length<6){

alert("Nomor rekening belum benar");

paymentNumber.focus();

return;

}

const payload={

user_id:user.id,

account_name:name,

account_number:number,

method:method,

bank_name:method

};

const {data:old,error:oldError}=await supabase

.from("payment_methods")

.select("id")

.eq("user_id",user.id)

.maybeSingle();

if(oldError){

console.error(oldError);

alert(oldError.message);

return;

}

let result;

if(old){

result=await supabase

.from("payment_methods")

.update(payload)

.eq("user_id",user.id);

}else{

result=await supabase

.from("payment_methods")

.insert(payload);

}

if(result.error){

alert(result.error.message);

return;

}

alert("Metode pembayaran berhasil disimpan");

await loadPaymentMethod();

}

if(editPayment){

editPayment.onclick=()=>{

paymentDetail.style.display="none";

paymentForm.style.display="block";

paymentForm.scrollIntoView({

behavior:"smooth"

});

};

}

// ======================================================
// MANUAL WITHDRAW
// ======================================================

async function submitWithdraw(){

const amount=Number(withdrawAmount.value);

if(!amount){

alert("Masukkan nominal withdraw");

withdrawAmount.focus();

return;

}

if(amount<100000){

alert("Minimal withdraw Rp100.000");

withdrawAmount.focus();

return;

}

const profile=await db.getProfile(user.id);

if(!profile){

alert("Profile tidak ditemukan");

return;

}

const balance=Number(profile.balance)||0;

if(balance<amount){

alert("Saldo tidak mencukupi");

return;

}

const {data:payment,error:paymentError}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();

if(paymentError){

console.error(paymentError);

alert(paymentError.message);

return;

}

if(!payment){

alert("Silakan simpan metode pembayaran terlebih dahulu");

return;

}

const {error}=await supabase

.from("withdraws")

.insert({

user_id:user.id,

amount:amount,

fee:0,

type:"manual",

status:"pending",

method:payment.method,

account_name:payment.account_name,

account_number:payment.account_number

});

if(error){

console.error(error);

alert(error.message);

return;

}

const {error:updateError}=await supabase

.from("profiles")

.update({

balance:balance-amount

})

.eq("id",user.id);

if(updateError){

console.error(updateError);

alert(updateError.message);

return;

}

user.balance=balance-amount;

withdrawAmount.value="";

await refreshPage();

alert("Request withdraw berhasil dikirim");

}

// ======================================================
// INSTANT WITHDRAW
// ======================================================

async function loadInstantLimit(){

const today=new Date();

today.setHours(0,0,0,0);

const {data,error}=await supabase

.from("withdraws")

.select("amount")

.eq("user_id",user.id)

.eq("type","instant")

.gte("created_at",today.toISOString());

if(error){

console.error(error);

return;

}

let used=0;

(data||[]).forEach(item=>{

used+=Number(item.amount)||0;

});

let remain=instantDailyLimit-used;

if(remain<0)remain=0;

if(instantLimitText)
instantLimitText.innerText=rupiah(remain);

if(instantProgress){

let percent=(used/instantDailyLimit)*100;

if(percent>100)percent=100;

instantProgress.style.width=percent+"%";

}

}

async function submitInstantWithdraw(){

if(!instantSelected){

alert("Pilih nominal withdraw");

return;

}

let method=instantMethod.value;

if(method==="Lainnya"){

method=instantOtherMethod.value.trim();

}

const name=instantName.value.trim();

const number=instantNumber.value.trim();

if(!name){

alert("Masukkan nama rekening");

return;

}

if(!number){

alert("Masukkan nomor rekening");

return;

}

if(!method){

alert("Pilih metode pembayaran");

return;

}

const profile=await db.getProfile(user.id);

if(!profile){

alert("Profile tidak ditemukan");

return;

}

const balance=Number(profile.balance)||0;

const totalPotong=instantSelected+instantFee;

if(balance<totalPotong){

alert(
"Saldo tidak cukup.\n\n"+
"Nominal : "+rupiah(instantSelected)+
"\nFee : "+rupiah(instantFee)+
"\nTotal : "+rupiah(totalPotong)
);

return;

}

const today=new Date();

today.setHours(0,0,0,0);

const {data:list}=await supabase

.from("withdraws")

.select("amount")

.eq("user_id",user.id)

.eq("type","instant")

.gte("created_at",today.toISOString());

let used=0;

(list||[]).forEach(item=>{

used+=Number(item.amount)||0;

});

if(used+instantSelected>instantDailyLimit){

alert("Limit withdraw instan hari ini telah habis.");

return;

}

const {error}=await supabase

.from("withdraws")

.insert({

user_id:user.id,

amount:instantSelected,

fee:instantFee,

status:"success",

type:"instant",

method:method,

account_name:name,

account_number:number

});

if(error){

console.error(error);

alert(error.message);

return;

}

const {error:updateError}=await supabase

.from("profiles")

.update({

balance:balance-totalPotong

})

.eq("id",user.id);

if(updateError){

console.error(updateError);

alert(updateError.message);

return;

}

user.balance=balance-totalPotong;

instantName.value="";

instantNumber.value="";

instantOtherMethod.value="";

instantAmount.value="";

instantSelected=0;

instantMethod.selectedIndex=0;

if(instantOtherBox)
instantOtherBox.style.display="none";

document.querySelectorAll(".instant-options button")
.forEach(btn=>btn.classList.remove("active"));

await refreshPage();

alert("Withdraw instan berhasil diproses.");

}

// ======================================================
// REALTIME
// ======================================================

function startRealtime(){

if(!supabase || !user)return;

supabase

.channel("payment-"+user.id)

.on(

"postgres_changes",

{

event:"*",

schema:"public",

table:"profiles",

filter:`id=eq.${user.id}`

},

async()=>{

console.log("PROFILE UPDATED");

user=await db.getCurrentProfile();

await loadBalance();

}

)

.on(

"postgres_changes",

{

event:"*",

schema:"public",

table:"withdraws",

filter:`user_id=eq.${user.id}`

},

async()=>{

console.log("WITHDRAW UPDATED");

await loadWithdrawStatistic();

await loadInstantLimit();

}

)

.on(

"postgres_changes",

{

event:"*",

schema:"public",

table:"payment_methods",

filter:`user_id=eq.${user.id}`

},

async()=>{

console.log("PAYMENT UPDATED");

await loadPaymentMethod();

}

)

.subscribe(status=>{

console.log("REALTIME:",status);

});

}
