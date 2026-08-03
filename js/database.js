// js/database.js

// ===============================
// SUPABASE CONFIG
// ===============================

const SUPABASE_URL="https://lwjtagxkqeprjpupmadf.supabase.co";

const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anRhZ3hrcWVwcmpwdXBtYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDExNzYsImV4cCI6MjA5OTg3NzE3Nn0.Cg8TIBtOE4PHmnSybJtMqEoCFx-Qm4Kkl8exSOanTes";


const supabaseClient=supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);


// ===============================
// AUTH USER TABLE
// ===============================

async function getUser(){
try{
const userId=localStorage.getItem("user_id");
if(!userId){
return null;
}
const {data,error}=await supabaseClient
.from("users")
.select("*")
.eq("id",userId)
.maybeSingle();
if(error){
console.error("GET USER ERROR:",error);
return null;
}
return data;
}catch(err){
console.error("AUTH ERROR:",err);
return null;
}
}



async function logout(){


    localStorage.removeItem(
        "user_id"
    );


    console.log(
        "LOGOUT SUCCESS"
    );


    location.replace(
        "index.html"
    );


}


// ===============================
// PASSWORD
// ===============================

async function verifyPassword(password,hash){

if(typeof bcrypt==="undefined"){
throw new Error("bcrypt belum dimuat");
}

return bcrypt.compareSync(
password,
hash
);

}

// ===============================
// USERS
// ===============================

async function getUsers(){

const {data,error}=await supabaseClient
.from("users")
.select("*")
.order("created_at",{ascending:false});

if(error){
console.error("GET USERS ERROR:",error);
return [];
}

return data || [];

}

// ===============================
// PROFILE
// ===============================

async function getProfile(userId){

const {data,error}=await supabaseClient
.from("profiles")
.select("*")
.eq("id",userId)
.maybeSingle();
if(error){
console.error(
"GET PROFILE ERROR:",
error
);
return null;
}
if(!data){
const {data:newProfile,error:createError}=await supabaseClient
.from("profiles")
.insert({
id:userId,

balance:0,

ads_earning_today:0,
ads_earning_month:0,
ads_earning_total:0,

sell_earning_today:0,
sell_earning_month:0,
sell_earning_total:0,

total_views:0,
total_clicks:0,

withdraw_count:0,

sell_link_enabled:false,

status:"active"
})
.select()
.single();
if(createError){
console.error(
"CREATE PROFILE ERROR:",
createError
);
return null;
}
return newProfile;
}
return data;
}


async function updateProfile(payload){
const userId=localStorage.getItem("user_id");
if(!userId)return null;
const {data,error}=await supabaseClient
.from("profiles")
.update({
username:payload.username
})
.eq("id",userId)
.select()
.single();
if(error){
console.error("UPDATE PROFILE ERROR:",error);
throw error;
}
return data;
}

async function getCurrentProfile(){
const userId=localStorage.getItem("user_id");
if(!userId){
return null;
}
return await getProfile(userId);
}
async function getProfiles(){
const {data,error}=await supabaseClient
.from("profiles")
.select("*");
if(error){
console.error("GET PROFILES ERROR:",error);
return [];
}
return data || [];
}

// ===============================
// SELL FEE SYSTEM
// ===============================

function calculateSellPayment(price){

    const amount = Number(price || 0);

    const fee = Math.floor(
        amount * 0.20
    );

    const seller_receive =
        amount - fee;


    return {
        fee,
        seller_receive
    };

}


// ===============================
// LINKS
// ===============================


async function getLinks(userId){


const {
data,
error
}=await supabaseClient

.from("links")

.select(`
id,
user_id,
type,
link_type,
title,
short_code,
destination,
destination_url,
price,
status,
views,
clicks,
earnings,
total_views,
total_clicks,
total_earnings,
sold,
alias,
campaign,
expired,
device,
created_at
`)

.eq(
"user_id",
userId
)

.order(
"created_at",
{
ascending:false
}
);



if(error){

console.error(
"GET LINKS ERROR:",
error
);

throw error;

}


return data || [];


}




async function createLink(payload){


const {
data,
error
}=await supabaseClient

.from("links")

.insert({

user_id:payload.user_id,

type:payload.type || "ads",

link_type:payload.link_type || "ads",

title:payload.title,

destination:payload.destination,

destination_url:payload.destination_url,

price:payload.price || 0,

short_code:payload.short_code,

status:payload.status || "active",

alias:
payload.alias || null,

campaign:
payload.campaign || null,

expired:
payload.expired || "never",

device:
payload.device || "all",

views:0,
clicks:0,
earnings:0,

total_views:0,
total_clicks:0,
total_earnings:0,

sold:0,
sales:0

})

.select()

.single();



if(error){

console.error(
"CREATE LINK ERROR:",
error
);

throw error;

}


return data;


}




async function updateLink(id,payload){


const {
data,
error
}=await supabaseClient

.from("links")

.update({

title:payload.title,

destination:payload.destination,

destination_url:
payload.destination_url || payload.destination,

price:payload.price || 0

})

.eq(
"id",
id
)

.select()

.single();



if(error){

console.error(
"UPDATE LINK ERROR:",
error
);

throw error;

}


return data;


}




