(function(){

let navbarLoaded = false;


window.c2pInit=function(){

if(navbarLoaded) return;

navbarLoaded = true;


const sidebar = document.querySelector(".c2p-sidebar");
const overlay = document.querySelector(".c2p-overlay");
const menuBtn = document.querySelector(".c2p-menu-btn");
const search = document.querySelector("#menuSearch");
const logout = document.querySelector(".c2p-logout");


if(!sidebar) {
    console.log("SIDEBAR NOT FOUND");
    return;
}



function openSidebar(){

    sidebar.style.left="0";

    if(overlay){
        overlay.style.display="block";
    }

}



function closeSidebar(){

    sidebar.style.left="-270px";

    if(overlay){
        overlay.style.display="none";
    }

}



menuBtn?.addEventListener(
"click",
openSidebar
);



overlay?.addEventListener(
"click",
closeSidebar
);



sidebar.querySelectorAll("a")
.forEach(a=>{

a.addEventListener(
"click",
closeSidebar
);

});



// SEARCH

if(search){

search.addEventListener(
"input",
()=>{

let key =
search.value.toLowerCase();


sidebar.querySelectorAll("a")
.forEach(item=>{

item.style.display =
item.innerText
.toLowerCase()
.includes(key)
?
"flex"
:
"none";


});

});

}



// LOGOUT

logout?.addEventListener(
"click",
async()=>{

if(window.database){

await database.logout();

}

localStorage.clear();
sessionStorage.clear();

location.replace("index.html");


});



console.log("NAVBAR READY");


};


})();
