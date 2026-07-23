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
   DARK / NIGHT MODE
========================= */

function applyTheme(theme){

const icon = themeBtn?.querySelector("i");


if(theme === "dark"){

document.documentElement.classList.add("dark");


if(icon){
icon.classList.remove("fa-moon");
icon.classList.add("fa-sun");
}


}else{


document.documentElement.classList.remove("dark");


if(icon){
icon.classList.remove("fa-sun");
icon.classList.add("fa-moon");
}


}

}

// =========================
// LOAD THEME
// =========================

const savedTheme = localStorage.getItem("theme");



if(savedTheme){


applyTheme(savedTheme);



}else{


const prefersDark =
window.matchMedia(
"(prefers-color-scheme: dark)"
).matches;



applyTheme(
prefersDark ? "dark" : "light"
);



}



// =========================
// BUTTON TOGGLE
// =========================

themeBtn?.addEventListener(
"click",
()=>{


const isDark =
document.documentElement.classList.contains("dark");



const newTheme =
isDark ? "light" : "dark";



localStorage.setItem(
"theme",
newTheme
);



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
