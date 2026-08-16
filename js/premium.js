"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const db=window.database;if(!db)return;
 const user=await db.getUser().catch(()=>null);if(!user){location.href="login.html";return}
 const statusEl=document.getElementById("premiumStatus"),btn=document.getElementById("buyPremium"),qr=document.getElementById("qrBox");
 const active=()=>!!user.is_premium&&(!user.premium_expires_at||new Date(user.premium_expires_at).getTime()>Date.now());
 function render(){if(active()){statusEl.textContent=`Premium active until ${new Date(user.premium_expires_at).toLocaleDateString()}`;btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-circle-check"></i> Premium active';}else{statusEl.textContent="Rp 100,000 / 30 days";btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-bolt"></i> Upgrade Premium';}}
 async function session(){const {data}=await db.supabase.auth.getSession();if(!data?.session)throw new Error("Please log in again.");return data.session}
 async function verify(orderId){
   const s=await session(); const r=await fetch(`/api/premium/status?order_id=${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${s.access_token}`}});
   const d=await r.json().catch(()=>({})); if(!r.ok||d.success===false)throw new Error(d.error||"Unable to verify payment.");
   if(d.paid){user.is_premium=true;user.premium_expires_at=d.expires_at;render();qr.innerHTML='<div class="c2p-badge"><i class="fa-solid fa-check"></i> Payment confirmed</div>';C2P.toast("Premium activated successfully.","success");return true}
   return false;
 }
 btn.onclick=async()=>{
   btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creating payment...';
   try{
     const s=await session(); const r=await fetch("/api/premium/create",{method:"POST",headers:{Authorization:`Bearer ${s.access_token}`,"Content-Type":"application/json"}});
     const d=await r.json().catch(()=>({}));if(!r.ok||!d.success)throw new Error(d.error||"Unable to create payment.");
     const x=d.data||{};if(x.qrImage)qr.innerHTML=`<div style="text-align:center;margin-top:18px"><img src="${x.qrImage}" alt="QRIS payment" style="width:280px;max-width:100%;border-radius:18px;border:1px solid var(--pro-border)"><p class="c2p-muted">Scan the QRIS and keep this page open while payment is verified.</p></div>`;
     C2P.toast("QRIS payment created.","success");
     for(let i=0;i<72;i++){await new Promise(r=>setTimeout(r,5000));if(await verify(x.order_id))return}
     throw new Error("Payment verification timed out. You can reopen this page and verify again.");
   }catch(e){C2P.toast(e.message||"Payment failed.","error");render()}
 };
 render();
});