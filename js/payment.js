// js/payment.js
console.log("PAYMENT JS AKTIF");
const db = window.database;
const supabase = db.supabase;

const currentBalance = document.getElementById("currentBalance");
const adsBalance = document.getElementById("adsBalance");
const sellLinkBalance = document.getElementById("sellLinkBalance");

const requestWithdraw = document.getElementById("requestWithdraw");
const pendingWithdraw = document.getElementById("pendingWithdraw");
const successWithdraw = document.getElementById("successWithdraw");
const failedWithdraw = document.getElementById("failedWithdraw");
const totalWithdraw = document.getElementById("totalWithdraw");

const withdrawStatus = document.getElementById("withdrawStatus");

const instantLimitText = document.getElementById("instantLimitText");
const instantProgress = document.getElementById("instantProgress");

const paymentName = document.getElementById("paymentName");
const paymentNumber = document.getElementById("paymentNumber");
const paymentMethod = document.getElementById("paymentMethod");
const paymentDetail = document.getElementById("paymentDetail");
const detailContent = document.getElementById("detailContent");
const paymentForm = document.getElementById("paymentForm");
const savePayment = document.getElementById("savePayment");
const editPayment = document.getElementById("editPayment");

const withdrawAmount = document.getElementById("withdrawAmount");

const instantAmount = document.getElementById("instantAmount");
const instantName = document.getElementById("instantName");
const instantMethod = document.getElementById("instantMethod");
const instantOtherMethod = document.getElementById("instantOtherMethod");
const instantOtherBox = document.getElementById("instantOtherBox");
const instantNumber = document.getElementById("instantNumber");
const instantWithdrawBtn = document.getElementById("instantWithdrawBtn");

let user = null;
let instantSelected = 0;

const instantFee = 15000;
const instantDailyLimit = 500000;

const rupiah=v=>new Intl.NumberFormat("id-ID",{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}).format(Number(v)||0);

document.addEventListener("DOMContentLoaded",()=>{

await init();

const withdrawBtn=document.getElementById("withdrawBtn");
const withdrawTopBtn=document.getElementById("withdrawTopBtn");

if(withdrawBtn){
withdrawBtn.onclick=submitWithdraw;
}

if(withdrawTopBtn){
withdrawTopBtn.onclick=submitWithdraw;
}

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

    await refreshPage();

}

// TAMBAHKAN DI SINI
async function refreshPage(){

    await loadBalance();
    await loadWithdraw();
    await loadPayment();
    await loadInstantLimit();

}

async function loadBalance(){

    const profile=await db.getProfile(user.id);

    if(!profile)return;

    adsBalance.innerText=rupiah(profile.ads_earning_total||0);
    sellLinkBalance.innerText=rupiah(profile.sell_earning_total||0);
    currentBalance.innerText=rupiah(profile.balance||0);

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

let pending=0;
let process=0;
let success=0;
let failed=0;
let total=0;

(data||[]).forEach(w=>{

    const amount = Number(w.amount)||0;

    total += amount;

    switch(w.status){

        case "pending":
            pending += amount;
            break;

        case "process":
            process += amount;
            break;

        case "success":
            success += amount;
            break;

        case "failed":
            failed += amount;
            break;
    }

});

requestWithdraw.innerText=rupiah(pending);
pendingWithdraw.innerText=rupiah(process);
successWithdraw.innerText=rupiah(success);
failedWithdraw.innerText=rupiah(failed);

if (totalWithdraw) {
    totalWithdraw.innerText = rupiah(total);
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

if(!data){

paymentDetail.style.display="none";

return;

}

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

if(!method){
    alert("Pilih metode pembayaran");
    return;
}

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

paymentName.value="";
paymentNumber.value="";
paymentMethod.selectedIndex=0;

await refreshPage();

}; // <-- ini penutup savePayment

editPayment.onclick=()=>{

paymentForm.scrollIntoView({
behavior:"smooth"
});

};

async function submitWithdraw(){

const amount=Number(withdrawAmount.value);

if(!amount||amount<100000){

alert("Minimal withdraw Rp100.000");

withdrawAmount.focus();

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
status:"pending"
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
withdrawAmount.blur();

await refreshPage();

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

if(name.length<3){
alert("Nama rekening tidak valid");
return;
}

if(number.length<6){
alert("Nomor rekening tidak valid");
return;
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
instantMethod.dispatchEvent(new Event("change"));
instantSelected=0;

document.querySelectorAll(".instant-options button")
.forEach(btn=>btn.classList.remove("active"));

await refreshPage();

}
