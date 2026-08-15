(async()=>{
 const code=new URLSearchParams(location.search).get("code");if(!code){document.body.innerHTML="<h2>Link not found.</h2>";return}
 const link=await database.getLinkByCode(code);if(!link){document.body.innerHTML="<h2>404 - Link not found.</h2>";return}
 if(link.status!=="active"){document.body.innerHTML="<h2>Link is inactive.</h2>";return}
 sessionStorage.setItem("link_id",link.id);sessionStorage.setItem("short_code",link.short_code);
 const type=String(link.type||link.link_type||"").toLowerCase();
 if(type==="ads"){
   try{
     const u=await database.getUser();
     const premium=!!u?.is_premium&&(!u.premium_expires_at||new Date(u.premium_expires_at).getTime()>Date.now());
     if(premium){location.replace(link.destination_url||link.destination);return}
   }catch(_){}
   location.replace(`task1.html?id=${encodeURIComponent(link.id)}`);return;
 }
 if(type==="sell"){location.replace(`buy/index.html?code=${encodeURIComponent(link.short_code)}`);return}
 document.body.innerHTML="<h2>Unsupported link type.</h2>";
})();