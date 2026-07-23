// ===============================
// CLICK2PAY NAVBAR SYSTEM (FINAL)
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("navbar");
  if (!container) return;

  // ===== LOAD NAVBAR HTML =====
  try {
    const res = await fetch("/components/navbar.html"); // WAJIB pakai /
    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error("Navbar gagal load:", err);
    return;
  }

  // ===== INIT ELEMENT =====
  const menuBtn = container.querySelector(".c2p-menu-btn");
  const sidebar = container.querySelector(".c2p-sidebar");
  const overlay = container.querySelector(".c2p-overlay");
  const searchInput = container.querySelector("#menuSearch");
  const menuLinks = container.querySelectorAll(".c2p-sidebar a");

  // ===== SAFETY CHECK =====
  if (!menuBtn || !sidebar || !overlay) {
    console.warn("Navbar element tidak lengkap");
    return;
  }

  // ===== TOGGLE SIDEBAR =====
  function openSidebar() {
    sidebar.style.left = "0";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.style.left = "-260px";
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  menuBtn.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  // ===== AUTO CLOSE SAAT KLIK MENU =====
  menuLinks.forEach(link => {
    link.addEventListener("click", () => {
      closeSidebar();
    });
  });

  // ===== SEARCH MENU (LIVE FILTER) =====
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase();

      menuLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        link.style.display = text.includes(keyword) ? "flex" : "none";
      });
    });
  }

  // ===== ACTIVE LINK DETECT =====
  const currentPath = window.location.pathname;

  menuLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    if (currentPath.includes(href)) {
      link.style.background = "rgba(0,0,0,0.05)";
      link.style.fontWeight = "600";
    }
  });

  // ===== DARK MODE AUTO (SYNC SYSTEM) =====
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function applyDark(e) {
    if (e.matches) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  applyDark(darkQuery);
  darkQuery.addEventListener("change", applyDark);

  // ===== ESC KEY CLOSE =====
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // ===== SWIPE CLOSE (MOBILE UX) =====
  let touchStartX = 0;

  sidebar.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
  });

  sidebar.addEventListener("touchmove", e => {
    const touchX = e.touches[0].clientX;
    if (touchX - touchStartX < -50) {
      closeSidebar();
    }
  });

});
