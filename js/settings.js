/* =========================
CLICK2PAY SETTINGS LOGIC
========================= */

// INIT
document.addEventListener("DOMContentLoaded", async () => {
loadUser();
initTheme();
});

/* =========================
LOAD USER DATA
========================= */
function loadUser(){

// sementara ambil dari localStorage
const user = JSON.parse(localStorage.getItem("c2p_user")) || {};

document.getElementById("userEmail").innerText = user.email || "user@mail.com";
document.getElementById("userId").innerText = user.id || "USR-" + randomId();

}

/* =========================
THEME TOGGLE
========================= */
function initTheme(){

const toggle = document.getElementById("themeToggle");

// set awal
if(localStorage.getItem("theme")==="dark"){
toggle.checked = true;
}

// event
toggle.addEventListener("change", () => {

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

/* =========================
CHANGE PASSWORD (UI ONLY)
========================= */
function changePassword(){

const newPass = prompt("Masukkan password baru:");

if(!newPass){
showToast("Batal ganti password");
return;
}

if(newPass.length < 6){
showToast("Password minimal 6 karakter");
return;
}

// dummy save
showToast("Password berhasil diganti (dummy)");

}

/* =========================
LOGOUT
========================= */
function logout(){

const confirmLogout = confirm("Yakin mau logout?");

if(!confirmLogout) return;

// hapus data local
localStorage.removeItem("c2p_user");

// redirect
window.location.href = "login.html";

}

/* =========================
HELPER
========================= */
function randomId(){
return Math.random().toString(36).substr(2,6).toUpperCase();
}

/* =========================
TOAST NOTIFICATION
========================= */
function showToast(message){

let toast = document.createElement("div");
toast.className = "c2p-toast";
toast.innerText = message;

document.body.appendChild(toast);

setTimeout(()=>{
toast.classList.add("show");
},100);

setTimeout(()=>{
toast.classList.remove("show");
setTimeout(()=>toast.remove(),300);
},2500);

}
