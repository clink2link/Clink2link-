// ========================================
// PAYMENT JS
// PART 1 - INIT & SERVICE STATUS
// ========================================

console.log("PAYMENT JS AKTIF");

"use strict";

let db = null;
let user = null;
let manualWithdrawOpen = false;
const instantWithdrawOpen = true;
let instantSelected = 0;

const $ = id => document.getElementById(id);

// ========================================
// GLOBAL ERROR DEBUG
// ========================================
window.onerror = (message, source, lineno, colno) => {
  console.log("[GLOBAL ERROR]", { message, source, lineno, colno });
};

// ========================================
// WAIT DATABASE READY
// ========================================
async function waitDatabase() {
  for (let retry = 0; retry < 20; retry++) {
    if (window.database) return true;

    console.log("MENUNGGU DATABASE...");
    await new Promise(r => setTimeout(r, 100));
  }

  alert("Database gagal load");
  return false;
}

// ========================================
// INIT APP
// ========================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("PAYMENT INIT START");

  const dbReady = await waitDatabase();
  if (!dbReady) return;

  db = window.database.supabase;
  user = await window.database.getCurrentProfile();

  console.log("USER:", user);

  if (!user?.id) {
    alert("User tidak valid / belum login");
    location.replace("login.html");
    return;
  }

  checkWithdrawService();
  await loadBalance();
  await checkPayment();
  await loadWithdrawStats();
  bindEvent();
});

