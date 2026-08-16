/* Click2Pay theme controller — user controlled, persistent, no time-based switching. */
(function () {
  "use strict";
  function getTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", t === "dark");
    document.body?.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
    document.querySelectorAll("[data-theme-icon]").forEach(el => {
      el.classList.toggle("fa-moon", t !== "dark");
      el.classList.toggle("fa-sun", t === "dark");
    });
    window.dispatchEvent(new CustomEvent("c2p:theme", {detail:{theme:t}}));
  }
  window.C2PTheme = { getTheme, applyTheme };
  applyTheme(getTheme());
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  });
})();
