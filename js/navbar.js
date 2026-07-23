(function(){

document.addEventListener("DOMContentLoaded",async()=>{

console.log("NAVBAR READY");

const sidebar=document.querySelector(".c2p-sidebar");
const overlay=document.querySelector(".c2p-overlay");
const menuBtn=document.querySelector(".c2p-menu-btn");
const searchInput=document.querySelector("#menuSearch");



function openSidebar(){

sidebar.style.left="0";

if(overlay)
overlay.style.display="block";

}



function closeSidebar(){

sidebar.style.left="-270px";

if(overlay)
overlay.style.display="none";

}



menuBtn?.addEventListener(
"click",
openSidebar
);


overlay?.addEventListener(
"click",
closeSidebar
);




// SEARCH

if(searchInput){

const items=sidebar.querySelectorAll("a");


searchInput.oninput=function(){

const key=this.value.toLowerCase();


items.forEach(item=>{

item.style.display=
item.innerText.toLowerCase().includes(key)
?"flex"
:"none";

});


};

}





// ACTIVE MENU

const current=location.pathname;


sidebar.querySelectorAll("a")
.forEach(link=>{


const href=link.getAttribute("href");


if(href && current.includes(href)){

link.classList.add("active");

}


});




// USER

try{

const profile=
await database.getCurrentProfile();


const box=
document.querySelector(".c2p-user");


if(box && profile){

box.innerHTML=
`
<strong>
${profile.username || "User"}
</strong>
`;

}


}catch(e){

console.warn(
"USER ERROR",
e
);

}





// LOGOUT

const logout=
document.querySelector(".c2p-logout");


logout?.addEventListener(
"click",
async()=>{
await database.logout();
}
);



});

})();
