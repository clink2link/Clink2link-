/*==========================
CLICK2PAY NAVBAR
==========================*/

const menuToggle=document.getElementById("menuToggle");
const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");
const dropdowns=document.querySelectorAll(".dropdown");
const themeToggle=document.getElementById("themeToggle");

/*========== SIDEBAR ==========*/

function openSidebar(){
sidebar.classList.add("active");
overlay.classList.add("active");
document.body.style.overflow="hidden";
}

function closeSidebar(){
sidebar.classList.remove("active");
overlay.classList.remove("active");
document.body.style.overflow="";
}

menuToggle.addEventListener("click",()=>{

if(sidebar.classList.contains("active")){
closeSidebar();
}else{
openSidebar();
}

});

overlay.addEventListener("click",closeSidebar);

/*========== ESC CLOSE ==========*/

document.addEventListener("keydown",(e)=>{

if(e.key==="Escape"){
closeSidebar();
}

});

/*========== AUTO CLOSE MOBILE ==========*/

document.querySelectorAll("nav a").forEach(link=>{

link.addEventListener("click",()=>{

if(window.innerWidth<=900){
closeSidebar();
}

});

});

/*========== DROPDOWN ==========*/

dropdowns.forEach(drop=>{

const btn=drop.querySelector(".dropdown-btn");

btn.addEventListener("click",()=>{

dropdowns.forEach(item=>{

if(item!==drop){
item.classList.remove("active");
}

});

drop.classList.toggle("active");

});

});

/*========== ACTIVE MENU ==========*/

const page=location.pathname.split("/").pop();

document.querySelectorAll("nav a").forEach(link=>{

const href=link.getAttribute("href");

if(href.endsWith(page)){

document.querySelectorAll("nav a").forEach(a=>{
a.classList.remove("active");
});

link.classList.add("active");

const parent=link.closest(".dropdown");

if(parent){
parent.classList.add("active");
}

}

});

/*========== DARK MODE ==========*/

if(localStorage.getItem("theme")=="dark"){
document.body.classList.add("dark");
themeToggle.innerHTML='<i class="fa-solid fa-sun"></i>';
}

themeToggle.addEventListener("click",()=>{

document.body.classList.toggle("dark");

if(document.body.classList.contains("dark")){

localStorage.setItem("theme","dark");

themeToggle.innerHTML='<i class="fa-solid fa-sun"></i>';

}else{

localStorage.setItem("theme","light");

themeToggle.innerHTML='<i class="fa-solid fa-moon"></i>';

}

});

/*========== TOPBAR SHADOW ==========*/

window.addEventListener("scroll",()=>{

const topbar=document.querySelector(".topbar");

if(window.scrollY>10){

topbar.style.boxShadow="0 10px 30px rgba(15,23,42,.08)";

}else{

topbar.style.boxShadow="none";

}

});
