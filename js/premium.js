"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const db=window.database;if(!db)return;const u=await db.getUser();if(!u){location.href="login.html";return}
 const active=()=>!!u.is_premium&&(!u.premium_expires_at||new Date(u.premium_expires_at).getTime()>Date.now());
 const status=document.getElementById("premiumStatus"),btn=document.getElementById("buyPremium"),qr=document.getElementById("qrBox");
 const render=()=>{if(active()){status.textContent="Premium active until "+new Date(u.premium_expires_at).toLocaleDateString();btn.disabled=true;btn.textContent="Premium Active"}else status.textContent="Rp 100,000 / 30 days"};
 render();
 btn.onclick=async()=>{
   btn.disabled=true;btn.textContent="Processing...";
   try{
    const {data:{session}}=await db.supabase.auth.getSession();if(!session)throw new Error("Please login again.");
    const r=await fetch("/api/premium/create",{method:"POST",headers:{Authorization:"Bearer "+session.access_token}});
    const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||"Unable to create payment");
    if(d.data?.qrImage)qr.innerHTML=`<img src="${d.data.qrImage}" alt="QRIS" style="width:260px;max-width:100%;border-radius:16px;border:1px solid var(--c2p-border)"><p class="c2p-muted">Scan this QRIS and wait for confirmation.</p>`;
    C2P.toast("Payment created. Complete the QRIS payment.","success");
    poll(d.data.order_id);
   }catch(e){C2P.toast(e.message,"error");btn.disabled=false;btn.textContent="Upgrade Premium"}
 };
 async function poll(id){for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,5000));const {data}=await db.supabase.from("premium_orders").select("status,expires_at").eq("id",id).maybeSingle();if(data?.status==="paid"){u.is_premium=true;u.premium_expires_at=data.expires_at;render();C2P.toast("Premium activated!","success");return}}btn.disabled=false;btn.textContent="Upgrade Premium"}
});