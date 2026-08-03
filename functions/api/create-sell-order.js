export async function onRequestPost(){

return new Response(
JSON.stringify({
success:true,
message:"CREATE SELL ORDER OK"
}),
{
headers:{
"Content-Type":"application/json"
}
}
);

}
