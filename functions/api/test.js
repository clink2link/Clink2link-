export function onRequest(){

return new Response(
JSON.stringify({
success:true,
message:"FUNCTION ACTIVE"
}),
{
headers:{
"Content-Type":"application/json"
}
}
);

}
