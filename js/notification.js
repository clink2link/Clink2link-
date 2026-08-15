"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const db=window.database;if(!db)return;const user=await db.getUser();if(!user){location.href="login.html";return}
 const box=document.getElementById("notificationList")||document.getElementById("notifList");if(!box)return;
 const {data,error}=await db.supabase.from("notifications").select("id,title,message,is_read,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
 if(error){box.innerHTML='<div class="c2p-card" style="padding:25px">Unable to load notifications.</div>';return}
 box.innerHTML=data?.length?data.map(n=>`<article class="notification-card ${n.is_read?'read':'unread'}" data-id="${n.id}" style="padding:18px;margin:10px 0;cursor:pointer"><strong>${esc(n.title||"Notification")}</strong><p>${esc(n.message||"")}</p><time class="c2p-muted">${new Date(n.created_at).toLocaleString()}</time></article>`).join(""):'<div class="c2p-card" style="padding:25px">No notifications yet.</div>';
 box.querySelectorAll("[data-id]").forEach(e=>e.onclick=async()=>{await db.supabase.from("notifications").update({is_read:true}).eq("id",e.dataset.id).eq("user_id",user.id);e.classList.add("read")});
});
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
