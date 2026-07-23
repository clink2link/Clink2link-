// ===============================
// CLICK2PAY NAVBAR FINAL STABLE
// ===============================

(function(){

  const root = document.querySelector("#navbar");

  if(!root){
    console.warn("NAVBAR ROOT TIDAK ADA");
    return;
  }


  const sidebar = root.querySelector(".c2p-sidebar");
  const overlay = root.querySelector(".c2p-overlay");
  const menuBtn = root.querySelector(".c2p-menu-btn");
  const searchInput = root.querySelector("#menuSearch");


  let menuItems = [];


  // ===============================
  // SIDEBAR
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


  menuBtn?.addEventListener(
    "click",
    openSidebar
  );


  overlay?.addEventListener(
    "click",
    closeSidebar
  );



  // ===============================
  // FALLBACK MENU
  // ===============================

  function getFallbackMenu(){

    return [

      {
        name:"Dashboard",
        icon:"fa-solid fa-house",
        link:"/dashboard"
      },

      {
        name:"Create Link",
        icon:"fa-solid fa-link",
        link:"/create"
      },

      {
        name:"My Links",
        icon:"fa-solid fa-list",
        link:"/links"
      },

      {
        name:"Withdraw",
        icon:"fa-solid fa-money-bill",
        link:"/withdraw"
      }

    ];

  }



  // ===============================
  // RENDER MENU
  // ===============================

  function renderMenu(menus){


    if(!sidebar){

      console.error(
        "SIDEBAR TIDAK DITEMUKAN"
      );

      return;

    }



    sidebar
    .querySelectorAll("a")
    .forEach(el=>el.remove());



    menus.forEach(menu=>{


      const a=document.createElement("a");


      a.href = menu.link;


      a.innerHTML = `

        <i class="${menu.icon}"></i>

        <span>
          ${menu.name}
        </span>

      `;


      a.addEventListener(
        "click",
        closeSidebar
      );


      sidebar.appendChild(a);


    });



    initSearch();
    setActiveMenu();


  }




  // ===============================
  // SEARCH
  // ===============================

  function initSearch(){

    if(!searchInput || !sidebar)
      return;


    menuItems =
      [...sidebar.querySelectorAll("a")];


    searchInput.oninput=function(){


      const keyword =
      this.value.toLowerCase();



      menuItems.forEach(item=>{


        const text =
        item.innerText.toLowerCase();



        item.style.display =
        text.includes(keyword)
        ? "flex"
        : "none";


      });


    };


  }




  // ===============================
  // ACTIVE MENU
  // ===============================

  function setActiveMenu(){


    if(!sidebar)
      return;


    const current =
    location.pathname;


    sidebar
    .querySelectorAll("a")
    .forEach(link=>{


      link.style.background="";
      link.style.color="";


      const href =
      link.getAttribute("href");


      if(
        href &&
        current.includes(href)
      ){

        link.style.background="#22c55e";
        link.style.color="#fff";

      }


    });


  }




  // ===============================
  // LOAD MENU
  // ===============================

  async function loadMenu(){


    try{


      const profile =
      await database.getCurrentProfile();



      if(!profile){

        console.warn(
          "PROFILE TIDAK ADA"
        );

        location.href="/login.html";

        return;

      }



      const role =
      profile.role || "member";



      console.log(
        "USER ROLE:",
        role
      );



      let menus =
      await database.getMenusByRole(role);



      console.log(
        "MENU DATABASE:",
        menus
      );



      if(
        !Array.isArray(menus) ||
        menus.length===0
      ){

        console.warn(
          "MENU KOSONG, PAKAI FALLBACK"
        );


        menus =
        getFallbackMenu();

      }



      renderMenu(menus);



      console.log(
        "NAVBAR MENU SUCCESS"
      );



    }
    catch(error){


      console.error(
        "LOAD MENU ERROR:",
        error
      );


      renderMenu(
        getFallbackMenu()
      );


    }


  }




  // ===============================
  // USER UI
  // ===============================

  async function loadUserUI(){


    try{


      const profile =
      await database.getCurrentProfile();


      if(!profile)
        return;



      const box =
      root.querySelector(".c2p-user");



      if(box){

        box.innerHTML = `

        <strong>
        ${profile.username || "User"}
        </strong>

        `;

      }


    }
    catch(error){

      console.warn(
        "USER UI ERROR",
        error
      );

    }


  }




  // ===============================
  // LOGOUT
  // ===============================

  function initLogout(){


    const btn =
    root.querySelector(".c2p-logout");



    if(!btn)
      return;



    btn.onclick=async()=>{


      try{

        await database.logout();

      }
      catch(error){

        console.error(
          "LOGOUT ERROR",
          error
        );

      }


    };


  }




  // ===============================
  // AUTH PROTECT
  // ===============================

  async function protect(){


    const user =
    await database.getUser();



    if(!user){

      location.href="/login.html";

      return false;

    }


    return true;


  }




  // ===============================
  // START
  // ===============================

  document.addEventListener(
    "DOMContentLoaded",
    async()=>{


      const ok =
      await protect();



      if(!ok)
        return;



      await loadMenu();

      await loadUserUI();

      initLogout();



      console.log(
        "NAVBAR INIT COMPLETE"
      );


    }
  );


})();
