/* ===============================
CLICK2PAY HISTORY SALDO
REAL DATABASE SUPABASE
================================ */

document.addEventListener("DOMContentLoaded", async()=>{


let historyData = [];
let currentFilter = "all";

const $ = id => document.getElementById(id);


/* ================= FORMAT ================= */

function formatRupiah(num){

    return new Intl.NumberFormat("id-ID",{
        style:"currency",
        currency:"IDR",
        maximumFractionDigits:0
    }).format(Number(num)||0);

}


function formatDate(date){

    return new Date(date).toLocaleString("id-ID",{
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
    });

}


/* ================= ELEMENT ================= */

const container = $("historyList");


/* ================= SKELETON ================= */

function showSkeleton(){

if(!container) return;

container.innerHTML="";

for(let i=0;i<4;i++){

container.innerHTML+=`

<div class="link-card">

<div style="
height:14px;
width:60%;
background:#e2e8f0;
border-radius:8px;
margin-bottom:12px;">
</div>

<div style="
height:12px;
width:40%;
background:#e2e8f0;
border-radius:8px;">
</div>

</div>

`;

}

}



/* ================= EMPTY ================= */

function emptyState(){

container.innerHTML=`

<div style="
text-align:center;
padding:40px 20px;
">

<i class="fa-regular fa-folder-open"
style="
font-size:40px;
color:#94a3b8;
">
</i>

<h3>
Belum ada transaksi
</h3>

<p style="
color:#64748b;
font-size:13px;
">
Transaksi saldo akan muncul otomatis
</p>

</div>

`;

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
return status;

}

}



/* ================= RENDER ================= */


function renderHistory(data){

container.innerHTML="";


if(data.length===0){

emptyState();
return;

}



data.forEach((item,index)=>{


let income = item.type==="income";


container.innerHTML+=`

<div class="link-card">

<div class="link-top">

<h3>
<i class="fa-solid ${
income 
? "fa-arrow-down"
: "fa-arrow-up"
}">
</i>

${item.title}

</h3>


<span class="badge ${item.status}">

${statusText(item.status)}

</span>


</div>


<div class="link-mid">


<span>
${formatDate(item.created_at)}
</span>


<strong style="
color:${income ? "#16a34a":"#dc2626"}
">

${income ? "+" : "-"}
${formatRupiah(item.amount)}

</strong>


</div>


</div>

`;


});


}



/* ================= UPDATE STATS ================= */


function updateStats(data){


let totalIn = 0;
let totalOut = 0;
let pending = 0;


data.forEach(item=>{


let amount = Number(item.amount)||0;


if(item.type==="income")
totalIn += amount;


if(item.type==="expense")
totalOut += amount;


if(item.status==="pending")
pending++;


});



if($("totalIn"))
$("totalIn").innerText =
formatRupiah(totalIn);



if($("totalOut"))
$("totalOut").innerText =
formatRupiah(totalOut);



if($("totalTx"))
$("totalTx").innerText =
data.length;



if($("totalPending"))
$("totalPending").innerText =
pending;



}



/* ================= LOAD DATABASE ================= */


async function loadHistory(){


try{


showSkeleton();



if(!window.database){

console.log(
"DATABASE BELUM READY"
);

return;

}



const user =
await window.database.getCurrentProfile();



if(!user?.id){

location.href="login.html";

return;

}




const {
data,
error
}=await window.database.supabase

.from("transactions")

.select("*")

.eq(
"user_id",
user.id
)

.order(
"created_at",
{
ascending:false
}
);



if(error)
throw error;



historyData = data || [];



renderHistory(historyData);

updateStats(historyData);



}catch(err){

console.log(
"HISTORY ERROR",
err
);

container.innerHTML=
"<p>Gagal memuat transaksi</p>";

}


}



/* ================= FILTER ================= */


function applyFilter(){


let keyword =
$("searchInput")
.value
.toLowerCase();



let filtered =
historyData.filter(item=>{


let filterOK =
currentFilter==="all"
||
item.type===currentFilter;


let searchOK =
item.title
.toLowerCase()
.includes(keyword);



return filterOK && searchOK;


});



renderHistory(filtered);

updateStats(filtered);


}



/* ================= EVENT ================= */


$("searchInput")
?.addEventListener(
"input",
applyFilter
);



document
.querySelectorAll(
".link-filter button"
)
.forEach(btn=>{


btn.addEventListener(
"click",
()=>{


document
.querySelectorAll(
".link-filter button"
)
.forEach(b=>
b.classList.remove("active")
);



btn.classList.add("active");



currentFilter =
btn.dataset.filter;



applyFilter();


});

});



/* ================= START ================= */


await loadHistory();


});
