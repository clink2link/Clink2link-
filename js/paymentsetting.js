"use strict";

let user=null;
let supabase=null;

document.addEventListener("DOMContentLoaded",async()=>{

if(!window.database){
console.error("DATABASE BELUM SIAP");
return;
}

supabase=database.supabase;

user=await database.getCurrentProfile();

if(!user){
location.href="login.html";
return;
}

await loadPayment();

bindPaymentEvent();

});


// =============================
// LOAD PAYMENT
// =============================

async function loadPayment(){

const {data,error}=await supabase
.from("payment_methods")
.select("*")
.eq("user_id",user.id)
.maybeSingle();

if(error){
console.error("LOAD PAYMENT ERROR",error);
return;
}

if(data){

showSavedPayment(data);

document.getElementById("accountName").value=data.account_name || "";

document.getElementById("accountNumber").value=data.account_number || "";

document.getElementById("paymentMethod").value=data.method || data.bank_name;

}

}


// =============================
// SIMPAN PAYMENT
// =============================

async function savePayment(){

const accountName=document.getElementById("accountName").value.trim();

const method=document.getElementById("paymentMethod").value;

const accountNumber=document.getElementById("accountNumber").value.trim();


if(!accountName || !accountNumber){

alert("Lengkapi data pembayaran terlebih dahulu");

return;

}


const {data:oldData}=await supabase
.from("payment_methods")
.select("id")
.eq("user_id",user.id)
.maybeSingle();


let result;


const payload={

bank_name:method,

method:method,

account_name:accountName,

account_number:accountNumber

};


if(oldData){

result=await supabase
.from("payment_methods")
.update(payload)
.eq("id",oldData.id)
.select()
.single();


}else{


result=await supabase
.from("payment_methods")
.insert({

user_id:user.id,

...payload

})
.select()
.single();

}



if(result.error){

console.error(result.error);

alert("Gagal menyimpan pembayaran");

return;

}


alert("Pembayaran berhasil disimpan");


showSavedPayment(result.data);


}


// =============================
// TAMPIL DATA
// =============================

function showSavedPayment(data){

const box=document.getElementById("savedPayment");

const detail=document.getElementById("paymentDetail");


if(!box || !detail)
return;


box.style.display="block";


detail.innerHTML=`

<div class="detail-row">
<span>Bank / E-Wallet</span>
<b>${data.method || data.bank_name}</b>
</div>

<div class="detail-row">
<span>Nama</span>
<b>${data.account_name}</b>
</div>

<div class="detail-row">
<span>Nomor</span>
<b>${maskNumber(data.account_number)}</b>
</div>

<div class="detail-row">
<span>Status</span>
<b style="color:#16a34a">Aktif</b>
</div>

`;

}


// =============================
// REQUEST BANK BARU
// =============================

async function requestPayment(){

const name=document.getElementById("requestMethod").value.trim();


if(!name){

alert("Masukkan nama bank atau e-wallet");

return;

}


const {error}=await supabase
.from("payment_requests")
.insert({
user_id:user.id,
payment_name:name,
status:"pending"
});


if(error){

console.error(
"REQUEST PAYMENT ERROR:",
error
);

alert(
"Gagal mengirim request"
);

return;

}


alert(
"Request berhasil dikirim.\nAdmin akan melakukan pengecekan."
);


document.getElementById("requestMethod").value="";


// =============================
// EVENT
// =============================

function bindPaymentEvent(){

const save=document.getElementById("savePayment");

if(save){
save.onclick=savePayment;
}


const request=document.getElementById("requestPaymentBtn");

if(request){
request.onclick=requestPayment;
}


const edit=document.getElementById("editPayment");

if(edit){

edit.onclick=()=>{

window.scrollTo({
top:0,
behavior:"smooth"
});

};

}

}


// =============================
// MASK NOMOR
// =============================

function maskNumber(number){

if(!number)
return "-";


let value=String(number);


if(value.length<=4)
return value;


return value.substring(0,3)+"****"+value.substring(value.length-3);

}
