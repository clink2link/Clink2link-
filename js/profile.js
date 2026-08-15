"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const db=window.database;if(!db)return;
 const user=await db.getUser();if(!user){location.href="login.html";return}
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??"-"};
 set("profileUsername",user.username||"-");set("profileEmail",user.email||"-");
 set("profileId",user.id?user.id.slice(0,8)+"…":"-");
 document.getElementById("addAccountBtn")?.addEventListener("click",async()=>{await db.logout();location.href="login.html?mode=add"});
 document.getElementById("switchAccountBtn")?.addEventListener("click",async()=>{await db.logout();location.href="login.html?mode=switch"});
 document.getElementById("deleteAccountBtn")?.addEventListener("click",async()=>{
   if(!confirm("Delete this account permanently?"))return;
   const {data:{session}}=await db.supabase.auth.getSession();if(!session)return C2P.toast("Session expired","error");
   const r=await fetch("/api/delete-account",{method:"POST",headers:{Authorization:"Bearer "+session.access_token}});
   const d=await r.json().catch(()=>({}));if(!r.ok||!d.success)return C2P.toast(d.error||"Delete failed","error");
   await db.supabase.auth.signOut();location.href="index.html";
 });
});