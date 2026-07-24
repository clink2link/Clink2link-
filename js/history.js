/* ===============================
CLICK2PAY HISTORY SCRIPT
================================ */

document.addEventListener("DOMContentLoaded", () => {

let historyData = [
{
id: "TRX001",
title: "Pembayaran QRIS",
amount: 25000,
status: "success",
date: "2026-07-24T08:00:00"
},
{
id: "TRX002",
title: "Top Up Saldo",
amount: 50000,
status: "success",
date: "2026-07-23T21:30:00"
},
{
id: "TRX003",
title: "Transfer User",
amount: 15000,
status: "pending",
date: "2026-07-23T20:10:00"
},
{
id: "TRX004",
title: "Pembayaran QRIS",
amount: 8000,
status: "success",
date: "2026-07-22T19:00:00"
}
];

/* ================= FORMAT ================= */

const formatRupiah = (num) => {
return "Rp " + num.toLocaleString("id-ID");
};

const formatDate = (date) => {
let d = new Date(date);
return d.toLocaleString("id-ID", {
day: "2-digit",
month: "short",
hour: "2-digit",
minute: "2-digit"
});
};

/* ================= ELEMENT ================= */

const container = document.getElementById("historyList");

/* ================= UI ENHANCEMENT ================= */

// SKELETON
const showSkeleton = () => {
container.innerHTML = "";
for(let i=0;i<4;i++){
container.innerHTML += `
<div class="link-card" style="opacity:.6">
<div style="height:14px;width:60%;background:#e2e8f0;border-radius:6px;margin-bottom:10px;"></div>
<div style="height:12px;width:40%;background:#e2e8f0;border-radius:6px;"></div>
</div>
`;
}
};

// EMPTY STATE
const emptyState = () => {
container.innerHTML = `
<div style="text-align:center;padding:40px 20px;">
<i class="fa-regular fa-folder-open" style="font-size:40px;color:#94a3b8;margin-bottom:10px;"></i>
<h3 style="margin:0;color:#334155;">Belum ada transaksi</h3>
<p style="font-size:13px;color:#64748b;">Transaksi kamu akan muncul di sini</p>
</div>
`;
};

// STATUS TEXT
const getStatusText = (status) => {
if(status === "success") return "Berhasil";
if(status === "pending") return "Diproses";
return status;
};

/* ================= RENDER ================= */

const renderHistory = (data) => {

container.innerHTML = "";

if(data.length === 0){
emptyState();
return;
}

data.forEach((item,index) => {

let isNew = index === 0;

container.innerHTML += `
<div class="link-card" style="animation:fadeIn .4s ease ${index * 0.05}s both; ${isNew ? 'border:2px solid #2563eb;' : ''}">
<div class="link-top">
<h3>${item.title}</h3>
<span class="badge ${item.status === "success" ? "success" : "pending"}">
${getStatusText(item.status)}
</span>
</div>

<div class="link-mid">
<span>${formatDate(item.date)}</span>
<strong>${formatRupiah(item.amount)}</strong>
</div>
</div>
`;

});

};

/* ================= STATS ================= */

const updateStats = (data) => {

let total = data.reduce((a,b)=>a+b.amount,0);
let success = data.filter(x=>x.status==="success").length;
let pending = data.filter(x=>x.status==="pending").length;

document.getElementById("totalAmount").innerText = formatRupiah(total);
document.getElementById("totalSuccess").innerText = success;
document.getElementById("totalPending").innerText = pending;
document.getElementById("totalTrx").innerText = data.length;

};

/* ================= FILTER ================= */

let currentFilter = "all";

const applyFilter = () => {

let searchValue = document.getElementById("searchInput").value.toLowerCase();

let filtered = historyData.filter(item => {

let matchFilter = currentFilter === "all" || item.status === currentFilter;
let matchSearch = item.title.toLowerCase().includes(searchValue);

return matchFilter && matchSearch;

});

renderHistory(filtered);
updateStats(filtered);

};

/* ================= EVENT ================= */

// SEARCH
document.getElementById("searchInput").addEventListener("input", applyFilter);

// FILTER
document.querySelectorAll(".filterBtn").forEach(btn => {

btn.addEventListener("click", () => {

document.querySelectorAll(".filterBtn").forEach(b => b.classList.remove("active"));

btn.classList.add("active");

currentFilter = btn.dataset.filter;

applyFilter();

});

});

/* ================= INIT ================= */

showSkeleton();

setTimeout(() => {
renderHistory(historyData);
updateStats(historyData);
}, 800);

});
