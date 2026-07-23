// ===============================
// CLICK2PAY NAVBAR FINAL (FIXED)
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
    if(!sidebar || !overlay) return;
    sidebar.style.left = "0";
    overlay.style.display = "block";
  }

  function closeSidebar(){
    if(!sidebar || !overlay) return;
    sidebar.style.left = "-270px";
    overlay.style.display = "none";
  }

  menuBtn?.addEventListener("click", openSidebar);
  overlay?.addEventListener("click", closeSidebar);

  // ===============================
  // SEARCH MENU
  // ===============================
  function initSearch(){
    if(!searchInput || !sidebar) return;

    menuItems = [...sidebar.querySelectorAll("a")];

    searchInput.addEventListener("input", function(){
      const keyword = this.value.toLowerCase();

      menuItems.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(keyword) ? "flex" : "none";
      });
    });
  }

  // ===============================
  // ACTIVE MENU
  // ===============================
  function setActiveMenu(){
    if(!sidebar) return;

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
  // FALLBACK MENU (ANTI ERROR)
  // ===============================
  function getFallbackMenu(){
    return [
      {name:"Dashboard", icon:"fa-solid fa-house", link:"/dashboard"},
      {name:"Create Link", icon:"fa-solid fa-link", link:"/create"},
      {name:"My Link", icon:"fa-solid fa-list", link:"/links"},
      {name:"Withdraw", icon:"fa-solid fa-money-bill", link:"/withdraw"}
    ];
  }

  // ===============================
  // LOAD MENU
  // ===============================
  async function loadMenu(){

    try{

      const profile = await database.getCurrentProfile();

      if(!profile){
        location.href = "/login.html";
        return;
      }

      const role = profile.role || "member";

      let menus = [];

      // 🔥 SAFE CALL
      if(typeof database.getMenusByRole === "function"){
        try{
          menus = await database.getMenusByRole(role);
        }catch(e){
          console.warn("DB MENU ERROR:", e);
        }
      }

      // 🔥 FALLBACK AUTO
      if(!menus || menus.length === 0){
        console.warn("PAKAI FALLBACK MENU");
        menus = getFallbackMenu();
      }

      // clear menu
      sidebar.querySelectorAll("a").forEach(el => el.remove());

      menus.forEach(menu => {

        const a = document.createElement("a");

        a.href = menu.link || "#";

        a.innerHTML = `
          <i class="${menu.icon || 'fa-solid fa-circle'}"></i>
          ${menu.name || 'Menu'}
        `;

        a.addEventListener("click", closeSidebar);

        sidebar.appendChild(a);

      });

      initSearch();
      setActiveMenu();

    }catch(err){
      console.error("LOAD MENU FATAL:", err);

      // fallback kalau crash total
      const menus = getFallbackMenu();

      menus.forEach(menu => {
        const a = document.createElement("a");
        a.href = menu.link;
        a.innerHTML = `<i class="${menu.icon}"></i> ${menu.name}`;
        sidebar.appendChild(a);
      });
    }

  }

  // ===============================
  // LOAD USER UI
  // ===============================
  async function loadUserUI(){

    try{

      const profile = await database.getCurrentProfile();

      if(!profile) return;

      const userBox = root.querySelector(".c2p-user");

      if(userBox){
        userBox.innerHTML = `
          <strong>${profile.username || "User"}</strong>
        `;
      }

    }catch(e){
      console.warn("USER UI ERROR:", e);
    }

  }

  // ===============================
  // LOGOUT
  // ===============================
  function initLogout(){

    const btn = root.querySelector(".c2p-logout");

    if(!btn) return;

    btn.addEventListener("click", async () => {
      try{
        await database.logout();
      }catch(e){
        console.error("LOGOUT ERROR:", e);
      }
    });

  }

  // ===============================
  // PROTECT PAGE
  // ===============================
  async function protect(){

    try{

      const user = await database.getUser();

      if(!user){
        location.href = "/login.html";
        return false;
      }

      return true;

    }catch(e){
      console.error("AUTH ERROR:", e);
      location.href = "/login.html";
      return false;
    }

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
