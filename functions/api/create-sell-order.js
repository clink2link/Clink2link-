export async function onRequestPost(context){

const {request,env}=context;

try{

console.log("CREATE SELL ORDER START");


let body;

try{

body=await request.json();

console.log("BODY:",body);

}catch(e){

throw new Error(
"JSON BODY ERROR: "+e.message
);

}


return new Response(
JSON.stringify({

success:true,

message:"CREATE SELL ORDER FUNCTION OK",

body:body,

env:{
supabase:!!env.SUPABASE_URL,
key:!!env.SUPABASE_SERVICE_KEY,
fee:env.MARKET_FEE||null
}

}),
{
status:200,
headers:{
"Content-Type":"application/json"
}
}
);


}catch(error){


console.log(
"FUNCTION ERROR:",
error
);


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
