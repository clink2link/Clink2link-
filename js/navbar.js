(function(){

let navbarLoaded = false;

window.c2pInit = function(){

if(navbarLoaded) return;
navbarLoaded = true;

const sidebar = document.querySelector(".c2p-sidebar");
const overlay = document.querySelector(".c2p-overlay");
const menuBtn = document.querySelector(".c2p-menu-btn");
const search = document.querySelector("#menuSearch");
const logout = document.querySelector(".c2p-logout");
const themeBtn = document.querySelector("#themeToggle");

if(!sidebar){
console.log("SIDEBAR NOT FOUND");
return;
}


/* =========================
   SIDEBAR
========================= */

function openSidebar(){
sidebar.classList.add("active");
overlay?.classList.add("active");
}

function closeSidebar(){
sidebar.classList.remove("active");
overlay?.classList.remove("active");
}

menuBtn?.addEventListener("click", openSidebar);
overlay?.addEventListener("click", closeSidebar);

sidebar.querySelectorAll("a").forEach(a=>{
a.addEventListener("click", closeSidebar);
});


/* =========================
   SEARCH
========================= */

if(search){

search.addEventListener("input", ()=>{

const key = search.value.toLowerCase();

sidebar.querySelectorAll("a").forEach(item=>{

item.style.display =
item.innerText.toLowerCase().includes(key)
? "flex"
: "none";

});

});

}


/* =========================
   DARK MODE
========================= */

function applyTheme(theme){

if(theme === "dark"){
document.body.classList.add("dark");
themeBtn?.querySelector("i")
.classList.replace("fa-moon","fa-sun");
}else{
document.body.classList.remove("dark");
themeBtn?.querySelector("i")
.classList.replace("fa-sun","fa-moon");
}

}

const savedTheme = localStorage.getItem("theme");

// auto detect system
if(!savedTheme){
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(prefersDark ? "dark" : "light");
}else{
applyTheme(savedTheme);
}

themeBtn?.addEventListener("click", ()=>{

const isDark = document.body.classList.contains("dark");
const newTheme = isDark ? "light" : "dark";

localStorage.setItem("theme", newTheme);
applyTheme(newTheme);

});


/* =========================
   LOGOUT
========================= */

logout?.addEventListener("click", async()=>{

try{

if(window.database){
await database.logout();
}

}catch(e){
console.warn("Logout error:", e);
}

localStorage.clear();
sessionStorage.clear();

location.replace("index.html");

});


console.log("NAVBAR READY 🚀");

};

})();
