function c2pOpen(){

document.getElementById("c2pSide")
.classList.add("active");


document.getElementById("c2pOverlay")
.classList.add("active");

}



function c2pClose(){

document.getElementById("c2pSide")
.classList.remove("active");


document.getElementById("c2pOverlay")
.classList.remove("active");

}



function c2pUser(){

document.getElementById("c2pDrop")
.classList.toggle("active");

}


document.addEventListener("click",function(e){

let drop=document.getElementById("c2pDrop");

if(!e.target.closest(".c2p-user") &&
!e.target.closest(".c2p-dropdown")){

drop.classList.remove("active");

}

});

function c2pToggle(id){

let menu=document.getElementById(id);

let all=document.querySelectorAll(".c2p-submenu");

all.forEach(item=>{

if(item.id!==id){

item.classList.remove("active");

}

});


menu.classList.toggle("active");

}

document.querySelectorAll(".c2p-submenu a")
.forEach(link=>{

link.addEventListener("click",()=>{

c2pClose();

});

});
