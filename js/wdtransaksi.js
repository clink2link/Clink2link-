"use strict";

let supabase = null;
let user = null;
let wdChannel = null;

const $ = id => document.getElementById(id);

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  try {

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

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
});


// ===============================
// LOAD WD
// ===============================
async function loadWD(){

  const info = $("wdInfo");
  const list = $("wdList");

  // 🔥 proteksi biar gak crash
  if (!info || !list) {
    console.error("wdInfo / wdList tidak ditemukan");
    return;
  }

  try {

    // loading
    list.innerHTML = "<div class='loading'>Loading...</div>";

    const {data, error} = await supabase
      .from("withdraws")
      .select("id, amount, method, account_number, fee, created_at")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {

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

  } catch (err) {

    console.error("LOAD WD ERROR:", err);

    info.innerHTML = `
      <i class="fa-solid fa-circle-xmark"></i>
      Gagal mengambil transaksi.
    `;

    list.innerHTML = "";
  }
}


// ===============================
// REALTIME
// ===============================
function startRealtime(){

  if (!supabase || !user) return;

  // cleanup channel lama
  if (wdChannel) {
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
      debounce(() => loadWD(), 300)
    )
    .subscribe();
}

// cleanup saat keluar
window.addEventListener("beforeunload", () => {
  if (wdChannel && supabase) {
    supabase.removeChannel(wdChannel);
  }
});


// ===============================
// UTILS
// ===============================

// anti XSS
function escapeHTML(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

// debounce
function debounce(fn, delay){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), delay);
  };
}

// format rupiah
function rupiah(value){
  const num = Number(value);
  if (isNaN(num)) return "Rp0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
}

// mask rekening
function mask(value){
  if (!value) return "-";

  const str = String(value);

  if (str.length <= 6) return str;

  return str.slice(0,3) + "****" + str.slice(-3);
}

// format tanggal
function formatDate(date){
  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