// ========================================
// CHECK WITHDRAW SERVICE
// ========================================
function checkWithdrawService() {
  const box = $("withdrawService");
  const btn = $("manualScrollBtn");

  if (!box) {
    console.log("[ERROR] withdrawService element tidak ditemukan");
    return;
  }

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  manualWithdrawOpen =
    day >= 1 &&
    day <= 5 &&
    hour >= 8 &&
    hour < 18;

  if (manualWithdrawOpen) {
    box.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      Withdraw buka<br>
      Senin - Jumat<br>
      08:00 - 18:00 WIB
    `;

    box.style.color = "#16a34a";

    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  } else {
    box.innerHTML = `
      <i class="fa-solid fa-circle-xmark"></i>
      Withdraw sedang tutup<br>
      Buka Senin - Jumat<br>
      08:00 - 18:00 WIB
    `;

    box.style.color = "#dc2626";

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.5";
    }
  }

  console.log("[WITHDRAW STATUS]", {
    day,
    hour,
    manualWithdrawOpen,
    instantWithdrawOpen
  });
}

// ========================================
// FORMAT RUPIAH
// ========================================
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function rupiah(value) {
  const number = Number(value) || 0;

  try {
    return rupiahFormatter.format(number);
  } catch (err) {
    console.log("[RUPIAH ERROR]", err);
    return "Rp" + number.toLocaleString("id-ID");
  }
}

// ========================================
// HELPER UPDATE BALANCE UI
// ========================================
function updateBalanceUI(balance, ads, sell) {
  const balanceEl = $("balance");
  const adsEl = $("adsBalance");
  const sellEl = $("sellBalance");

  if (balanceEl) balanceEl.innerText = rupiah(balance);
  if (adsEl) adsEl.innerText = rupiah(ads);
  if (sellEl) sellEl.innerText = rupiah(sell);
}

// ========================================
// PAYMENT JS
// PART 2 - LOAD DATA
// ========================================

// ========================================
// LOAD BALANCE
// ========================================
async function loadBalance() {

  if (!user?.id) {
    console.log("[ERROR] User tidak valid");
    return;
  }

  try {

    const profile = await window.database.getCurrentProfile();

    if (!profile) {
      console.log("[ERROR] Profile gagal diambil");
      return;
    }

    user = profile;

    updateBalanceUI(
      profile.balance || 0,
      profile.total_ads || 0,
      profile.total_sell || 0
    );

  } catch (err) {
    console.log("[LOAD BALANCE ERROR]", err);
  }

}

// ========================================
// CHECK PAYMENT METHOD
// ========================================
async function checkPayment() {

  const warning = $("paymentWarning");

  if (!warning) return;

  try {

    const { data, error } = await db
      .from("payment_methods")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    warning.style.display = data ? "none" : "flex";

  } catch (err) {

    console.log("[CHECK PAYMENT ERROR]", err);

  }

}

// ========================================
// LOAD WITHDRAW STATS
// ========================================
async function loadWithdrawStats() {

  try {

    const { data, error } = await db
      .from("withdraws")
      .select("amount,status")
      .eq("user_id", user.id);

    if (error) throw error;

    let success = 0;
    let pending = 0;
    let failed = 0;

    (data || []).forEach(item => {

      const amount = Number(item.amount) || 0;

      switch (item.status) {

        case "success":
          success += amount;
          break;

        case "pending":
          pending += amount;
          break;

        case "failed":
          failed += amount;
          break;

      }

    });

    if ($("successWD"))
      $("successWD").innerText = rupiah(success);

    if ($("pendingWD"))
      $("pendingWD").innerText = rupiah(pending);

    if ($("failedWD"))
      $("failedWD").innerText = rupiah(failed);

  } catch (err) {

    console.log("[LOAD WD ERROR]", err);

  }

}
// ========================================
// PAYMENT JS
// PART 3 - EVENTS
// ========================================

function bindEvent() {

  console.log("[BIND EVENT]");

  const manualScrollBtn = $("manualScrollBtn");
  const manualWithdrawBtn = $("manualWithdrawBtn");
  const instantWithdrawBtn = $("instantWithdrawBtn");
  const instantAmount = $("instantAmount");
  const instantButtons = document.querySelectorAll(".instant-options button");

  // =====================================
  // SCROLL KE MANUAL WITHDRAW
  // =====================================

  manualScrollBtn?.addEventListener("click", () => {

    if (!manualWithdrawOpen) {
      alert(
        "Withdraw sedang tutup.\n\n" +
        "Jam Operasional:\n" +
        "Senin - Jumat\n" +
        "08:00 - 18:00 WIB"
      );
      return;
    }

    $("manualWithdrawBox")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  });

  // =====================================
  // MANUAL WITHDRAW
  // =====================================

  manualWithdrawBtn?.addEventListener("click", manualWithdraw);

  // =====================================
  // PILIH NOMINAL INSTANT
  // =====================================

  instantButtons.forEach(button => {

    button.addEventListener("click", () => {

      instantButtons.forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      instantSelected = Number(button.dataset.value) || 0;

      if (instantAmount) {
        instantAmount.value = instantSelected;
      }

    });

  });

  // =====================================
  // INPUT NOMINAL MANUAL
  // =====================================

  instantAmount?.addEventListener("input", e => {

    instantSelected = Number(e.target.value) || 0;

    instantButtons.forEach(btn => {

      btn.classList.toggle(
        "active",
        Number(btn.dataset.value) === instantSelected
      );

    });

  });

  // =====================================
  // INSTANT WITHDRAW
  // =====================================

  instantWithdrawBtn?.addEventListener(
    "click",
    instantWithdraw
  );

}


// ========================================
// PAYMENT JS
// PART 4 - MANUAL WITHDRAW
// ========================================

async function manualWithdraw() {

  console.log("[MANUAL WITHDRAW]");

  if (!manualWithdrawOpen) {
    alert("Withdraw sedang tutup");
    return;
  }

  const amount = Number($("manualAmount")?.value || 0);

  if (amount <= 0) {
    alert("Masukkan nominal withdraw");
    return;
  }

  if (amount < 100000) {
    alert("Minimal withdraw Rp100.000");
    return;
  }

  try {

    // =====================================
    // PAYMENT METHOD
    // =====================================

    const { data: payment, error: paymentError } = await db
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) throw paymentError;

    if (!payment) {
      alert("Silakan simpan rekening terlebih dahulu");
      location.href = "paymentsetting.html";
      return;
    }

    // =====================================
    // PROFILE TERBARU
    // =====================================

    const profile = await window.database.getCurrentProfile();

    if (!profile) {
      alert("Gagal mengambil data user");
      return;
    }

    const balance = Number(profile.balance) || 0;

    if (balance < amount) {
      alert("Saldo tidak cukup");
      return;
    }

    // =====================================
    // INSERT WITHDRAW
    // =====================================

    const { error: withdrawError } = await db
      .from("withdraws")
      .insert({
        user_id: user.id,
        method: payment.method,
        account_number: payment.account_number,
        amount,
        fee: 0,
        type: "manual",
        status: "pending"
      });

    if (withdrawError) throw withdrawError;

    // =====================================
    // UPDATE BALANCE
    // =====================================

    const newBalance = balance - amount;

    const { error: updateError } = await db
      .from("users")
      .update({
        balance: newBalance
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    alert("Withdraw manual berhasil dibuat");

    location.reload();

  } catch (err) {

    console.log("[MANUAL WITHDRAW ERROR]", err);

    alert(
      err.message ||
      "Terjadi kesalahan saat membuat withdraw."
    );

  }

}

// ========================================
// PAYMENT JS
// PART 5 - INSTANT WITHDRAW
// ========================================

async function instantWithdraw() {

  console.log("[INSTANT WITHDRAW]");

  if (!instantSelected) {
    alert("Pilih nominal withdraw");
    return;
  }

  const fee = 15000;
  const total = instantSelected + fee;

  try {

    // =====================================
    // PROFILE TERBARU
    // =====================================

    const profile = await window.database.getCurrentProfile();

    if (!profile) {
      alert("Gagal mengambil data user");
      return;
    }

    const balance = Number(profile.balance) || 0;

    if (balance < total) {
      alert(
        "Saldo tidak cukup\n\n" +
        "Withdraw : " + rupiah(instantSelected) +
        "\nFee : " + rupiah(fee) +
        "\nTotal Potongan : " + rupiah(total)
      );
      return;
    }

    // =====================================
    // PAYMENT METHOD
    // =====================================

    const { data: payment, error: paymentError } = await db
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) throw paymentError;

    if (!payment) {
      alert("Silakan simpan rekening terlebih dahulu");
      location.href = "paymentsetting.html";
      return;
    }

    // =====================================
    // LIMIT HARIAN
    // =====================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: history, error: historyError } = await db
      .from("withdraws")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "instant")
      .gte("created_at", today.toISOString());

    if (historyError) throw historyError;

    const usedToday = (history || []).reduce(
      (total, item) => total + (Number(item.amount) || 0),
      0
    );

    if (usedToday + instantSelected > 500000) {
      alert(
        "Limit withdraw instant hari ini telah habis.\n\n" +
        "Limit harian: Rp500.000"
      );
      return;
    }

    // =====================================
    // INSERT WITHDRAW
    // =====================================

    const { error: withdrawError } = await db
      .from("withdraws")
      .insert({
        user_id: user.id,
        method: payment.method,
        account_number: payment.account_number,
        amount: instantSelected,
        fee,
        type: "instant",
        status: "success"
      });

    if (withdrawError) throw withdrawError;

    // =====================================
    // UPDATE BALANCE
    // =====================================

    const newBalance = balance - total;

    const { error: updateError } = await db
      .from("users")
      .update({
        balance: newBalance
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    alert("Withdraw instant berhasil");

    location.reload();

  } catch (err) {

    console.log("[INSTANT WITHDRAW ERROR]", err);

    alert(
      err.message ||
      "Terjadi kesalahan saat melakukan withdraw."
    );

  }

}

// ========================================
// PAYMENT JS
// PART 6 - HELPER & AUTO REFRESH
// ========================================

// =====================================
// UPDATE INSTANT LIMIT
// =====================================

function updateInstantLimit(used = 0) {

  const limit = 500000;
  const remain = Math.max(limit - used, 0);
  const percent = Math.min((used / limit) * 100, 100);

  if ($("instantLimit")) {
    $("instantLimit").textContent = rupiah(remain);
  }

  if ($("instantProgress")) {
    $("instantProgress").style.width = percent + "%";
  }

}

// =====================================
// TOGGLE BUTTON LOADING
// =====================================

function setButtonLoading(button, loading, text = "Loading...") {

  if (!button) return;

  if (loading) {

    button.disabled = true;
    button.dataset.original = button.innerHTML;
    button.innerHTML =
      `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;

  } else {

    button.disabled = false;

    if (button.dataset.original) {
      button.innerHTML = button.dataset.original;
    }

  }

}

// =====================================
// AUTO REFRESH STATUS
// =====================================

setInterval(() => {

  if (user?.id) {
    checkWithdrawService();
  }

}, 60000);

console.log("PAYMENT JS READY");
