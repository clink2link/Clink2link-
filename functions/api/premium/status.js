// GET /api/premium/status?order_id=UUID
// Verifies the DompetX status and activates Premium through the database RPC.
export async function onRequestGet({request,env}){
  try{
    const supabaseUrl=String(env.SUPABASE_URL||"").trim(), serviceKey=String(env.SUPABASE_SERVICE_KEY||"").trim(), apiKey=String(env.DOMPETX_API_KEY||"").trim();
    if(!supabaseUrl||!serviceKey||!apiKey)return json({success:false,error:"Payment service is not configured."},500);
    const auth=request.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return json({success:false,error:"Unauthorized"},401);
    const token=auth.slice(7);
    const au=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:serviceKey,Authorization:`Bearer ${token}`}});
    const user=await au.json().catch(()=>null);if(!au.ok||!user?.id)return json({success:false,error:"Invalid session."},401);
    const id=new URL(request.url).searchParams.get("order_id");if(!id)return json({success:false,error:"order_id is required."},400);
    const orders=await rest(env,"GET","premium_orders",`?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&select=*`);
    const order=orders[0];if(!order)return json({success:false,error:"Premium order not found."},404);
    if(order.status==="paid")return json({success:true,paid:true,expires_at:order.expires_at,status:"paid"});
    if(!order.payment_id && !order.invoice_id)return json({success:true,paid:false,status:order.status});
    const reference=order.invoice_id||`PREM-${order.id}`;
    const paymentId=order.payment_id;
    const timestamp=Math.floor(Date.now()/1000).toString();
    const signature=await hmac(`${timestamp}.{}`,apiKey);
    const url=paymentId
      ? `https://api.dompetx.com/v1/payments/check-status/${encodeURIComponent(paymentId)}`
      : `https://api.dompetx.com/v1/payments/check-status?reference=${encodeURIComponent(reference)}`;
    const r=await fetch(url,{headers:{"Content-Type":"application/json","X-DOMPAY-API-Key":apiKey,"X-DOMPAY-Signature":signature,"X-DOMPAY-Timestamp":timestamp}});
    const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data={}};
    const payload=data?.data&&typeof data.data==="object"?data.data:data;
    const status=String(payload?.status||payload?.payment_status||payload?.paymentStatus||"").toLowerCase();
    const paid=["paid","success","successful","completed","complete","settlement","settled","berhasil"].includes(status);
    if(!paid)return json({success:true,paid:false,status:status||"pending"});
    const amount=Number(payload?.amount??payload?.gross_amount??payload?.total_amount??order.amount);
    if(amount!==Number(order.amount))return json({success:false,error:"Payment amount mismatch."},400);
    const rpc=await fetch(`${supabaseUrl}/rest/v1/rpc/process_premium_payment`,{method:"POST",headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},body:JSON.stringify({p_order_id:order.id})});
    const result=await rpc.json().catch(()=>({}));if(!rpc.ok||result?.success===false)throw new Error(result?.error||"Premium activation failed.");
    await rest(env,"PATCH","premium_orders",`?id=eq.${encodeURIComponent(order.id)}`,{status:"paid",paid_at:new Date().toISOString(),updated_at:new Date().toISOString()});
    return json({success:true,paid:true,status:"paid",expires_at:result.expires_at||null});
  }catch(e){console.error("PREMIUM STATUS ERROR",e);return json({success:false,error:e?.message||"Unable to verify payment."},500)}
}
async function rest(env,method,table,query,body){
 const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${table}${query||""}`,{method,headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,"Content-Type":"application/json",...(method==="POST"?{Prefer:"return=representation"}:{})},body:body?JSON.stringify(body):undefined});
 const text=await r.text();let data=text?JSON.parse(text):[];if(!r.ok)throw new Error(data?.message||data?.error||"Database request failed");return data;
}
async function hmac(message,secret){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
