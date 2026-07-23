"use strict";

let supabase = null;
let user = null;
let wdChannel = null;

const $ = id => document.getElementById(id);

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  if (!window.database) {
    console.error("Database tidak tersedia");
    return;
  }

  supabase = database.supabase;

  user = await database.getCurrentProfile();

  if (!user) {
    location.href = "login.html";
    return;
  }

  await loadWD();
  startRealtime();
});


// ===============================
// LOAD WD
// ===============================
async function loadWD(){

  const info = $("wdInfo");
  const list = $("wdList");

  // 🔥 loading state
  list.innerHTML = "<div class='loading'>Loading...</div>";

  const {data, error} = await supabase
    .from("withdraws")
    .select("id, amount, method, account_number, fee, created_at")
    .eq("user_id", user.id)
    .eq("status", "success")
    .order("created_at", {ascending:false});

  if(error){
    console.log(error);

    info.innerHTML = `
      <i class="fa-solid fa-circle-xmark"></i>
      Gagal mengambil transaksi.
    `;

    list.innerHTML = "";
    return;
  }

  if(!data || data.length === 0){

    info.innerHTML = `
      <i class="fa-solid fa-info-circle"></i>
      Belum ada transaksi withdraw berhasil.
    `;

    list.innerHTML = "";
    return;
  }

  info.innerHTML = `
    <i class="fa-solid fa-circle-check"></i>
    Total ${data.length} transaksi berhasil.
  `;

  // 🔥 render aman (no innerHTML +=)
  const fragment = document.createDocumentFragment();

  data.forEach(item => {

    const card = document.createElement("div");
    card.className = "wd-card";

    card.innerHTML = `
      <div class="wd-header">
        <div class="wd-icon">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div>
          <h3>Withdraw Success</h3>
          <span>${formatDate(item.created_at)}</span>
        </div>
      </div>

      <div class="wd-amount">
        ${rupiah(item.amount)}
      </div>

      <div class="wd-detail">
        <div>
          <span>Metode</span>
          <b>${escapeHTML(item.method || "-")}</b>
        </div>

        <div>
          <span>Nomor</span>
          <b>${mask(item.account_number)}</b>
        </div>

        <div>
          <span>Biaya</span>
          <b>${rupiah(item.fee || 0)}</b>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  list.innerHTML = "";
  list.appendChild(fragment);
}


// ===============================
// REALTIME (FIX MEMORY LEAK)
// ===============================
function startRealtime(){

  if(wdChannel){
    supabase.removeChannel(wdChannel);
  }

  wdChannel = supabase
    .channel("wd-history-" + user.id)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "withdraws",
        filter: `user_id=eq.${user.id}`
      },
      debounce(loadWD, 300) // 🔥 anti spam reload
    )
    .subscribe();
}

// cleanup
window.addEventListener("beforeunload", () => {
  if(wdChannel){
    supabase.removeChannel(wdChannel);
  }
});


// ===============================
// UTILS
// ===============================

// 🔥 anti XSS
function escapeHTML(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}


// 🔥 debounce
function debounce(fn, delay){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), delay);
  };
}


// 🔥 rupiah aman
function rupiah(value){
  const num = Number(value);
  if(isNaN(num)) return "Rp0";

  return new Intl.NumberFormat("id-ID",{
    style:"currency",
    currency:"IDR",
    maximumFractionDigits:0
  }).format(num);
}


// 🔥 mask aman
function mask(value){
  if(!value) return "-";

  const str = String(value);

  if(str.length <= 6) return str;

  return str.slice(0,3) + "****" + str.slice(-3);
}


// 🔥 format tanggal aman
function formatDate(date){

  const d = new Date(date);

  if(isNaN(d.getTime())) return "-";

  return d.toLocaleString("id-ID",{
    day:"2-digit",
    month:"long",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });
}
