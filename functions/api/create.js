// Click2Pay Premium payment creation — server-side only.
// POST /api/premium/create
// Requires a valid Supabase access token.
// Creates a Rp100,000 / 30-day Premium order and a DompetX QRIS payment.
export async function onRequestPost({request, env}) {
  try {
    const supabaseUrl=String(env.SUPABASE_URL||"").trim();
    const serviceKey=String(env.SUPABASE_SERVICE_KEY||"").trim();
    const apiKey=String(env.DOMPETX_API_KEY||"").trim();
    if(!supabaseUrl||!serviceKey||!apiKey) return json({success:false,error:"Payment service is not configured on the server."},500);

    const auth=request.headers.get("Authorization")||"";
    if(!auth.startsWith("Bearer ")) return json({success:false,error:"Unauthorized"},401);
    const token=auth.slice(7).trim();
    const authRes=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:serviceKey,Authorization:`Bearer ${token}`}});
    const authUser=await authRes.json().catch(()=>null);
    if(!authRes.ok||!authUser?.id) return json({success:false,error:"Invalid or expired session."},401);
    const userId=authUser.id;

    const existing=await rest(env,"GET","premium_orders",`?user_id=eq.${encodeURIComponent(userId)}&status=eq.pending&select=*&order=created_at.desc&limit=1`);
    if(existing[0]){
      const o=existing[0];
      if(o.invoice_id && o.payment_id) return json({success:true,existing:true,data:{order_id:o.id,invoice_id:o.invoice_id,payment_id:o.payment_id,amount:Number(o.amount),status:o.status,qrImage:o.qr_url||null}});
    }

    const orderId=crypto.randomUUID();
    const reference=`PREM-${orderId}`;
    const amount=100000;
    const inserted=await rest(env,"POST","premium_orders",null,{
      id:orderId,user_id:userId,amount,plan:"monthly",status:"pending",invoice_id:reference
    });
    if(!inserted?.[0]) throw new Error("Unable to create Premium order.");

    const body={method:"QRIS",amount,currency:"IDR",reference,settlementSpeed:"standard"};
    const bodyText=JSON.stringify(body);
    const timestamp=Math.floor(Date.now()/1000).toString();
    const signature=await hmac(`${timestamp}.${bodyText}`,apiKey);
    const idem=`clp-prem-${orderId}`;

    const payRes=await fetch("https://api.dompetx.com/v1/payments",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "X-DOMPAY-API-Key":apiKey,
        "X-DOMPAY-Signature":signature,
        "X-DOMPAY-Timestamp":timestamp,
        "Idempotency-Key":idem
      },
      body:bodyText
    });
    const pay=await payRes.json().catch(()=>({}));
    if(!payRes.ok){
      await rest(env,"PATCH","premium_orders",`?id=eq.${encodeURIComponent(orderId)}`,{status:"failed",updated_at:new Date().toISOString()});
      return json({success:false,error:pay?.message||pay?.error||pay?.data?.message||"DompetX rejected the payment."},502);
    }
    const data=pay?.data&&typeof pay.data==="object"?pay.data:pay;
    const paymentId=data?.paymentId||data?.payment_id||data?.id||data?.transactionId||data?.transaction_id;
    const qrImage=data?.qrData?.qrImage||data?.qr_data?.qrImage||data?.qrData?.qr_image||data?.qr_data?.qr_image||data?.qrImage||data?.qr_image||data?.qrUrl||data?.qr_url||data?.qrisImage||data?.qris_image||null;
    if(!paymentId) throw new Error("DompetX did not return a payment ID.");
    const expiresAt=data?.expiresAt||data?.expires_at||data?.expiredAt||data?.expired_at||null;

    await rest(env,"PATCH","premium_orders",`?id=eq.${encodeURIComponent(orderId)}`,{
      payment_id:String(paymentId),qr_url:qrImage||null,updated_at:new Date().toISOString()
    });
    return json({success:true,data:{order_id:orderId,invoice_id:reference,payment_id:String(paymentId),amount,qrImage,expiresAt,status:"pending"}});
  } catch(e) {
    console.error("PREMIUM CREATE ERROR",e);
    return json({success:false,error:e?.message||"Unable to create Premium payment."},500);
  }
}
async function rest(env,method,table,query,body){
  const url=`${env.SUPABASE_URL}/rest/v1/${table}${query||""}`;
  const headers={apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,"Content-Type":"application/json"};
  if(method==="POST") headers.Prefer="return=representation";
  const r=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});
  const text=await r.text();const data=text?JSON.parse(text):[];
  if(!r.ok) throw new Error(data?.message||data?.error||"Database request failed");
  return data;
}
async function hmac(message,secret){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
