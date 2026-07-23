// ===============================
// CLICK2PAY NAVBAR FINAL SYSTEM
// CONNECTED TO database.js
// ===============================

(function(){

  const root = document.querySelector("#navbar");
  if(!root) return;

  const sidebar = root.querySelector(".c2p-sidebar");
  const overlay = root.querySelector(".c2p-overlay");
  const menuBtn = root.querySelector(".c2p-menu-btn");
  const searchInput = root.querySelector("#menuSearch");

  let menuItems = [];

  // ===============================
  // SIDEBAR CONTROL
  // ===============================
  function openSidebar(){
    sidebar.style.left = "0";
    overlay.style.display = "block";
  }

  function closeSidebar(){
    sidebar.style.left = "-270px";
    overlay.style.display = "none";
  }

  menuBtn?.addEventListener("click", openSidebar);
  overlay?.addEventListener("click", closeSidebar);

  // ===============================
  // SEARCH MENU
  // ===============================
  function initSearch(){
    if(!searchInput) return;

    menuItems = [...sidebar.querySelectorAll("a")];

    searchInput.addEventListener("input", function(){

      const keyword = this.value.toLowerCase();

      menuItems.forEach(item => {

        const text = item.innerText.toLowerCase();

        item.style.display = text.includes(keyword)
          ? "flex"
          : "none";

      });

    });
  }

  // ===============================
  // ACTIVE MENU
  // ===============================
  function setActiveMenu(){

    const links = sidebar.querySelectorAll("a");
    const current = location.pathname;

    links.forEach(link => {

      const href = link.getAttribute("href");

      if(href && current.includes(href)){
        link.style.background = "#22c55e";
        link.style.color = "#fff";
      }

    });

  }

  // ===============================
  // LOAD MENU FROM DATABASE
  // ===============================
  async function loadMenu(){

    const profile = await database.getCurrentProfile();

    if(!profile){
      location.href = "/login.html";
      return;
    }

    const role = profile.role || "member";

    const menus = await database.getMenusByRole(role);

    // hapus menu lama
    sidebar.querySelectorAll("a").forEach(el => el.remove());

    menus.forEach(menu => {

      const a = document.createElement("a");

      a.href = menu.link;

      a.innerHTML = `
        <i class="${menu.icon}"></i>
        ${menu.name}
      `;

      // auto close mobile
      a.addEventListener("click", closeSidebar);

      sidebar.appendChild(a);

    });

    // re-init
    initSearch();
    setActiveMenu();

  }

  // ===============================
  // LOAD USER UI
  // ===============================
  async function loadUserUI(){

    const profile = await database.getCurrentProfile();

    if(!profile) return;

    const userBox = root.querySelector(".c2p-user");

    if(userBox){
      userBox.innerHTML = `
        <strong>${profile.username || "User"}</strong>
      `;
    }

  }

  // ===============================
  // LOGOUT
  // ===============================
  function initLogout(){

    const btn = root.querySelector(".c2p-logout");

    if(!btn) return;

    btn.addEventListener("click", async () => {
      await database.logout();
    });

  }

  // ===============================
  // PROTECT PAGE
  // ===============================
  async function protect(){

    const user = await database.getUser();

    if(!user){
      location.href = "/login.html";
      return false;
    }

    return true;
  }

  // ===============================
  // INIT
  // ===============================
  document.addEventListener("DOMContentLoaded", async () => {

    const ok = await protect();
    if(!ok) return;

    await loadMenu();
    await loadUserUI();
    initLogout();

  });

})();
