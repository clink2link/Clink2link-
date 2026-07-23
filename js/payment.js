console.log("PAYMENT JS AKTIF");

"use strict";

let db = null;
let user = null;

let withdrawOpen = false;
let instantSelected = 0;

const $ = id => document.getElementById(id);

// =========================
// GLOBAL ERROR DEBUG (WAJIB)
// =========================
window.onerror = function(message, source, lineno, colno) {
  console.log("[GLOBAL ERROR]", { message, source, lineno, colno });
};

// =========================
// WAIT DATABASE (PINDAH KE LUAR)
// =========================
async function waitDatabase() {
  let retry = 0;

  while (!window.database && retry < 20) {
    console.log("MENUNGGU DATABASE...");
    await new Promise(r => setTimeout(r, 100));
    retry++;
  }

  if (!window.database) {
    alert("Database gagal load");
    return false;
  }

  return true;
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  console.log("PAYMENT INIT START");

  const dbReady = await waitDatabase();
  if (!dbReady) return;

  // ambil supabase dari database.js
  db = window.database.supabase;

  // ambil user
  user = await window.database.getCurrentProfile();

  console.log("USER:", user);

  // validasi user (cukup sekali)
  if (!user || !user.id) {
    alert("User tidak valid / belum login");
    location.replace("login.html");
    return;
  }

  // jalankan semua
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

  // 🔥 SAFE CHECK (biar gak null error)
  if (!box) {
    console.log("[ERROR] withdrawService element tidak ditemukan");
    return;
  }

  const now = new Date();
  const day = now.getDay();   // 0 = Minggu
  const hour = now.getHours();

  const isOpen =
    day >= 1 &&
    day <= 5 &&
    hour >= 8 &&
    hour < 18;

  withdrawOpen = isOpen;

  if (isOpen){

    box.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      Withdraw buka
      <br>
      Senin - Jumat<br>
      08:00 - 18:00 WIB
    `;

    box.style.color = "#16a34a";

    if (btn){
      btn.disabled = false;
      btn.style.opacity = "1";
    }

  } else {

    box.innerHTML = `
      <i class="fa-solid fa-circle-xmark"></i>
      Withdraw sedang tutup
      <br>
      Buka Senin - Jumat<br>
      08:00 - 18:00 WIB
    `;

    box.style.color = "#dc2626";

    if (btn){
      btn.disabled = true;
      btn.style.opacity = "0.5";
    }

  }

  // 🔥 DEBUG TAMBAHAN
  console.log("[WITHDRAW STATUS]", {
    day,
    hour,
    withdrawOpen
  });

}


// =========================
// LOAD SALDO
// =========================


async function loadBalance(){

  // 🔥 SAFE CHECK USER
  if (!user) {
    console.log("[ERROR] user belum ada");
    return;
  }

  // ambil element
  const balanceEl = $("balance");
  const adsEl = $("adsBalance");
  const sellEl = $("sellBalance");

  // 🔥 DEBUG ELEMENT
  console.log("[LOAD BALANCE ELEMENT]", {
    balanceEl,
    adsEl,
    sellEl
  });

  // 🔥 SET VALUE (PAKAI DEFAULT 0)
  if (balanceEl){
    balanceEl.innerText = rupiah(user.balance || 0);
  }

  if (adsEl){
    adsEl.innerText = rupiah(user.ads_earning_total || 0);
  }

  if (sellEl){
    sellEl.innerText = rupiah(user.sell_earning_total || 0);
  }

}

// =========================
// CEK REKENING
// =========================

async function checkPayment(){

  const warning = $("paymentWarning");

  // 🔥 SAFE CHECK
  if (!warning){
    console.log("[ERROR] paymentWarning element tidak ditemukan");
    return;
  }

  if (!user || !user.id){
    console.log("[ERROR] user tidak valid");
    return;
  }

  console.log("[CHECK PAYMENT] user_id:", user.id);

  const { data, error } = await db
    .from("payment_methods")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error){
    console.log("[CHECK PAYMENT ERROR]", error);
    return;
  }

  console.log("[CHECK PAYMENT RESULT]", data);

  if (!data){
    warning.style.display = "flex";
  } else {
    warning.style.display = "none";
  }

}

// =========================
// STATISTIK WD
// =========================


async function loadWithdrawStats(){

  // 🔥 VALIDASI USER
  if (!user || !user.id){
    console.log("[ERROR] user tidak valid");
    return;
  }

  console.log("[LOAD WD STATS] user_id:", user.id);

  const { data, error } = await db
    .from("withdraws")
    .select("amount, status")
    .eq("user_id", user.id);

  if (error){
    console.log("[WD STATS ERROR]", error);
    return;
  }

  console.log("[WD DATA]", data);

  let success = 0;
  let pending = 0;
  let failed = 0;

  (data || []).forEach(w => {

    const amount = Number(w.amount) || 0;

    if (w.status === "success"){
      success += amount;
    }

    if (w.status === "pending"){
      pending += amount;
    }

    if (w.status === "failed"){
      failed += amount;
    }

  });

  // 🔥 AMBIL ELEMENT (SAFE)
  const successEl = $("successWD");
  const pendingEl = $("pendingWD");
  const failedEl = $("failedWD");

  // 🔥 SET NILAI (ANTI NULL ERROR)
  if (successEl){
    successEl.innerText = rupiah(success);
  }

  if (pendingEl){
    pendingEl.innerText = rupiah(pending);
  }

  if (failedEl){
    failedEl.innerText = rupiah(failed);
  }

}


// =========================
// EVENT
// =========================

function bindEvent(){

  console.log("[BIND EVENT] start");

  const scrollBtn = $("manualScrollBtn");

  if (scrollBtn){

    scrollBtn.onclick = () => {

      console.log("[CLICK] manualScrollBtn");

      if (!withdrawOpen){
        alert(
          "Withdraw sedang tutup.\n\nJam:\nSenin - Jumat\n08:00 - 18:00 WIB"
        );
        return;
      }

      const target = $("manualWithdrawBox");

      if (!target){
        console.log("[ERROR] manualWithdrawBox tidak ditemukan");
        return;
      }

      target.scrollIntoView({
        behavior: "smooth"
      });

    };

  }

  const manualBtn = $("manualWithdrawBtn");

  if (manualBtn){

    manualBtn.onclick = () => {
      console.log("[CLICK] manualWithdrawBtn");
      manualWithdraw();
    };

  }

  // 🔥 cache element biar gak query ulang
  const instantButtons = document.querySelectorAll(".instant-options button");

  instantButtons.forEach(btn => {

    btn.onclick = () => {

      console.log("[CLICK] instant option", btn.dataset.value);

      instantButtons.forEach(x => x.classList.remove("active"));

      btn.classList.add("active");

      instantSelected = Number(btn.dataset.value) || 0;

      const input = $("instantAmount");

      if (input){
        input.value = instantSelected;
      }

    };

  });

  const instantBtn = $("instantWithdrawBtn");

  if (instantBtn){

    instantBtn.onclick = () => {
      console.log("[CLICK] instantWithdrawBtn");
      instantWithdraw();
    };

  }

}
// =========================
// WD MANUAL
// =========================

async function manualWithdraw(){

  console.log("[MANUAL WD] start");

  if (!withdrawOpen){
    alert("Withdraw sedang tutup");
    return;
  }

  const input = $("manualAmount");

  if (!input){
    console.log("[ERROR] manualAmount tidak ditemukan");
    return;
  }

  const amount = Number(input.value);

  if (!amount){
    alert("Masukkan nominal withdraw");
    return;
  }

  if (amount < 100000){
    alert("Minimal withdraw Rp100.000");
    return;
  }

  console.log("[MANUAL WD] amount:", amount);

  // 🔥 ambil rekening
  const { data: payment, error: payError } = await db
    .from("payment_methods")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (payError){
    console.log("[PAYMENT ERROR]", payError);
    alert("Gagal mengambil data rekening");
    return;
  }

  if (!payment){
    alert("Silakan simpan rekening terlebih dahulu");
    location.href = "paymentsetting.html";
    return;
  }

  console.log("[PAYMENT DATA]", payment);

  // 🔥 ambil profile terbaru
  const profile = await window.database.getCurrentProfile();

  if (!profile){
    alert("Gagal mengambil data user");
    return;
  }

  if (Number(profile.balance) < amount){
    alert("Saldo tidak cukup");
    return;
  }

  console.log("[BALANCE BEFORE]", profile.balance);

  // =========================
  // INSERT WITHDRAW
  // =========================
  const { error: wdError } = await db
    .from("withdraws")
    .insert({
      user_id: user.id,
      method: payment.method,
      account_number: payment.account_number,
      amount: amount,
      status: "pending",
      type: "manual",
      fee: 0
    });

  if (wdError){
    console.log("[WD INSERT ERROR]", wdError);
    alert(wdError.message);
    return;
  }

  // =========================
  // UPDATE BALANCE
  // =========================
  const newBalance = Number(profile.balance) - amount;

  const { error: updError } = await db
    .from("profiles")
    .update({
      balance: newBalance
    })
    .eq("id", user.id);

  if (updError){
    console.log("[BALANCE UPDATE ERROR]", updError);
    alert("Withdraw masuk tapi saldo gagal update");
    return;
  }

  console.log("[BALANCE AFTER]", newBalance);

  alert("Withdraw manual berhasil dibuat");

  location.reload();

}

// =========================
// WD INSTANT
// =========================

async function instantWithdraw(){

  console.log("[INSTANT WD] start");

  if (!withdrawOpen){
    alert("Withdraw sedang tutup");
    return;
  }

  if (!instantSelected){
    alert("Pilih nominal");
    return;
  }

  const profile = await window.database.getCurrentProfile();

  if (!profile){
    alert("Gagal mengambil data user");
    return;
  }

  const fee = 15000;
  const total = instantSelected + fee;

  console.log("[INSTANT WD] amount:", instantSelected);
  console.log("[INSTANT WD] total:", total);

  if (Number(profile.balance) < total){
    alert(
      "Saldo tidak cukup\n\n" +
      "Withdraw : " + rupiah(instantSelected) +
      "\nFee : " + rupiah(fee)
    );
    return;
  }

  // =========================
  // CEK PAYMENT METHOD
  // =========================
  const { data: payment, error: payError } = await db
    .from("payment_methods")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (payError){
    console.log("[PAYMENT ERROR]", payError);
    alert("Gagal mengambil rekening");
    return;
  }

  if (!payment){
    alert("Simpan rekening terlebih dahulu");
    location.href = "paymentsetting.html";
    return;
  }

  console.log("[PAYMENT DATA]", payment);

  // =========================
  // LIMIT HARIAN (FIX 🔥)
  // =========================
  const today = new Date().toISOString().split("T")[0];

  const { data: list, error: listError } = await db
    .from("withdraws")
    .select("amount, created_at")
    .eq("user_id", user.id)
    .eq("type", "instant")
    .gte("created_at", today); // 🔥 hanya hari ini

  if (listError){
    console.log("[LIMIT ERROR]", listError);
    alert("Gagal cek limit harian");
    return;
  }

  let used = 0;

  (list || []).forEach(x => {
    used += Number(x.amount) || 0;
  });

  console.log("[LIMIT USED TODAY]", used);

  if (used + instantSelected > 500000){
    alert("Limit instant hari ini habis");
    return;
  }

  // =========================
  // INSERT WITHDRAW
  // =========================
  const { error: wdError } = await db
    .from("withdraws")
    .insert({
      user_id: user.id,
      method: payment.method,
      account_number: payment.account_number,
      amount: instantSelected,
      status: "success",
      type: "instant",
      fee: fee
    });

  if (wdError){
    console.log("[WD ERROR]", wdError);
    alert(wdError.message);
    return;
  }

  // =========================
  // UPDATE BALANCE
  // =========================
  const newBalance = Number(profile.balance) - total;

  const { error: updError } = await db
    .from("profiles")
    .update({
      balance: newBalance
    })
    .eq("id", user.id);

  if (updError){
    console.log("[BALANCE ERROR]", updError);
    alert("Withdraw berhasil tapi saldo gagal update");
    return;
  }

  console.log("[BALANCE AFTER]", newBalance);

  alert("Withdraw instant berhasil");

  location.reload();

}

// =========================
// FORMAT
// =========================

function rupiah(value){

  const number = Number(value);

  // 🔥 HANDLE NaN / null / undefined
  if (isNaN(number)){
    return "Rp0";
  }

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);

  } catch (err){
    console.log("[RUPIAH ERROR]", err);

    // 🔥 fallback manual (kalau Intl gagal di device lama)
    return "Rp" + number.toLocaleString("id-ID");
  }

}
