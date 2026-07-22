// js/payment.js

const db=window.database;
const supabase=db.supabase;

let user=null;
let instantSelected=0;

const instantFee=15000;
const instantDailyLimit=500000;

const rupiah=v=>new Intl.NumberFormat("id-ID",{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}).format(Number(v)||0);

document.addEventListener("DOMContentLoaded",()=>{

init();

document.querySelectorAll("#withdrawBtn").forEach(btn=>{
btn.onclick=submitWithdraw;
});

document.querySelectorAll(".instant-options button").forEach(btn=>{
btn.onclick=()=>{
document.querySelectorAll(".instant-options button").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
instantSelected=Number(btn.dataset.value);
instantAmount.value=instantSelected;
};
});

if(instantMethod){
instantMethod.onchange=()=>{
instantOtherBox.style.display=
instantMethod.value==="Lainnya"
?"block":"none";
};
}

if(instantWithdrawBtn){
instantWithdrawBtn.onclick=submitInstantWithdraw;
}

});

async function init(){

user=await db.getUser();

if(!user){
location.href="login.html";
return;
}

await loadBalance();
await loadWithdraw();
await loadPayment();
await loadInstantLimit();

}

async function loadBalance(){

const profile=await db.getProfile(user.id);

if(profile){
currentBalance.innerText=rupiah(profile.balance);
}

}

async function loadWithdraw(){

const {data,error}=await supabase
.from("withdraws")
.select("*")
.eq("user_id",user.id);

if(error){
console.error(error);
return;
}

let request=0;
let process=0;
let success=0;
let failed=0;
let total=0;

(data||[]).forEach(w=>{

const amount=Number(w.amount)||0;

if(w.status==="request")request+=amount;
if(w.status==="process")process+=amount;

if(w.status==="success"){
success+=amount;
total+=amount;
}

if(w.status==="failed"){
failed+=amount;
}

});

requestWithdraw.innerText=rupiah(request);
pendingWithdraw.innerText=rupiah(process);
successWithdraw.innerText=rupiah(success);
failedWithdraw.innerText=rupiah(failed);

if(typeof totalWithdraw!=="undefined"){
totalWithdraw.innerText=rupiah(total);
}

withdrawStatus.innerHTML=`
<i class="fa-solid fa-circle-check"></i>
Status pembayaran berhasil dimuat.
`;

}

async function loadPayment(){

const {data,error}=await supabase
.from("payment_methods")
.select("*")
.eq("user_id",user.id)
.maybeSingle();

if(error){
console.log(error);
return;
}

if(!data)return;

paymentName.value=data.account_name||"";
paymentNumber.value=data.account_number||"";
paymentMethod.value=data.method||"";

showPayment(data);

}

function showPayment(data){

paymentDetail.style.display="block";

detailContent.innerHTML=`

<div class="detail-row">
<span class="detail-label">Nama</span>
<span class="detail-value">${data.account_name||"-"}</span>
</div>

<div class="detail-row">
<span class="detail-label">Metode</span>
<span class="detail-value">${data.method||"-"}</span>
</div>

<div class="detail-row">
<span class="detail-label">Nomor</span>
<span class="detail-value">${data.account_number||"-"}</span>
</div>

`;

}

savePayment.onclick=async()=>{

const name=paymentName.value.trim();
const number=paymentNumber.value.trim();
const method=paymentMethod.value;

if(!name||!number){
alert("Lengkapi data pembayaran");
return;
}

const payload={
user_id:user.id,
bank_name:method,
account_name:name,
account_number:number,
method:method
};

const {data:old}=await supabase
.from("payment_methods")
.select("id")
.eq("user_id",user.id)
.maybeSingle();

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

alert("Pembayaran berhasil disimpan");

await loadPayment();

};

editPayment.onclick=()=>{

paymentForm.scrollIntoView({
behavior:"smooth"
});

};

