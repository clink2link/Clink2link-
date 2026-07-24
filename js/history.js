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

/* ================= RENDER ================= */

const container = document.getElementById("historyList");

const renderHistory = (data) => {

container.innerHTML = "";

if(data.length === 0){
container.innerHTML = `
<div style="text-align:center;padding:30px;color:#64748b;">
<i class="fa-solid fa-inbox" style="font-size:30px;margin-bottom:10px;"></i>
<p>Tidak ada transaksi</p>
</div>
`;
return;
}

data.forEach(item => {

container.innerHTML += `
<div class="link-card">
<div class="link-top">
<h3>${item.title}</h3>
<span class="badge ${item.status === "success" ? "success" : "pending"}">
${item.status}
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

// FILTER BUTTON
document.querySelectorAll(".filterBtn").forEach(btn => {

btn.addEventListener("click", () => {

document.querySelectorAll(".filterBtn").forEach(b => b.classList.remove("active"));

btn.classList.add("active");

currentFilter = btn.dataset.filter;

applyFilter();

});

});

/* ================= INIT ================= */

renderHistory(historyData);
updateStats(historyData);

});
