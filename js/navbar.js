"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  // =========================
  // SIDEBAR OPEN
  // =========================
  window.c2pOpen = () => {
    $("c2pSide")?.classList.add("active");
    $("c2pOverlay")?.classList.add("active");
  };

  // =========================
  // SIDEBAR CLOSE
  // =========================
  window.c2pClose = () => {
    $("c2pSide")?.classList.remove("active");
    $("c2pOverlay")?.classList.remove("active");
  };

  // =========================
  // USER DROPDOWN
  // =========================
  window.c2pUser = () => {
    $("c2pDrop")?.classList.toggle("active");
  };

  // =========================
  // CLOSE DROPDOWN OUTSIDE
  // =========================
  document.addEventListener("click", e => {

    const drop = $("c2pDrop");
    if (!drop) return;

    if (
      !e.target.closest(".c2p-user") &&
      !e.target.closest(".c2p-dropdown")
    ) {
      drop.classList.remove("active");
    }

  });

  // =========================
  // SUB MENU
  // =========================
  window.c2pToggle = id => {

    const menu = $(id);
    if (!menu) return;

    document
      .querySelectorAll(".c2p-submenu")
      .forEach(item => {
        if (item.id !== id) {
          item.classList.remove("active");
        }
      });

    menu.classList.toggle("active");
  };

  // =========================
  // CLOSE SIDEBAR WHEN CLICK LINK
  // =========================
  document
    .querySelectorAll(".c2p-submenu a")
    .forEach(link => {
      link.addEventListener("click", () => c2pClose());
    });

  // =========================
  // LOAD PROFILE NAVBAR (FIXED)
  // =========================
  async function loadNavbarProfile(){

    const usernameBox = $("navbarUsername");
    const idBox       = $("navbarId");
    const userBox     = $("navbarUser");
    const saldoBox    = $("navbarSaldo");

    // 🔥 FIX: kalau semua element gak ada → STOP
    if (!usernameBox && !idBox && !userBox && !saldoBox) {
      console.log("Navbar tidak ada di halaman ini");
      return;
    }

    const userId = localStorage.getItem("user_id");

    if (!userId) {
      console.warn("USER ID KOSONG");
      return;
    }

    try {

      const { data, error } = await database.supabase
        .from("profiles")
        .select("id,username,balance")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("NAV PROFILE ERROR:", error);
        return;
      }

      if (!data) {
        console.warn("PROFILE TIDAK DITEMUKAN");
        return;
      }

      // =========================
      // UPDATE NAVBAR
      // =========================

      if (usernameBox) {
        usernameBox.textContent = data.username || "User";
      }

      if (idBox) {
        const shortId = data.id
          ? data.id.substring(0,8) + "..."
          : "-";

        idBox.textContent = shortId;
        idBox.dataset.fullId = data.id || "";
      }

      if (userBox) {
        userBox.textContent = "@" + (data.username || "-");
      }

      if (saldoBox) {
        saldoBox.textContent =
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
          }).format(Number(data.balance || 0));
      }

      console.log("NAVBAR UPDATE SUCCESS");

    } catch (err) {
      console.error("Navbar Profile Error:", err);
    }
  }

  // =========================
  // COPY USER ID
  // =========================
  document.addEventListener("click", e => {

    if (e.target.closest("#navbarId")) {

      const el = $("navbarId");
      const id = el?.dataset.fullId;

      if (!id) return;

      navigator.clipboard.writeText(id);

      el.textContent = "Copied!";

      setTimeout(() => {
        el.textContent = id.substring(0,8) + "...";
      }, 1000);
    }

  });

  // =========================
  // INIT NAVBAR
  // =========================
  window.addEventListener("load", loadNavbarProfile);

  // =========================
  // LOGOUT
  // =========================
  const logoutBtn = $("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {

        await database.supabase.auth.signOut();

        localStorage.removeItem("user_id");
        localStorage.removeItem("username");

        window.location.href = "login.html";

      } catch (err) {
        console.error(err);
        alert("Gagal logout");
      }
    });
  }

});