async function deleteLink(id){


const {
error
}=await supabaseClient
.from("links")
.delete()
.eq(
"id",
id
);

if(error){

console.error(
"DELETE LINK ERROR:",
error
);

throw error;
}

return true;
}

async function getLinkByCode(shortCode){

const {data,error}=await supabaseClient
.from("links")
.select("*")
.eq("short_code",shortCode)
.single();

if(error){
console.error("GET LINK BY CODE ERROR:",error);
return null;
}

return data;

}

// ===============================
// SHORTLINKS
// ===============================

async function getShortlinks(){

const {data,error}=await supabaseClient
.from("shortlinks")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


// ===============================
// CLICKS
// ===============================

async function getClicks(){

const {data,error}=await supabaseClient
.from("clicks")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


// ===============================
// TRANSACTIONS
// ===============================

async function getTransactions(){

const {data,error}=await supabaseClient
.from("transactions")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


// ===============================
// WITHDRAWALS
// ===============================

async function getWithdrawals(){

const {data,error}=await supabaseClient
.from("withdrawals")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


async function getWithdraws(){

const {data,error}=await supabaseClient
.from("withdraws")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


// ===============================
// ANNOUNCEMENTS
// ===============================

async function getAnnouncements(){

const {data,error}=await supabaseClient
.from("announcements")
.select("*")
.order("id",{ascending:false});


if(error){
console.error(error);
return [];
}

return data;

}


// ===============================
// REPORT
// ===============================

async function getDashboardReport(){
const {data,error}=await supabaseClient
.from("daily_reports")
.select("*")
.order("report_date",{ascending:false});

if(error){
console.error("Dashboard Report Error:",error);
return [];
}

return data || [];
}


async function getReports(userId){

const {data,error}=await supabaseClient
.from("daily_reports")
.select("*")
.eq("user_id",userId)
.order("report_date",{ascending:false})
.limit(30);

if(error){
console.error("REPORT ERROR:",error);
return [];
}

return data ? data.reverse() : [];

}

// ===============================
// CPM MARKET
// ===============================

async function getCPMMarket(){

const {
data,
error
}=await supabaseClient

.from("cpm_market")

.select("*")

.order(
"cpm",
{
ascending:false
}
);


if(error){

console.error(
"GET CPM MARKET ERROR:",
error
);

return [];

}


return data || [];

}


// ===============================
// MENUS (WAJIB TAMBAH INI)
// ===============================

async function getMenusByRole(role){

    const {
        data,
        error
    } = await supabaseClient
        .from("menus")
        .select("*")
        .eq("role", role)
        .order("id", {
            ascending:true
        });


    if(error){

        console.error(
            "MENU ERROR:",
            error
        );

        throw error;

    }


    return data || [];

}


// ===============================
// SELL ORDERS PAGES FUNCTION API
// ===============================

const API_URL="https://click2pay.my.id";


// ===============================
// CREATE SELL ORDER
// ===============================

async function createSellOrder(payload){

try{

console.log(
"CREATE ORDER PAYLOAD",
payload
);


const response = await fetch(
"https://click2pay.my.id/api/create-sell-order",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(payload)
}
);


const text = await response.text();


console.log(
"STATUS:",
response.status
);


console.log(
"RAW RESPONSE:",
text
);



let result;

try{

result=JSON.parse(text);

}catch(e){

throw new Error(
"SERVER BUKAN JSON:\n"+text.substring(0,200)
);

}



if(!response.ok){

throw new Error(
result.error || "REQUEST ERROR"
);

}


return result.data || result;



}catch(err){

console.error(
"CREATE SELL ORDER ERROR:",
err
);

throw err;

}

}

// ===============================
// CREATE PAYMENT
// ===============================

async function createPayment(payload){


const response=
await fetch(

`${API_URL}/api/create-payment`,

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:
JSON.stringify(payload)

}

);


const result=
await response.json();


if(!response.ok || !result.success){

throw new Error(
result.error||"PAYMENT GAGAL"
);

}


return result.data;

}

// ===============================
// GET SELL ORDERS
// ===============================

async function getSellOrders(userId){

const {
data,
error
}
=
await supabaseClient

.from("sell_orders")

.select("*")

.eq(
"seller_id",
userId
)

.order(
"created_at",
{
ascending:false
}
);



if(error){

console.error(
"GET SELL ORDERS ERROR:",
error
);

return [];

}


return data||[];

}

// ===============================
// EXPORT
// ===============================

window.database={

supabase:supabaseClient,

verifyPassword,

getUser,
logout,

getUsers,

getProfile,
getCurrentProfile,
getProfiles,
updateProfile,

getMenusByRole,

getLinks,
getLinkByCode,
createLink,
updateLink,
deleteLink,

createSellOrder,
createPayment,
getSellOrders,

getShortlinks,

getClicks,
calculateSellPayment,

getTransactions,

getWithdrawals,
getWithdraws,

getAnnouncements,

getDashboardReport,
getReports,

getCPMMarket

};


console.log("DATABASE JS READY",window.database);
