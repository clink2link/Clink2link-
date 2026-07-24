/* =================================
CLICK2PAY NOTIFICATION SYSTEM (PRO)
================================= */

const NOTIF_KEY = "c2p_notif";

/* =========================
INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
renderNotif();
updateBadge();
});

/* =========================
GET DATA
========================= */
function getNotif(){
return JSON.parse(localStorage.getItem(NOTIF_KEY)) || [];
}

/* =========================
SAVE DATA
========================= */
function saveNotif(data){
localStorage.setItem(NOTIF_KEY, JSON.stringify(data));
}

/* =========================
RENDER LIST
========================= */
function renderNotif(){

const list = document.getElementById("notifList");
if(!list) return;

let notifications = getNotif();

list.innerHTML = "";

if(notifications.length === 0){
list.innerHTML = `<div class="notif-empty">Belum ada notifikasi</div>`;
return;
}

// terbaru di atas
notifications = notifications.reverse();

notifications.forEach((n, index) => {

const el = document.createElement("div");
el.className = "notif-item " + (!n.read ? "unread" : "");

el.innerHTML = `
<div class="notif-icon">
<i class="${n.icon}"></i>
</div>

<div class="notif-content">
<div class="notif-title">${n.title}</div>
<div class="notif-desc">${n.desc}</div>
<div class="notif-time">${n.time}</div>
</div>
`;

// klik = tandai read
el.onclick = () => markRead(index);

list.appendChild(el);

});

}

/* =========================
ADD NOTIFICATION (GLOBAL)
========================= */
function addNotification(data){

const notifications = getNotif();

notifications.push({
id: Date.now(),
title: data.title,
desc: data.desc,
icon: data.icon || "fa-solid fa-bell",
time: new Date().toLocaleString(),
read: false
});

saveNotif(notifications);

// update UI realtime
updateBadge();

}

/* =========================
MARK SINGLE READ
========================= */
function markRead(index){

let notifications = getNotif();

// karena sudah di reverse saat render
const realIndex = notifications.length - 1 - index;

notifications[realIndex].read = true;

saveNotif(notifications);
renderNotif();
updateBadge();

}

/* =========================
MARK ALL READ
========================= */
function markAllRead(){

let notifications = getNotif();

notifications = notifications.map(n => ({
...n,
read: true
}));

saveNotif(notifications);
renderNotif();
updateBadge();

}

/* =========================
DELETE NOTIFICATION
========================= */
function deleteNotif(id){

let notifications = getNotif();

notifications = notifications.filter(n => n.id !== id);

saveNotif(notifications);
renderNotif();
updateBadge();

}

/* =========================
BADGE COUNT
========================= */
function getUnreadCount(){

const notifications = getNotif();

return notifications.filter(n => !n.read).length;

}

/* =========================
UPDATE BADGE (NAVBAR)
========================= */
function updateBadge(){

const badge = document.getElementById("notifBadge");
if(!badge) return;

const count = getUnreadCount();

if(count > 0){
badge.innerText = count;
badge.style.display = "inline-block";
}else{
badge.style.display = "none";
}

}

/* =========================
SYNC ANTAR TAB
========================= */
window.addEventListener("storage", () => {
renderNotif();
updateBadge();
});

/* =========================
AUTO DEMO (OPTIONAL)
========================= */
// aktifkan kalau mau demo notif otomatis
/*
setInterval(()=>{
addNotification({
title: "Transaksi Baru",
desc: "Saldo bertambah Rp10.000",
icon: "fa-solid fa-wallet"
});
}, 15000);
*/
