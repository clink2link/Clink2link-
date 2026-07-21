/* ==========================================
CLICK2PAY PAYMENT JS
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

loadPayment();

const saveBtn=document.getElementById("savePayment");
if(saveBtn) saveBtn.onclick=savePayment;

const withdrawBtn=document.getElementById("withdrawBtn");
if(withdrawBtn) withdrawBtn.onclick=requestWithdraw;

});


/* LOAD PAYMENT */

async function loadPayment(){

try{

const user=await database.getUser();

if(!user){
window.location.href="login.html";
return;
}

const {data:profile,error}=await database.supabase
.from("profiles")
.select("*")
.eq("id",user.id)
.single();

if(error) throw error;


if(profile){

setText("currentBalance",profile.balance);
setText("pendingWithdraw",profile.pending_withdraw);
setText("successWithdraw",profile.total_withdraw);
setText("failedWithdraw",profile.failed_withdraw);

}


loadWithdrawStatus();
loadPaymentAccount(user.id);


}catch(err){

console.error("Payment Error:",err);

}

}



/* FORMAT */

function formatMoney(value){

return "Rp "+Number(value||0)
.toLocaleString("id-ID");

}


function setText(id,value){

const el=document.getElementById(id);

if(el){
el.innerHTML=formatMoney(value);
}

}



/* WITHDRAW STATUS */

function loadWithdrawStatus(){

const btn=document.getElementById("withdrawBtn");
const status=document.getElementById("withdrawStatus");

const day=new Date().getDay();


if(day===0 || day===5 || day===6){

if(btn){

btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-lock"></i> Pembayaran Sedang Tutup';

}


if(status){

status.innerHTML=
"Pembayaran buka Senin - Kamis. Jumat sampai Minggu sedang tutup.";

}


}else{


if(btn){

btn.disabled=false;

btn.innerHTML=
'<i class="fa-solid fa-money-bill-transfer"></i> Withdraw';

}


if(status){

status.innerHTML=
"Withdraw sedang dibuka.";

}


}

}



/* SAVE PAYMENT */

async function savePayment(){

try{

const user=await database.getUser();

if(!user)return;


const name=document
.getElementById("paymentName")
.value.trim();


const number=document
.getElementById("paymentNumber")
.value.trim();


const method=document
.getElementById("paymentMethod")
.value;



if(!name||!number||!method){

alert("Lengkapi data pembayaran.");
return;

}



const {error}=await database.supabase
.from("payment_methods")
.upsert({

user_id:user.id,
name:name,
number:number,
method:method,
created_at:new Date()

});


if(error)throw error;


alert("Akun pembayaran berhasil disimpan.");

loadPaymentAccount(user.id);


}catch(err){

console.error(err);

alert("Gagal menyimpan pembayaran.");

}

}



/* LOAD ACCOUNT */

async function loadPaymentAccount(userId){

try{


const form=document.getElementById("paymentForm");
const detail=document.getElementById("paymentDetail");


const {data}=await database.supabase
.from("payment_methods")
.select("*")
.eq("user_id",userId)
.maybeSingle();



if(data){


if(form)
form.style.display="none";


if(detail){

detail.style.display="block";


detail.innerHTML=`

<div class="detail-row">
<span class="detail-label">Nama Rekening</span>
<span class="detail-value">${data.name}</span>
</div>

<div class="detail-row">
<span class="detail-label">Nomor</span>
<span class="detail-value">${data.number}</span>
</div>

<div class="detail-row">
<span class="detail-label">Metode</span>
<span class="detail-value">${data.method}</span>
</div>

<button class="btn-secondary" onclick="changePayment()">
<i class="fa-solid fa-pen"></i>
Ganti Pembayaran
</button>

`;

}


}


}catch(err){

console.error(err);

}

}



/* CHANGE PAYMENT */

window.changePayment=function(){

const form=document.getElementById("paymentForm");
const detail=document.getElementById("paymentDetail");


if(form)
form.style.display="block";


if(detail)
detail.style.display="none";


}



/* REQUEST WITHDRAW */

async function requestWithdraw(){

try{


const user=await database.getUser();

if(!user)return;


const amount=Number(
document.getElementById("withdrawAmount")?.value||0
);



if(amount<=0){

alert("Masukkan nominal withdraw.");
return;

}



const {data:profile}=await database.supabase
.from("profiles")
.select("username,balance")
.eq("id",user.id)
.single();



if(!profile){

alert("Profile tidak ditemukan.");
return;

}



if(Number(profile.balance)<amount){

alert("Saldo tidak cukup.");
return;

}



/* INSERT WITHDRAW */

const {data:withdraw,error}=await database.supabase
.from("withdraws")
.insert({

user_id:user.id,
amount:amount,
status:"pending",
created_at:new Date()

})
.select()
.single();



if(error)throw error;



/* UPDATE PROFILE */

await database.supabase
.from("profiles")
.update({

balance:
Number(profile.balance)-amount,

pending_withdraw:
amount

})
.eq("id",user.id);




/* NOTIF ADMIN */

await database.supabase
.from("admin_notifications")
.insert({

type:"withdraw",

title:"Request Withdraw Baru",

message:
`${profile.username||"User"} request withdraw Rp ${amount.toLocaleString("id-ID")}`,

withdraw_id:withdraw.id,

is_read:false,

created_at:new Date()

});



alert(
"Request withdraw berhasil dikirim."
);


loadPayment();



}catch(err){

console.error("WD ERROR:",err);

alert(
"Withdraw gagal."
);

}

}
