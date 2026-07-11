/*==========================
CLICK2PAY NAVBAR
==========================*/

const menuBtn=document.getElementById("menuBtn");
const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");

/*==========================
OPEN / CLOSE SIDEBAR
==========================*/

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

menuBtn.addEventListener("click",()=>{

if(sidebar.classList.contains("active")){
closeSidebar();
}else{
openSidebar();
}

});

overlay.addEventListener("click",closeSidebar);

/*==========================
ESC CLOSE
==========================*/

document.addEventListener("keydown",(e)=>{

if(e.key==="Escape"){
closeSidebar();
}

});

/*==========================
AUTO CLOSE MOBILE
==========================*/

document.querySelectorAll("nav a").forEach(link=>{

link.addEventListener("click",()=>{

if(window.innerWidth<=900){
closeSidebar();
}

});

});

/*==========================
ACTIVE MENU
==========================*/

const current=window.location.pathname.split("/").pop();

document.querySelectorAll("nav a").forEach(link=>{

const href=link.getAttribute("href");

if(href && href.endsWith(current)){

document.querySelectorAll("nav a").forEach(a=>a.classList.remove("active"));

link.classList.add("active");

/* buka parent dropdown */

const details=link.closest("details");

if(details){
details.open=true;
}

}

});

/*==========================
AUTO CLOSE WHEN RESIZE
==========================*/

window.addEventListener("resize",()=>{

if(window.innerWidth>900){

sidebar.classList.remove("active");
overlay.classList.remove("active");
document.body.style.overflow="";

}

});

/*==========================
DROPDOWN ANIMATION
==========================*/

document.querySelectorAll("details").forEach(item=>{

const summary=item.querySelector("summary");

summary.addEventListener("click",()=>{

setTimeout(()=>{

const icon=summary.querySelector(".fa-chevron-down");

if(item.open){
icon.style.transform="rotate(180deg)";
}else{
icon.style.transform="rotate(0deg)";
}

},10);

});

});

/*==========================
RIPPLE EFFECT
==========================*/

document.querySelectorAll("nav a,summary").forEach(btn=>{

btn.addEventListener("click",function(e){

const ripple=document.createElement("span");

const rect=this.getBoundingClientRect();

ripple.style.left=(e.clientX-rect.left)+"px";
ripple.style.top=(e.clientY-rect.top)+"px";

ripple.className="ripple";

this.appendChild(ripple);

setTimeout(()=>{
ripple.remove();
},500);

});

});

/*==========================
TOPBAR SHADOW
==========================*/

window.addEventListener("scroll",()=>{

const topbar=document.querySelector(".topbar");

if(window.scrollY>15){
topbar.style.boxShadow="0 8px 25px rgba(0,0,0,.08)";
}else{
topbar.style.boxShadow="none";
}

});

/*==========================
LOADING
==========================*/

window.addEventListener("load",()=>{

document.body.classList.add("loaded");

});
