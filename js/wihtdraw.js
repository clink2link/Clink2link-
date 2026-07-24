/* =================================
CLICK2PAY WITHDRAW SYSTEM
================================= */


document.addEventListener("DOMContentLoaded",()=>{


let userPremium = false; 
// nanti ambil dari database users.premium


let balance = 0;


// contoh data sementara
let withdrawHistory = [

{
amount:50000,
type:"manual",
status:"pending",
date:"2026-07-23"
},

{
amount:100000,
type:"instant",
status:"success",
date:"2026-07-20"
}

];





/* =========================
FORMAT RUPIAH
========================= */


function rupiah(num){

return "Rp " + Number(num)
.toLocaleString("id-ID");

}





/* =========================
LOAD USER
========================= */


async function loadWithdraw(){


try{


if(window.database){


let user = await database.getUser();


if(user){


balance = user.balance || 0;


// cek premium
userPremium = user.is_premium || false;


}


}


}catch(e){

console.log(e);

}




document.getElementById("balance")
.innerText =
balance.toLocaleString("id-ID");



updateLimit();


renderHistory();


}





/* =========================
LIMIT PREMIUM / FREE
========================= */


function updateLimit(){


let limit =
userPremium
?
500000
:
250000;



let fee =
userPremium
?
0
:
15000;




document.getElementById("instantLimit")
.innerText =
rupiah(limit);



document.getElementById("withdrawFee")
.innerText =
rupiah(fee);


}





/* =========================
HITUNG DITERIMA
========================= */


function calculateReceive(){


let amount =
Number(
document.getElementById("amount").value
)||0;



let type =
document.getElementById("withdrawType")
.value;



let fee = 0;



if(type==="instant" && !userPremium){

fee=15000;

}



let receive =
amount-fee;



if(receive<0)
receive=0;



document.getElementById("receiveAmount")
.innerText =
rupiah(receive);



}



document
.getElementById("amount")
.addEventListener(
"input",
calculateReceive
);



document
.getElementById("withdrawType")
.addEventListener(
"change",
calculateReceive
);







/* =========================
SUBMIT WITHDRAW
========================= */


document
.getElementById("withdrawBtn")
.addEventListener(
"click",
async()=>{



let amount =
Number(
document.getElementById("amount").value
);



let type =
document.getElementById("withdrawType")
.value;



let method =
document.getElementById("method")
.value;



let target =
document.getElementById("target")
.value;




if(amount < 10000){

alert(
"Minimal withdraw Rp10.000"
);

return;

}



if(amount > balance){

alert(
"Saldo tidak mencukupi"
);

return;

}




/*
=========================
CEK LIMIT INSTAN
=========================
*/


if(type==="instant"){


let limit =
userPremium
?
500000
:
250000;



if(amount > limit){

alert(
`Limit withdraw instan maksimal ${rupiah(limit)}`
);


return;


}


}





let fee = 0;


if(
type==="instant"
&&
!userPremium
){

fee=15000;

}




let receive =
amount-fee;






let data={

amount,

type,

method,

target,

fee,

receive,

status:
type==="manual"
?
"pending"
:
"processing",


date:
new Date()
.toISOString()


};





/*

NANTI INSERT SUPABASE:

await supabase
.from("withdrawals")
.insert(data)

*/





withdrawHistory.unshift(data);



balance -= amount;



document.getElementById("balance")
.innerText =
balance.toLocaleString("id-ID");



renderHistory();




alert(

type==="manual"
?
"Withdraw masuk antrean admin"
:
"Withdraw instan sedang diproses"

);



});









/* =========================
RENDER HISTORY
========================= */


function renderHistory(){


let box =
document.getElementById(
"withdrawList"
);



if(!box)return;



box.innerHTML="";



if(withdrawHistory.length===0){


box.innerHTML=`

<div style="
text-align:center;
padding:25px;
color:#64748b">

Belum ada withdraw

</div>

`;

return;

}






withdrawHistory.forEach(item=>{


box.innerHTML += `


<div class="link-card">


<div class="link-top">


<h3>

${item.type==="instant"
?
"⚡ Withdraw Instan"
:
"⌛ Withdraw Manual"}

</h3>


<span class="badge 
${item.status}">

${item.status}

</span>


</div>




<div class="link-mid">


<span>

${item.date}

</span>


<strong>

${rupiah(item.amount)}

</strong>


</div>


</div>


`;



});



}







loadWithdraw();



});
