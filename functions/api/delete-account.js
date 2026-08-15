export async function onRequestPost({request,env}){
 try{
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_KEY)return json({success:false,error:"Server not configured"},500);
  const auth=request.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return json({success:false,error:"Unauthorized"},401);
  const token=auth.slice(7);
  const u=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${token}`}});
  const user=await u.json();if(!u.ok||!user.id)return json({success:false,error:"Invalid session"},401);
  const r=await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,{method:"DELETE",headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`}});
  if(!r.ok)return json({success:false,error:"Unable to delete account"},500);
  return json({success:true});
 }catch(e){return json({success:false,error:e.message||"Delete failed"},500)}
}
function json(x,s=200){return new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json"}})}
