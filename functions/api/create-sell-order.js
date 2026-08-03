export async function onRequestPost(){

return new Response(
JSON.stringify({
success:true,
message:"CREATE SELL ORDER FUNCTION HIDUP"
}),
{
headers:{
"Content-Type":"application/json"
}
}
);

}
