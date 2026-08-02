/* ===============================
CLICK2PAY HISTORY SALDO
REAL DATABASE SUPABASE FIX
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
return status || "Unknown";

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
"></i>

<h3>
Belum ada transaksi
</h3>

<p>
Transaksi saldo akan muncul otomatis
</p>

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
item.type === "income";


container.innerHTML += `

<div class="link-card">


<div class="link-top">


<h3>

<i class="fa-solid ${
income
? "fa-arrow-down"
: "fa-arrow-up"
}">
</i>

${item.title || item.description || "Transaksi Saldo"}

</h3>



<span class="badge ${item.status || "success"}">

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



/* ================= STATS ================= */

function updateStats(data){

let totalIn = 0;
let totalOut = 0;
let pending = 0;


data.forEach(item=>{


const amount =
Number(item.amount)||0;


if(item.type==="income"){
totalIn += amount;
}


if(item.type==="expense"){
totalOut += amount;
}


if(item.status==="pending"){
pending++;
}


});



$("totalIn") &&
($("totalIn").innerText=formatRupiah(totalIn));


$("totalOut") &&
($("totalOut").innerText=formatRupiah(totalOut));


$("totalTx") &&
($("totalTx").innerText=data.length);


$("totalPending") &&
($("totalPending").innerText=pending);


}



/* ================= LOAD DATABASE ================= */

async function loadHistory(){


try{


if(!window.database){

console.log(
"DATABASE BELUM READY"
);

setTimeout(loadHistory,500);

return;

}



const user =
await window.database.getCurrentProfile();



console.log(
"CURRENT USER:",
user
);



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



console.log(
"TRANSACTION DATA:",
data
);



if(error){

console.log(
"SUPABASE ERROR:",
error
);

throw error;

}



historyData=data || [];


renderHistory(historyData);

updateStats(historyData);



}catch(err){


console.log(
"HISTORY ERROR:",
err
);


container.innerHTML=
`
<p>
Gagal memuat riwayat
</p>
`;


}


}



/* ================= FILTER ================= */


function applyFilter(){


const keyword =
($("searchInput")?.value || "")
.toLowerCase();



const filtered =
historyData.filter(item=>{


const filterOK =
currentFilter==="all"
||
item.type===currentFilter;



const text =
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



/* ================= EVENT ================= */


$("searchInput")
?.addEventListener(
"input",
applyFilter
);



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


currentFilter =
btn.dataset.filter;


applyFilter();


});

});



/* ================= START ================= */

await loadHistory();


});
