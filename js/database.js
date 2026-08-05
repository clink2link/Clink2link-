// js/database.js

const SUPABASE_URL="https://lwjtagxkqeprjpupmadf.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anRhZ3hrcWVwcmpwdXBtYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDExNzYsImV4cCI6MjA5OTg3NzE3Nn0.Cg8TIBtOE4PHmnSybJtMqEoCFx-Qm4Kkl8exSOanTes";

const supabaseClient=supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

const API_URL="https://click2pay.my.id";


// ================= USER =================

async function getUser(){
try{
const id=localStorage.getItem("user_id");
if(!id)return null;

const {data,error}=await supabaseClient
.from("users")
.select("*")
.eq("id",id)
.maybeSingle();

if(error){
console.error("GET USER:",error);
return null;
}

return data;

}catch(e){
console.error(e);
return null;
}
}


async function logout(){
localStorage.removeItem("user_id");
location.replace("index.html");
}


async function getUsers(){
const {data,error}=await supabaseClient
.from("users")
.select("*")
.order("created_at",{ascending:false});

if(error){
console.error(error);
return [];
}

return data||[];
}


// ================= PROFILE =================

async function getProfile(userId){

if(!userId)return null;

const {data,error}=await supabaseClient
.from("users")
.select(`
id,
username,
email,
balance,
total_ads,
total_sell,
total_views,
total_clicks,
sell_unlocked,
sell_earning_today,
sell_earning_month,
sell_earning_total,
withdraw_count,
is_admin,
is_banned,
created_at
`)
.eq("id",userId)
.maybeSingle();

if(error){
console.error("PROFILE:",error);
return null;
}

return data;
}


async function getCurrentProfile(){
const id=localStorage.getItem("user_id");
return await getProfile(id);
}


async function getProfiles(){
const {data,error}=await supabaseClient
.from("users")
.select("*");

if(error){
console.error(error);
return [];
}

return data||[];
}


async function updateProfile(payload){

const id=localStorage.getItem("user_id");

if(!id)return null;

const {data,error}=await supabaseClient
.from("users")
.update(payload)
.eq("id",id)
.select()
.single();

if(error){
console.error("UPDATE PROFILE:",error);
throw error;
}

return data;
}


// ================= LINKS =================

async function getLinks(userId){

const {data,error}=await supabaseClient
.from("links")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false});

if(error){
console.error("GET LINKS:",error);
return [];
}

return data||[];
}


async function getLinkByCode(code){

const {data,error}=await supabaseClient
.from("links")
.select("*")
.eq("short_code",code)
.maybeSingle();

if(error){
console.error(error);
return null;
}

return data;
}


async function createLink(payload){

const insert={
user_id:payload.user_id,
type:payload.type||"ads",
link_type:payload.link_type||"ads",
title:payload.title||null,
alias:payload.alias||null,
custom_alias:payload.custom_alias||null,
short_code:payload.short_code,
destination:payload.destination||null,
destination_url:payload.destination_url||null,
campaign:payload.campaign||null,
campaign_name:payload.campaign_name||null,
device:payload.device||"all",
target_device:payload.target_device||"all",
expired:payload.expired||"never",
expired_at:payload.expired_at||null,
price:Number(payload.price||0),
status:payload.status||"active",
views:0,
clicks:0,
earnings:0,
total_views:0,
total_clicks:0,
total_earnings:0,
sold:0,
sales:0
};

const {data,error}=await supabaseClient
.from("links")
.insert(insert)
.select()
.single();

if(error){
console.error("CREATE LINK:",error);
throw error;
}

return data;
}


async function updateLink(id,payload){

const {data,error}=await supabaseClient
.from("links")
.update(payload)
.eq("id",id)
.select()
.single();

if(error){
console.error("UPDATE LINK:",error);
throw error;
}

return data;
}


async function deleteLink(id){

const {error}=await supabaseClient
.from("links")
.delete()
.eq("id",id);

if(error){
console.error(error);
throw error;
}

return true;
}


// ================= SELL FEE =================

function calculateSellPayment(price){
const amount=Number(price||0);
const fee=Math.floor(amount*0.20);
const seller_receive=amount-fee;

return {
fee,
seller_receive
};
}


// ================= SELL ORDERS =================

async function createSellOrder(payload){

const {data,error}=await supabaseClient
.from("sell_orders")
.insert({
link_id:payload.link_id,
buyer_id:payload.buyer_id,
seller_id:payload.seller_id,
price:Number(payload.price||0),
status:payload.status||"pending",
payment_id:payload.payment_id||null,
paid_at:payload.paid_at||null,
fee:Number(payload.fee||0),
seller_receive:Number(payload.seller_receive||0),
expires_at:payload.expires_at||null,
invoice_id:payload.invoice_id||null,
payment_url:payload.payment_url||null,
qris_string:payload.qris_string||null,
balance_processed:false,
quantity:Number(payload.quantity||1),
views:Number(payload.views||0)
})
.select()
.single();

if(error){
console.error("CREATE SELL ORDER:",error);
throw error;
}

return data;
}


