// POST /api/ads/view
// Server-side Ads Link view + earning processor.
// Body: { link_id }
// Anonymous viewers are supported. A valid view is limited to one per
// link + visitor fingerprint window to reduce automated duplicate earnings.
export async function onRequestPost({request,env}){
 try{
  const supabaseUrl=String(env.SUPABASE_URL||"").trim(), key=String(env.SUPABASE_SERVICE_KEY||"").trim();
  if(!supabaseUrl||!key)return json({success:false,error:"Server is not configured."},500);
  const body=await request.json().catch(()=>({}));
  const linkId=String(body?.link_id||"").trim();
  if(!/^[0-9a-f-]{36}$/i.test(linkId))return json({success:false,error:"Invalid link_id."},400);

  const links=await rest(env,"GET","links",`?id=eq.${encodeURIComponent(linkId)}&select=id,user_id,status,type,link_type,destination_url,destination`);
  const link=links[0];
  if(!link)return json({success:false,error:"Link not found."},404);
  if(String(link.status||"").toLowerCase()!=="active")return json({success:false,error:"Link is inactive."},410);
  const type=String(link.link_type||link.type||"").toLowerCase();
  if(type!=="ads")return json({success:false,error:"This is not an Ads Link."},400);

  const ip=request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()||"";
  const ua=request.headers.get("User-Agent")||"";
  const fingerprint=await sha256(`${ip}|${ua}`);
  // A 15-minute duplicate window is enough to stop refresh-spam without
  // blocking legitimate repeat visits later.
  const since=new Date(Date.now()-24*60*60*1000).toISOString();
  const duplicate=await rest(env,"GET","link_views",`?link_id=eq.${encodeURIComponent(linkId)}&created_at=gte.${encodeURIComponent(since)}&visitor_ip=eq.${encodeURIComponent(fingerprint)}&is_valid=eq.true&select=id&limit=1`);
  if(duplicate.length)return json({success:false,duplicate:true,error:"This view was already counted recently."},429);

  // The RPC calculates CPM and credits the owner atomically.
  const rpc=await fetch(`${supabaseUrl}/rest/v1/rpc/process_ads_view`,{
    method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({p_link_id:linkId,p_earning:0})
  });
  const result=await rpc.json().catch(()=>null);
  if(!rpc.ok||!result?.success)return json({success:false,error:result?.error||"Unable to record the view."},502);

  // Store only a one-way fingerprint, not the raw visitor IP.
  const latest=await rest(env,"GET","link_views",`?link_id=eq.${encodeURIComponent(linkId)}&is_valid=eq.true&select=id&order=created_at.desc&limit=1`).catch(()=>[]);
  if(latest[0]?.id) await rest(env,"PATCH","link_views",`?id=eq.${encodeURIComponent(latest[0].id)}`,{visitor_ip:fingerprint,device:ua.slice(0,250),is_valid:true}).catch(()=>{});
  return json({success:true,earning:Number(result.earning||0),cpm:Number(result.cpm||0),destination:link.destination_url||link.destination});
 }catch(e){console.error("ADS VIEW ERROR",e);return json({success:false,error:e?.message||"Unable to record view."},500)}
}
async function rest(env,method,table,query,body){
 const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${table}${query||""}`,{method,headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,"Content-Type":"application/json",...(method==="POST"?{Prefer:"return=representation"}:{})},body:body?JSON.stringify(body):undefined});
 const text=await r.text();let data=text?JSON.parse(text):[];if(!r.ok)throw new Error(data?.message||data?.error||"Database request failed");return data;
}
async function sha256(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