async function submitWithdraw(){

const amount=Number(withdrawAmount.value);

if(!amount||amount<100000){
alert("Minimal withdraw Rp100.000");
return;
}

const profile=await db.getProfile(user.id);

if(!profile){
alert("Profile tidak ditemukan");
return;
}

if(Number(profile.balance)<amount){
alert("Saldo tidak mencukupi");
return;
}

const {data:method}=await supabase
.from("payment_methods")
.select("*")
.eq("user_id",user.id)
.maybeSingle();

if(!method){
alert("Simpan rekening pembayaran terlebih dahulu");
return;
}

const {error}=await supabase
.from("withdraws")
.insert({
user_id:user.id,
method:method.method,
account_number:method.account_number,
amount:amount,
type:"manual",
status:"request"
});

if(error){
alert(error.message);
return;
}

const {error:updateError}=await supabase
.from("profiles")
.update({
balance:Number(profile.balance)-amount
})
.eq("id",user.id);

if(updateError){
alert(updateError.message);
return;
}

alert("Request withdraw berhasil dibuat");

withdrawAmount.value="";

await loadBalance();
await loadWithdraw();
await loadPayment();
await loadInstantLimit();

}

async function loadInstantLimit(){

const {data,error}=await supabase
.from("withdraws")
.select("amount")
.eq("user_id",user.id)
.eq("type","instant")
.gte(
"created_at",
new Date(new Date().setHours(0,0,0,0)).toISOString()
);

if(error){
console.log(error);
return;
}

let used=0;

(data||[]).forEach(w=>{
used+=Number(w.amount)||0;
});

let remain=instantDailyLimit-used;

if(remain<0)remain=0;

instantLimitText.innerText=rupiah(remain);

let percent=(used/instantDailyLimit)*100;

if(percent>100)percent=100;

instantProgress.style.width=percent+"%";

}

async function submitInstantWithdraw(){

if(!instantSelected){
alert("Pilih nominal withdraw terlebih dahulu");
return;
}

let name=instantName.value.trim();
let method=instantMethod.value;
let number=instantNumber.value.trim();

if(method==="Lainnya"){
method=instantOtherMethod.value.trim();
}

if(!name||!method||!number){
alert("Lengkapi data withdraw instan");
return;
}

const profile=await db.getProfile(user.id);

if(!profile){
alert("Profile tidak ditemukan");
return;
}

const totalPotong=instantSelected+instantFee;

if(Number(profile.balance)<totalPotong){

alert(
"Saldo tidak cukup.\n"+
"Penarikan Rp"+
instantSelected.toLocaleString("id-ID")+
" membutuhkan saldo Rp"+
totalPotong.toLocaleString("id-ID")
);

return;

}

const {data:today}=await supabase
.from("withdraws")
.select("amount")
.eq("user_id",user.id)
.eq("type","instant")
.gte(
"created_at",
new Date(new Date().setHours(0,0,0,0)).toISOString()
);

let used=0;

(today||[]).forEach(w=>{
used+=Number(w.amount)||0;
});

if(used+instantSelected>instantDailyLimit){
alert("Batas withdraw instan harian Rp500.000 telah tercapai");
return;
}

const {error}=await supabase
.from("withdraws")
.insert({
user_id:user.id,
method:method,
account_number:number,
account_name:name,
amount:instantSelected,
fee:instantFee,
type:"instant",
status:"success"
});

if(error){
alert(error.message);
return;
}

const {error:updateError}=await supabase
.from("profiles")
.update({
balance:Number(profile.balance)-totalPotong
})
.eq("id",user.id);

if(updateError){
alert(updateError.message);
return;
}

alert(
"Withdraw instan berhasil!\n"+
"Nominal: "+rupiah(instantSelected)+
"\nFee: "+rupiah(instantFee)
);

instantName.value="";
instantNumber.value="";
instantAmount.value="";
instantOtherMethod.value="";
instantMethod.selectedIndex=0;
instantSelected=0;

document.querySelectorAll(".instant-options button")
.forEach(btn=>btn.classList.remove("active"));

instantOtherBox.style.display="none";

await loadBalance();
await loadWithdraw();
await loadInstantLimit();

}
