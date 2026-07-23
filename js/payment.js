console.log("PAYMENT JS AKTIF");

"use strict";

let supabase = null;
let user = null;

let withdrawOpen = false;
let instantSelected = 0;


const $ = id => document.getElementById(id);



document.addEventListener("DOMContentLoaded",async()=>{


if(!window.database){

alert("DATABASE BELUM SIAP");

return;

}


supabase = window.database.supabase;

user = await window.database.getCurrentProfile();

console.log("USER:", user);

if (!user || !user.id) {
    alert("User tidak valid / belum login");
    location.replace("login.html");
    return;
}



if(!user){

location.replace("login.html");

return;

}



checkWithdrawService();

await loadBalance();

await checkPayment();

await loadWithdrawStats();

bindEvent();


});





// =========================
// CEK JAM WITHDRAW
// =========================


function checkWithdrawService(){


const box = $("withdrawService");


const btn = $("manualScrollBtn");


const now = new Date();


const day = now.getDay();

const hour = now.getHours();



if(
day >= 1 &&
day <= 5 &&
hour >= 8 &&
hour < 18
){


withdrawOpen = true;


box.innerHTML = `

<i class="fa-solid fa-circle-check"></i>

Withdraw buka

<br>

Senin - Jumat
08:00 - 18:00 WIB

`;

box.style.color="#16a34a";


if(btn){

btn.disabled=false;

btn.style.opacity="1";

}


}else{


withdrawOpen=false;


box.innerHTML = `

<i class="fa-solid fa-circle-xmark"></i>

Withdraw sedang tutup

<br>

Buka Senin - Jumat
08:00 - 18:00 WIB

`;

box.style.color="#dc2626";


if(btn){

btn.disabled=true;

btn.style.opacity="0.5";

}


}



}







// =========================
// LOAD SALDO
// =========================


async function loadBalance(){


$("balance").innerText =
rupiah(user.balance);



$("adsBalance").innerText =
rupiah(user.ads_earning_total);



$("sellBalance").innerText =
rupiah(user.sell_earning_total);



}








// =========================
// CEK REKENING
// =========================


async function checkPayment(){


const warning = $("paymentWarning");



const {data,error}=await supabase

.from("payment_methods")

.select("id")

.eq("user_id",user.id)

.maybeSingle();



if(error){

console.error(error);

return;

}



if(!data){

warning.style.display="flex";

}else{

warning.style.display="none";

}


}







// =========================
// STATISTIK WD
// =========================


async function loadWithdrawStats(){


const {data,error}=await supabase

.from("withdraws")

.select("*")

.eq("user_id",user.id);



if(error){

console.error(error);

return;

}



let success=0;

let pending=0;

let failed=0;



(data||[]).forEach(w=>{


let amount =
Number(w.amount)||0;



if(w.status==="success"){

success+=amount;

}


if(w.status==="pending"){

pending+=amount;

}


if(w.status==="failed"){

failed+=amount;

}


});



$("successWD").innerText =
rupiah(success);


$("pendingWD").innerText =
rupiah(pending);


$("failedWD").innerText =
rupiah(failed);



}







// =========================
// EVENT
// =========================


function bindEvent(){



const scrollBtn=$("manualScrollBtn");


if(scrollBtn){


scrollBtn.onclick=()=>{


if(!withdrawOpen){

alert(
"Withdraw sedang tutup.\n\nJam:\nSenin - Jumat\n08:00 - 18:00 WIB"
);

return;

}



$("manualWithdrawBox")
.scrollIntoView({

behavior:"smooth"

});


};



}





const manualBtn=$("manualWithdrawBtn");


if(manualBtn){

manualBtn.onclick =
manualWithdraw;

}



document

.querySelectorAll(".instant-options button")

.forEach(btn=>{


btn.onclick=()=>{


document

.querySelectorAll(".instant-options button")

.forEach(x=>x.classList.remove("active"));



btn.classList.add("active");


instantSelected =
Number(btn.dataset.value);



$("instantAmount").value =
instantSelected;



};



});




const instantBtn=$("instantWithdrawBtn");


if(instantBtn){

instantBtn.onclick =
instantWithdraw;

}



}







// =========================
// WD MANUAL
// =========================


async function manualWithdraw(){


if(!withdrawOpen){

alert("Withdraw sedang tutup");

return;

}



const amount =
Number($("manualAmount").value);



if(!amount){

alert("Masukkan nominal withdraw");

return;

}



if(amount < 100000){

alert("Minimal withdraw Rp100.000");

return;

}




const {data:payment}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();



if(!payment){

alert(
"Silakan simpan rekening terlebih dahulu"
);

location.href="paymentsetting.html";

return;

}




const profile =
await database.getCurrentProfile();



if(profile.balance < amount){

alert("Saldo tidak cukup");

return;

}





const {error}=await supabase

.from("withdraws")

.insert({

user_id:user.id,

method:payment.method,

account_number:payment.account_number,

amount:amount,

status:"pending",

type:"manual",

fee:0

});



if(error){

alert(error.message);

return;

}





await supabase

.from("profiles")

.update({

balance:
Number(profile.balance)-amount

})

.eq("id",user.id);



alert(
"Withdraw manual berhasil dibuat"
);



location.reload();


}







// =========================
// WD INSTANT
// =========================


async function instantWithdraw(){


if(!withdrawOpen){

alert("Withdraw sedang tutup");

return;

}



if(!instantSelected){

alert("Pilih nominal");

return;

}



const profile =
await database.getCurrentProfile();



const fee = 15000;


const total =
instantSelected + fee;



if(profile.balance < total){

alert(
"Saldo tidak cukup\n\n"+
"Withdraw : "+rupiah(instantSelected)+
"\nFee : "+rupiah(fee)
);

return;

}



const {data:payment}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();



if(!payment){

alert(
"Simpan rekening terlebih dahulu"
);

location.href="paymentsetting.html";

return;

}





const {data:list}=await supabase

.from("withdraws")

.select("amount")

.eq("user_id",user.id)

.eq("type","instant");



let used=0;


(list||[]).forEach(x=>{

used += Number(x.amount)||0;

});



if(
used + instantSelected > 500000
){

alert(
"Limit instant hari ini habis"
);

return;

}




const {error}=await supabase

.from("withdraws")

.insert({

user_id:user.id,

method:payment.method,

account_number:payment.account_number,

amount:instantSelected,

status:"success",

type:"instant",

fee:fee

});



if(error){

alert(error.message);

return;

}



await supabase

.from("profiles")

.update({

balance:
Number(profile.balance)-total

})

.eq("id",user.id);



alert(
"Withdraw instant berhasil"
);


location.reload();


}








// =========================
// FORMAT
// =========================


function rupiah(value){


return new Intl.NumberFormat(
"id-ID",
{

style:"currency",

currency:"IDR",

maximumFractionDigits:0

}

).format(
Number(value)||0
);


}
