export async function onRequestPost(context){

const {request,env}=context;

console.log("CREATE SELL ORDER START");

console.log("ENV CHECK",{
SUPABASE_URL:env.SUPABASE_URL,
HAS_KEY:!!env.SUPABASE_SERVICE_KEY,
MARKET_FEE:env.MARKET_FEE
});

try{
