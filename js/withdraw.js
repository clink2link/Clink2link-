/* =========================================================
   CLICK2PAY — PRODUCTION WITHDRAWAL
   All balance movement is performed by a database RPC.
   ========================================================= */
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);
  const amountEl = $("amount");
  const typeEl = $("withdrawType");
  const methodEl = $("method");
  const targetEl = $("target");
  const btn = $("withdrawBtn");
  const list = $("withdrawList");
  const balanceEl = $("balance");
  const receiveEl = $("receiveAmount");

  let user = null;
  let balance = 0;
  let premium = false;
  let currentType = "manual";

  const money = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  const mask = (v) => {
    const s = String(v ?? "");
    if (s.length <= 4) return s;
    return "•".repeat(Math.max(0,s.length-4)) + s.slice(-4);
  };

  function feeFor(amount) {
    return currentType === "instant" && !premium ? 15000 : 0;
  }

  function updateReceive() {
    const amount = Math.max(0, Number(amountEl?.value || 0));
    const receive = Math.max(0, amount - feeFor(amount));
    const feeNode = $("withdrawFee");
    if (feeNode) feeNode.textContent = money(feeFor(amount));
    if (receiveEl) receiveEl.textContent = money(receive);
  }

  function updateLimit() {
    const limit = premium ? 500000 : 250000;
    const node = $("instantLimit");
    if (node) node.textContent = money(limit);
    const premiumNode = $("premiumStatus");
    if (premiumNode) premiumNode.textContent = premium ? "Premium aktif" : "Free";
  }

  async function loadUser() {
    if (!window.database) throw new Error("Database belum dimuat.");
    user = await window.database.getCurrentProfile();
    if (!user) {
      location.href = "login.html";
      return false;
    }
    balance = Number(user.balance || 0);
    premium = user.is_premium === true &&
      (!user.premium_expires_at || new Date(user.premium_expires_at).getTime() > Date.now());
    if (balanceEl) balanceEl.textContent = balance.toLocaleString("id-ID");
    updateLimit();
    updateReceive();
    return true;
  }

  function statusLabel(status) {
    const map = {
      pending: ["Menunggu", "pending"],
      processing: ["Diproses", "processing"],
      paid: ["Berhasil", "success"],
      success: ["Berhasil", "success"],
      rejected: ["Ditolak", "danger"],
      cancelled: ["Dibatalkan", "danger"]
    };
    return map[String(status || "").toLowerCase()] || ["Menunggu", "pending"];
  }

  async function loadHistory() {
    if (!window.database || !user) return;
    const rows = await window.database.getWithdraws(user.id);
    if (!list) return;
    if (!rows.length) {
      list.innerHTML = `<div class="empty"><i class="fa-solid fa-receipt"></i><p>Belum ada riwayat withdraw.</p></div>`;
      return;
    }
    list.innerHTML = rows.map(item => {
      const [label, cls] = statusLabel(item.status);
      return `<article class="link-card" style="margin-bottom:12px">
        <div class="link-top">
          <div>
            <strong>${esc(item.type === "instant" ? "Withdraw Instan" : "Withdraw Manual")}</strong>
            <div class="c2p-muted" style="font-size:12px">${esc(new Date(item.created_at).toLocaleString("id-ID"))}</div>
          </div>
          <span class="badge ${cls}">${label}</span>
        </div>
        <div class="link-mid">
          <span>${esc(String(item.method || "").toUpperCase())} • ${esc(mask(item.account_number))}</span>
          <strong>${money(item.amount)}</strong>
        </div>
        <div class="c2p-muted" style="font-size:12px;margin-top:8px">
          Fee ${money(item.fee || 0)} • Diterima ${money(Math.max(0, Number(item.amount||0)-Number(item.fee||0)))}
        </div>
      </article>`;
    }).join("");
  }

  async function submit() {
    if (!user) return;
    const amount = Math.floor(Number(amountEl?.value || 0));
    const method = String(methodEl?.value || "").trim();
    const target = String(targetEl?.value || "").trim();

    if (!Number.isFinite(amount) || amount < 10000)
      return alert("Minimal withdraw Rp10.000.");
    if (!method || !target)
      return alert("Lengkapi metode dan nomor tujuan.");
    if (amount > balance)
      return alert("Saldo tidak mencukupi.");

    const limit = premium ? 500000 : 250000;
    if (currentType === "instant" && amount > limit)
      return alert(`Limit withdraw instan ${money(limit)}.`);

    btn.disabled = true;
    const old = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;

    try {
      const result = await window.database.createWithdraw({
        amount, method, account_number: target, type: currentType
      });
      if (!result?.success) throw new Error(result?.error || "Withdraw gagal.");
      await loadUser();
      await loadHistory();
      amountEl.value = "";
      targetEl.value = "";
      updateReceive();
      alert("Withdraw berhasil dibuat dan saldo sudah dicadangkan.");
    } catch (e) {
      console.error("WITHDRAW ERROR", e);
      alert(e?.message || "Gagal membuat withdraw.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  }

  document.querySelectorAll(".type-btn").forEach((el) => {
    el.addEventListener("click", () => {
      currentType = el.dataset.type || "manual";
      document.querySelectorAll(".type-btn").forEach(x => x.classList.toggle("active", x === el));
      if (typeEl) typeEl.value = currentType;
      updateReceive();
    });
  });

  amountEl?.addEventListener("input", updateReceive);
  typeEl?.addEventListener("change", () => {
    currentType = typeEl.value || "manual";
    updateReceive();
  });
  btn?.addEventListener("click", submit);

  try {
    if (await loadUser()) await loadHistory();
  } catch (e) {
    console.error(e);
    if (list) list.innerHTML = `<div class="empty">Gagal memuat data withdraw.</div>`;
  }
});
