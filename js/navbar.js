(function(){

“use strict”;

let navbarLoaded = false;

/* =====================================================
CLICK2PAY NAVBAR INIT
===================================================== */

window.c2pInit = function(){

/*
 * Jangan blokir terlalu awal.
 * Navbar bisa dimuat ulang secara dinamis.
 */
if(navbarLoaded){
    console.log("NAVBAR ALREADY INITIALIZED");
    return;
}
const sidebar =
    document.querySelector(".c2p-sidebar");
const overlay =
    document.querySelector(".c2p-overlay");
const menuBtn =
    document.querySelector(".c2p-menu-btn");
const search =
    document.querySelector("#menuSearch");
const logout =
    document.querySelector(".c2p-logout");
const themeBtn =
    document.querySelector("#themeToggle");
/* =================================================
   SIDEBAR CHECK
================================================= */
if(!sidebar){
    console.warn(
        "SIDEBAR NOT FOUND"
    );
    return;
}
/*
 * Tandai setelah navbar benar-benar ditemukan.
 */
navbarLoaded = true;
/* =================================================
   SIDEBAR
================================================= */
function openSidebar(){
    sidebar.classList.add("active");
    overlay?.classList.add("active");
}
function closeSidebar(){
    sidebar.classList.remove("active");
    overlay?.classList.remove("active");
}
menuBtn?.addEventListener(
    "click",
    openSidebar
);
overlay?.addEventListener(
    "click",
    closeSidebar
);
sidebar
    .querySelectorAll("a")
    .forEach(function(a){
        a.addEventListener(
            "click",
            closeSidebar
        );
    });
/* =================================================
   SEARCH
================================================= */
if(search){
    search.addEventListener(
        "input",
        function(){
            const key =
                search.value
                    .toLowerCase()
                    .trim();
            sidebar
                .querySelectorAll("a")
                .forEach(function(item){
                    const text =
                        item.innerText
                            .toLowerCase();
                    item.style.display =
                        text.includes(key)
                            ? "flex"
                            : "none";
                });
        }
    );
}
/* =================================================
   THEME
================================================= */
function applyTheme(theme){
    const icon =
        themeBtn?.querySelector("i");
    if(theme === "dark"){
        document.documentElement
            .classList
            .add("dark");
        if(icon){
            icon.classList
                .remove("fa-moon");
            icon.classList
                .add("fa-sun");
        }
    }else{
        document.documentElement
            .classList
            .remove("dark");
        if(icon){
            icon.classList
                .remove("fa-sun");
            icon.classList
                .add("fa-moon");
        }
    }
}
/* =================================================
   LOAD SAVED THEME
================================================= */
const savedTheme =
    localStorage.getItem("theme");
if(savedTheme){
    applyTheme(savedTheme);
}else{
    const prefersDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
    applyTheme(
        prefersDark
            ? "dark"
            : "light"
    );
}
/* =================================================
   THEME TOGGLE
================================================= */
themeBtn?.addEventListener(
    "click",
    function(){
        const isDark =
            document.documentElement
                .classList
                .contains("dark");
        const newTheme =
            isDark
                ? "light"
                : "dark";
        localStorage.setItem(
            "theme",
            newTheme
        );
        applyTheme(newTheme);
    }
);
/* =================================================
   CREATE MENU
================================================= */
const createBtn =
    document.getElementById(
        "createBtn"
    );
const createMenu =
    document.getElementById(
        "createMenu"
    );
if(createBtn && createMenu){
    createBtn.addEventListener(
        "click",
        function(){
            createMenu
                .classList
                .toggle("active");
            createBtn
                .classList
                .toggle("active");
        }
    );
}
/* =================================================
   LOGOUT
================================================= */
if(logout){
    logout.addEventListener(
        "click",
        async function(e){
            e.preventDefault();
            try{
                if(
                    window.database &&
                    typeof database.logout ===
                    "function"
                ){
                    await database.logout();
                }
            }catch(error){
                console.warn(
                    "Logout error:",
                    error
                );
            }
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace(
                "index.html"
            );
        }
    );
}
/* =================================================
   LANGUAGE
================================================= */
/*
 * Navbar HTML baru saja dimasukkan.
 * Jadi selector bahasa sekarang sudah tersedia.
 */
if(
    window.c2pLanguage &&
    typeof c2pLanguage.refreshLanguage ===
    "function"
){
    c2pLanguage.refreshLanguage();
    console.log(
        "NAVBAR LANGUAGE APPLIED:",
        c2pLanguage.getLanguage()
    );
}
/* =================================================
   READY
================================================= */
console.log(
    "NAVBAR READY 🚀"
);

};

})();
