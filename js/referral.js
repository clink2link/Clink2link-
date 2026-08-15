"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const db=window.database;if(!db)return;const u=await db.getUser();if(!u){location.href="login.html";return}
 let code=u.ref_code;
 if(!code){code="C2P"+crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase();await db.supabase.from("users").update({ref_code:code}).eq("id",u.id);u.ref_code=code}
 const link=`${location.origin}/register.html?ref=${encodeURIComponent(code)}`;
 const c=document.getElementById("refCode"),l=document.getElementById("refLink");if(c)c.value=code;if(l)l.textContent=link;
 window.copyReferral=async()=>{await navigator.clipboard?.writeText(link);C2P.toast("Referral link copied","success")};
 const {data,error}=await db.supabase.from("referrals").select("id,referred_email,bonus,created_at").eq("referrer_id",u.id).order("created_at",{ascending:false});
 const rows=data||[], total=rows.reduce((a,x)=>a+Number(x.bonus||0),0);
 document.getElementById("totalRef")?.replaceChildren(document.createTextNode(rows.length));
 document.getElementById("totalBonus")?.replaceChildren(document.createTextNode(new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(total)));
 const box=document.getElementById("refList");if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>`<div class="link-card" style="padding:18px;margin:10px 0"><strong>${esc(x.referred_email||"User")}</strong><div class="c2p-muted">${new Date(x.created_at).toLocaleDateString()} · +Rp ${Number(x.bonus||0).toLocaleString("id-ID")}</div></div>`).join(""):'<div class="c2p-card" style="padding:25px">No referrals yet</div>';
});
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