async function getSellOrders(userId){

const {data,error}=await supabaseClient
.from("sell_orders")
.select("*")
.eq("seller_id",userId)
.order("created_at",{ascending:false});

if(error){
console.error("GET SELL ORDERS:",error);
return [];
}

return data||[];

}


// ================= PAYMENT API =================

async function createPayment(payload){

const response=await fetch(
`${API_URL}/api/create-payment`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(payload)
}
);

const result=await response.json();

if(!response.ok){
throw new Error(result.error||"Payment gagal");
}

return result.data||result;
}


async function getPaymentStatus(orderId){

const response=await fetch(
`${API_URL}/api/payment-status/${orderId}`
);

const result=await response.json();

if(!response.ok){
throw new Error(result.error||"Status gagal");
}

return result.data||result;
}


async function checkSellPayment(invoice_id){

if(!invoice_id){
throw new Error("Invoice kosong");
}

const response=await fetch(
`${API_URL}/api/check-payment?invoice_id=${encodeURIComponent(invoice_id)}`
);

const result=await response.json();

if(!response.ok){
throw new Error(result.error||"Check gagal");
}

return result.data||result;
}


// ================= WALLET =================

async function getWalletTransactions(userId){

const {data,error}=await supabaseClient
.from("wallet_transactions")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false});

if(error){
console.error("WALLET:",error);
return [];
}

return data||[];
}


async function createWalletTransaction(payload){

const {data,error}=await supabaseClient
.from("wallet_transactions")
.insert({
user_id:payload.user_id,
type:payload.type,
amount:Number(payload.amount||0),
title:payload.title||null,
description:payload.description||null,
status:payload.status||"success"
})
.select()
.single();

if(error){
console.error("CREATE WALLET:",error);
throw error;
}

return data;
}


// ================= WITHDRAW =================

async function getWithdraws(userId=null){

let query=supabaseClient
.from("withdraws")
.select("*")
.order("created_at",{ascending:false});

if(userId){
query=query.eq("user_id",userId);
}

const {data,error}=await query;

if(error){
console.error("WITHDRAW:",error);
return [];
}

return data||[];
}


async function createWithdraw(payload){

const {data,error}=await supabaseClient
.from("withdraws")
.insert({
user_id:payload.user_id,
method:payload.method,
account_number:payload.account_number,
amount:Number(payload.amount||0),
type:payload.type||"withdraw",
fee:Number(payload.fee||0),
status:payload.status||"pending"
})
.select()
.single();

if(error){
console.error("CREATE WITHDRAW:",error);
throw error;
}

return data;
}



// ================= REPORT =================

async function getDashboardReport(){

const {data,error}=await supabaseClient
.from("daily_reports")
.select("*")
.order("report_date",{ascending:false});

if(error){
console.error("REPORT:",error);
return [];
}

return data||[];
}


async function getReports(userId){

const {data,error}=await supabaseClient
.from("daily_reports")
.select("*")
.eq("user_id",userId)
.order("report_date",{ascending:false})
.limit(30);

if(error){
console.error("USER REPORT:",error);
return [];
}

return data||[];
}


// ================= ANNOUNCEMENT =================

async function getAnnouncements(){

const {data,error}=await supabaseClient
.from("announcements")
.select("*")
.order("created_at",{ascending:false});

if(error){
console.error("ANNOUNCEMENT:",error);
return [];
}

return data||[];
}


// ================= CPM MARKET =================

async function getCPMMarket(){

const {data,error}=await supabaseClient
.from("cpm_market")
.select("*")
.order("cpm",{ascending:false});

if(error){
console.error("CPM:",error);
return [];
}

return data||[];
}


// ================= EXPORT =================

window.database={
supabase:supabaseClient,

getUser,
getUsers,
getProfile,
getCurrentProfile,
getProfiles,
updateProfile,
logout,

getLinks,
getLinkByCode,
createLink,
updateLink,
deleteLink,

calculateSellPayment,
createSellOrder,
getSellOrders,

createPayment,
getPaymentStatus,
checkSellPayment,

getWalletTransactions,
createWalletTransaction,

getWithdraws,
createWithdraw,

getDashboardReport,
getReports,

getAnnouncements,
getCPMMarket
};

console.log("DATABASE JS READY",window.database);
