/* ===============================
CLICK2PAY HISTORY SALDO
REAL DATABASE SUPABASE
FINAL FIX
================================ */

document.addEventListener("DOMContentLoaded",()=>{

let historyData=[];
let currentFilter="all";

const $=id=>document.getElementById(id);

const container=$("historyList");


/* ================= FORMAT ================= */

function formatRupiah(num){

return new Intl.NumberFormat("id-ID",{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}).format(Number(num)||0);

}


function formatDate(date){

if(!date) return "-";

return new Date(date).toLocaleString("id-ID",{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
});

}


/* ================= STATUS ================= */

function statusText(status){

switch(status){

case "success":
return "Berhasil";

case "pending":
return "Diproses";

case "failed":
return "Gagal";

default:
return "Berhasil";

}

}



/* ================= LOADING ================= */

function showLoading(){

const loading=$("historyLoading");

if(loading){
loading.style.display="block";
}

}


function hideLoading(){

const loading=$("historyLoading");

if(loading){
loading.style.display="none";
}

}



/* ================= EMPTY ================= */

function emptyState(){

container.innerHTML=`

<div class="empty-box">

<i class="fa-solid fa-wallet"></i>

<h3>Belum ada transaksi</h3>

<p>Riwayat saldo akan muncul di sini.</p>

</div>

`;

}



/* ================= RENDER ================= */

function renderHistory(data){

container.innerHTML="";


if(!data.length){

emptyState();

return;

}



data.forEach(item=>{


const income =
item.type==="income";


const title =
item.title ||
item.description ||
"Transaksi Saldo";


const status =
item.status ||
"success";



container.innerHTML+=`

<div class="link-card">

<div class="link-top">

<h3>

<i class="fa-solid ${
income
?"fa-arrow-trend-up"
:"fa-arrow-trend-down"
}">
</i>

${title}

</h3>


<span class="badge ${status}">

${statusText(status)}

</span>


</div>


<div class="link-mid">

<span>
${formatDate(item.created_at)}
</span>


<strong style="
color:${income?"#16a34a":"#dc2626"}
">

${income?"+":"-"}
${formatRupiah(item.amount)}

</strong>


</div>


</div>

`;

});


}



/* ================= STATS ================= */

function updateStats(data){

let totalIn=0;
let totalOut=0;
let pending=0;


data.forEach(item=>{


const amount=
Number(item.amount)||0;



if(item.type==="income"){

totalIn+=amount;

}


if(item.type==="expense"){

totalOut+=amount;

}


if(item.status==="pending"){

pending++;

}


});



if($("totalIn"))
$("totalIn").innerText=formatRupiah(totalIn);


if($("totalOut"))
$("totalOut").innerText=formatRupiah(totalOut);


if($("totalTx"))
$("totalTx").innerText=data.length;


if($("totalPending"))
$("totalPending").innerText=pending;


}



/* ================= LOAD DATABASE ================= */

async function loadHistory(){

try{


showLoading();


if(!window.database){

console.log(
"DATABASE BELUM READY"
);

setTimeout(loadHistory,500);

return;

}



const userId=
localStorage.getItem("user_id");



if(!userId){

location.href="login.html";

return;

}




const {
data,
error
}=await window.database.supabase

.from("transactions")

.select(`
id,
user_id,
title,
description,
type,
amount,
status,
created_at
`)

.eq(
"user_id",
userId
)

.order(
"created_at",
{
ascending:false
}
);



if(error)
throw error;



console.log(
"HISTORY DATA:",
data
);



historyData=data||[];


renderHistory(historyData);

updateStats(historyData);


hideLoading();



}catch(err){


console.error(
"HISTORY ERROR:",
err
);


hideLoading();



container.innerHTML=`

<div class="empty-box">

<h3>
Gagal memuat riwayat
</h3>

<p>
${err.message}
</p>

</div>

`;

}


}



/* ================= FILTER ================= */

function applyFilter(){


const keyword=
($("searchInput")?.value||"")
.toLowerCase();



const filtered =
historyData.filter(item=>{


let filterOK=true;



if(currentFilter==="income"){

filterOK=
item.type==="income";

}


else if(currentFilter==="expense"){

filterOK=
item.type==="expense";

}


else if(currentFilter==="pending"){

filterOK=
item.status==="pending";

}



const text=
(
item.title ||
item.description ||
""
)
.toLowerCase();



return filterOK &&
text.includes(keyword);


});



renderHistory(filtered);

updateStats(filtered);


}



/* ================= SEARCH ================= */

$("searchInput")
?.addEventListener(
"input",
applyFilter
);



/* ================= FILTER BUTTON ================= */

document
.querySelectorAll(".link-filter button")
.forEach(btn=>{


btn.addEventListener(
"click",
()=>{


document
.querySelectorAll(".link-filter button")
.forEach(b=>
b.classList.remove("active")
);



btn.classList.add("active");


currentFilter=
btn.dataset.filter;


applyFilter();


});


});



/* ================= REFRESH ================= */

$("refreshHistory")
?.addEventListener(
"click",
()=>{

loadHistory();

});



/* ================= START ================= */

loadHistory();


});
