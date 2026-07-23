(function(){

window.c2pInit=function(){

const sidebar=document.querySelector(".c2p-sidebar");
const overlay=document.querySelector(".c2p-overlay");
const menuBtn=document.querySelector(".c2p-menu-btn");
const search=document.querySelector("#menuSearch");
const logout=document.querySelector(".c2p-logout");


if(!sidebar)return;


function open(){
sidebar.style.left="0";
if(overlay)overlay.style.display="block";
}


function close(){
sidebar.style.left="-270px";
if(overlay)overlay.style.display="none";
}


menuBtn?.addEventListener("click",open);

overlay?.addEventListener("click",close);



sidebar.querySelectorAll("a").forEach(a=>{
a.addEventListener("click",close);
});



// SEARCH

if(search){

search.addEventListener("input",()=>{

let key=search.value.toLowerCase();

sidebar.querySelectorAll("a").forEach(item=>{

item.style.display=
item.innerText.toLowerCase().includes(key)
?"flex"
:"none";

});

});

}


// ACTIVE MENU

let current=location.pathname;

sidebar.querySelectorAll("a").forEach(a=>{

if(a.getAttribute("href")===current){

a.classList.add("active");

}

});



// USER

database.getUser()
.then(user=>{

const box=document.querySelector(".c2p-user");

if(box && user){

box.innerHTML=
`<b>${user.email || "User"}</b>`;

}

});



// LOGOUT

logout?.addEventListener("click",async()=>{

await database.logout();

localStorage.clear();
sessionStorage.clear();

location.href="index.html";

});


console.log("NAVBAR READY");

};


})();
