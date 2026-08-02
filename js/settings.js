/* =========================
CLICK2PAY SETTINGS LOGIC
========================= */

document.addEventListener("DOMContentLoaded",async()=>{
await loadUser();
initTheme();
});


/* LOAD USER */
async function loadUser(){

try{

if(!window.database){
console.error("DATABASE BELUM READY");
return;
}

const user=await window.database.getUser();

if(!user){
location.href="login.html";
return;
}

const email=document.getElementById("userEmail");
const id=document.getElementById("userId");

if(email){
email.textContent=user.email||"-";
}

if(id){
id.textContent=user.id?user.id.substring(0,8)+"...":"-";
}

}catch(err){

console.error("LOAD USER ERROR:",err);
showToast("Gagal mengambil data akun");

}

}


/* THEME */
function initTheme(){

const toggle=document.getElementById("themeToggle");

if(!toggle)return;

toggle.checked=document.documentElement.classList.contains("dark");

toggle.addEventListener("change",()=>{

if(toggle.checked){

document.documentElement.classList.add("dark");
localStorage.setItem("theme","dark");
showToast("Dark mode aktif 🌙");

}else{

document.documentElement.classList.remove("dark");
localStorage.setItem("theme","light");
showToast("Light mode aktif ☀️");

}

});

}


/* PASSWORD */
function changePassword(){

showToast("Fitur ganti password sedang dipersiapkan");

}


/* ADD ACCOUNT */
function addAccount(e){

if(e)e.preventDefault();

showToast("Add Account sedang dalam pemrosesan");

}


/* LOGOUT */
async function logout(e){

if(e)e.preventDefault();

if(!confirm("Yakin ingin logout?"))return;

try{

await window.database.logout();

}catch(err){

console.error("LOGOUT ERROR:",err);
showToast("Gagal logout");

}

}


/* TOAST */
function showToast(message){

const old=document.querySelector(".c2p-toast");

if(old)old.remove();

const toast=document.createElement("div");

toast.className="c2p-toast";
toast.innerText=message;

document.body.appendChild(toast);

setTimeout(()=>{
toast.classList.add("show");
},50);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{
toast.remove();
},300);

},2500);

}
