"use strict";

// Premium is controlled by public.users.is_premium and premium_expires_at.
// Never mutate premium state in localStorage: payment must be confirmed server-side.
(function () {
  const db = window.database;

  function activePremium(user) {
    if (!user || user.is_premium !== true) return false;
    if (!user.premium_expires_at) return true;
    return new Date(user.premium_expires_at).getTime() > Date.now();
  }

  async function refreshPremiumUI() {
    if (!db || typeof db.getUser !== "function") return;
    try {
      const user = await db.getUser();
      const premium = activePremium(user);
      document.querySelectorAll(".btn-upgrade").forEach((btn) => {
        btn.disabled = premium;
        btn.textContent = premium ? "Premium Active" : "Upgrade Premium";
      });
      document.querySelectorAll("[data-premium-status]").forEach((el) => {
        el.textContent = premium ? "Premium Active" : "Free Plan";
      });
    } catch (err) {
      console.warn("Premium status unavailable", err);
    }
  }

  // Keep upgrade buttons informational until a real payment endpoint is configured.
  // This prevents the previous dummy upgrade from granting premium for free.
  function showUpgradeMessage() {
    if (typeof window.showToast === "function") {
      window.showToast("Premium upgrades require a confirmed payment.");
    } else {
      alert("Premium upgrades require a confirmed payment.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#btnUpgrade,#btnUpgradeBottom,.btn-upgrade")
      .forEach((btn) => btn.addEventListener("click", showUpgradeMessage));
    refreshPremiumUI();
  });

  window.Click2PayPremium = { activePremium, refreshPremiumUI };
})();
