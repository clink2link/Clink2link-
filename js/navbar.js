document.addEventListener("DOMContentLoaded",()=>{


// =========================
// SIDEBAR OPEN
// =========================

window.c2pOpen=function(){

const side=document.getElementById("c2pSide");
const overlay=document.getElementById("c2pOverlay");


if(side)
side.classList.add("active");


if(overlay)
overlay.classList.add("active");


}



// =========================
// SIDEBAR CLOSE
// =========================

window.c2pClose=function(){

const side=document.getElementById("c2pSide");
const overlay=document.getElementById("c2pOverlay");


if(side)
side.classList.remove("active");


if(overlay)
overlay.classList.remove("active");


}



// =========================
// USER DROPDOWN
// =========================

window.c2pUser=function(){

const drop=document.getElementById("c2pDrop");


if(drop)
drop.classList.toggle("active");


}



// =========================
// CLOSE DROPDOWN OUTSIDE
// =========================

document.addEventListener("click",e=>{


const drop=document.getElementById("c2pDrop");


if(!drop)
return;



if(
!e.target.closest(".c2p-user") &&
!e.target.closest(".c2p-dropdown")
){

drop.classList.remove("active");

}


});



// =========================
// SUB MENU
// =========================

window.c2pToggle=function(id){


const menu=document.getElementById(id);


if(!menu)
return;



document
.querySelectorAll(".c2p-submenu")
.forEach(item=>{


if(item.id!==id){

item.classList.remove("active");

}


});



menu.classList.toggle("active");


}



// =========================
// CLOSE SIDEBAR WHEN CLICK LINK
// =========================

document
.querySelectorAll(".c2p-submenu a")
.forEach(link=>{


link.addEventListener("click",()=>{

c2pClose();

});


});



// =========================
// LOAD PROFILE NAVBAR
// =========================

async function loadNavbarProfile(){

const usernameBox=document.getElementById("navbarUsername");
const idBox=document.getElementById("navbarId");
const userBox=document.getElementById("navbarUser");
const saldoBox=document.getElementById("navbarSaldo");

const userId=localStorage.getItem("user_id");

if(!userId)return;

try{

const {data,error}=await database.supabase
.from("profiles")
.select("id,username,balance")
.eq("id",userId)
.single();

if(error) throw error;

if(data){

if(usernameBox){
usernameBox.textContent=data.username || "User";
}

if(idBox){
idBox.textContent=data.id;
}

if(userBox){
userBox.textContent="@"+(data.username || "-");
}

if(saldoBox){
saldoBox.textContent=
"Rp "+
Number(data.balance||0).toLocaleString("id-ID");
}

}

}catch(err){

console.error("Navbar Profile Error:",err);

}

}

loadNavbarProfile();
// =========================
// LOGOUT
// =========================

const logoutBtn=
document.getElementById("logoutBtn");



if(logoutBtn){


logoutBtn.addEventListener("click",async()=>{


try{


await database.supabase.auth.signOut();



localStorage.removeItem("user_id");

localStorage.removeItem("username");



window.location.href="login.html";



}catch(err){


console.error(err);


alert(
"Gagal logout"
);


}


});


}



});
