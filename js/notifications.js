
"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabaseClient) return;
  const box=document.getElementById("notificationList");
  if(!box) return;
  const {data,error}=await supabaseClient.from("notifications")
    .select("id,title,message,is_read,created_at")
    .order("created_at",{ascending:false});
  if(error){ box.innerHTML='<div class="empty-state">Unable to load notifications.</div>'; return; }
  if(!data?.length){ box.innerHTML='<div class="empty-state">No notifications yet.</div>'; return; }
  box.innerHTML=data.map(n=>`
    <article class="notification-card ${n.is_read?'read':'unread'}" data-id="${n.id}">
      <div><strong>${escapeHtml(n.title||"Notification")}</strong><p>${escapeHtml(n.message||"")}</p></div>
      <time>${new Date(n.created_at).toLocaleString()}</time>
    </article>`).join("");
  box.querySelectorAll(".notification-card").forEach(card=>{
    card.addEventListener("click",async()=>{
      const id=card.dataset.id;
      await supabaseClient.from("notifications").update({is_read:true}).eq("id",id);
      card.classList.add("read");
    });
  });
});
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
