export async function onRequestPost(context){

const {request,env}=context;

console.log("STEP 1 FUNCTION START");


try{

console.log("STEP 2 READ BODY");

const body=await request.json();

console.log("STEP 3 BODY",body);


const {
link_id,
seller_id,
price
}=body;


console.log("STEP 4 ENV",{
url:env.SUPABASE_URL,
key:!!env.SUPABASE_SERVICE_KEY,
fee:env.MARKET_FEE
});


return new Response(
JSON.stringify({
success:true,
message:"FUNCTION OK",
body
}),
{
headers:{
"Content-Type":"application/json"
}
}
);


}catch(error){

console.log("FUNCTION ERROR",error);


return new Response(
JSON.stringify({
success:false,
error:error.message
}),
{
status:500,
headers:{
"Content-Type":"application/json"
}
}
);

}

}
