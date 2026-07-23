"use strict";


let supabase=null;
let user=null;

const instantFee=15000;
const instantLimit=500000;


const $=id=>document.getElementById(id);



document.addEventListener("DOMContentLoaded",async()=>{

if(!window.database){
console.error("Database tidak ditemukan");
return;
}


supabase=database.supabase;


user=await database.getCurrentProfile();


if(!user){

location.href="login.html";
return;

}


await initPayment();


});




async function initPayment(){

await checkWithdrawService();

await loadBalance();

await checkPaymentAccount();

await loadWithdrawStatistic();


bindPaymentEvent();

}






// ===============================
// CEK JAM WD
// ===============================


function checkWithdrawService(){


const box=$("withdrawService");

if(!box)return;


let now=new Date();

let day=now.getDay();

let hour=now.getHours();



let open=true;



// minggu 0 sabtu 6

if(day===0 || day===6){

open=false;

}



if(hour<8 || hour>=18){

open=false;

}




if(open){


box.innerHTML=
`
<i class="fa-solid fa-circle-check"></i>
Withdraw Dibuka
<br>
08:00 - 18:00 WIB
`;

box.className="payment-status success";


}else{


box.innerHTML=
`
<i class="fa-solid fa-lock"></i>
Withdraw Ditutup
<br>
Senin - Jumat 08:00 - 18:00 WIB
`;


box.className="payment-status danger";


}


return open;


}





// ===============================
// SALDO
// ===============================


async function loadBalance(){


$("balance").innerText=
rupiah(user.balance);


$("adsBalance").innerText=
rupiah(user.ads_earning_total);


$("sellBalance").innerText=
rupiah(user.sell_earning_total);


}





// ===============================
// CEK REKENING
// ===============================


async function checkPaymentAccount(){


const {data}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();



const warning=$("paymentWarning");



if(!data){

if(warning)
warning.style.display="flex";


}else{


if(warning)
warning.style.display="none";


}



}





// ===============================
// STATISTIK WD
// ===============================


async function loadWithdrawStatistic(){


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


let amount=Number(w.amount)||0;


if(w.status==="success")
success+=amount;


if(w.status==="pending")
pending+=amount;


if(w.status==="failed")
failed+=amount;


});



$("successWD").innerText=
rupiah(success);


$("pendingWD").innerText=
rupiah(pending);


$("failedWD").innerText=
rupiah(failed);



}







// ===============================
// EVENT
// ===============================


function bindPaymentEvent(){



const btn=$("manualScrollBtn");


if(btn){

btn.onclick=()=>{


document

.getElementById("manualWithdrawBox")

.scrollIntoView({

behavior:"smooth"

});


};


}



const manual=$("manualWithdrawBtn");


if(manual){

manual.onclick=manualWithdraw;

}



const instant=$("instantWithdrawBtn");


if(instant){

instant.onclick=instantWithdraw;

}





document.querySelectorAll(".instant-options button")

.forEach(btn=>{


btn.onclick=()=>{


document.querySelectorAll(".instant-options button")

.forEach(x=>x.classList.remove("active"));



btn.classList.add("active");


$("instantAmount").value=
btn.dataset.value;



};



});



}






// ===============================
// MANUAL WD
// ===============================


async function manualWithdraw(){


if(!checkWithdrawService()){

alert("Withdraw sedang tutup.");

return;

}



const amount=
Number($("manualAmount").value);



if(amount<100000){

alert("Minimal withdraw Rp100.000");

return;

}




const {data:payment}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();



if(!payment){

alert("Silakan simpan rekening terlebih dahulu.");

return;

}



if(user.balance < amount){

alert("Saldo tidak mencukupi");

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

alert(error.message);

return;

}



await supabase

.from("profiles")

.update({

balance:user.balance-amount

})

.eq("id",user.id);



alert("Request withdraw berhasil dibuat");


location.reload();


}






// ===============================
// INSTANT WD
// ===============================


async function instantWithdraw(){


if(!checkWithdrawService()){

alert("Withdraw sedang tutup.");

return;

}



let amount=
Number($("instantAmount").value);



if(!amount){

alert("Pilih nominal");

return;

}




let total=amount+instantFee;



if(user.balance<total){

alert(
"Saldo kurang\n\n"+
"Withdraw : "+rupiah(amount)+
"\nFee : "+rupiah(instantFee)
);

return;

}



const {error}=await supabase

.from("withdraws")

.insert({

user_id:user.id,

amount:amount,

fee:instantFee,

type:"instant",

status:"success",

method:user.payment_method||"",

account_name:user.fullname||"",

account_number:""

});



if(error){

alert(error.message);

return;

}



await supabase

.from("profiles")

.update({

balance:user.balance-total

})

.eq("id",user.id);



alert("Withdraw instant berhasil");


location.reload();


}






function rupiah(v){

return new Intl.NumberFormat("id-ID",{

style:"currency",

currency:"IDR",

maximumFractionDigits:0

}).format(Number(v)||0);


}
