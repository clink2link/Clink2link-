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


        const userId =
        localStorage.getItem("user_id");



        if(!userId){

            console.log(
                "USER ID TIDAK ADA"
            );

            return null;

        }



        const {
            data,
            error
        } = await supabaseClient

        .from("users")

        .select("*")

        .eq(
            "id",
            userId
        )

        .single();



        if(error){

            console.error(
                "GET USER ERROR:",
                error
            );

            return null;

        }



        return data;



    }catch(err){


        console.error(
            "AUTH ERROR:",
            err
        );


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
.order("id",{ascending:false});


if(error){
console.error("Get Users Error:",error);
return [];
}

return data;

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
console.error("Get Profile Error:",error);
return null;
}

return data;

}



async function getProfiles(){

const {data,error}=await supabaseClient
.from("profiles")
.select("*");


if(error){
console.error("Get Profiles Error:",error);
return [];
}

return data;

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
title,
short_code,
destination,
destination_url,
status,
total_views,
total_clicks,
total_earnings,
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

title:payload.title,

destination:payload.destination,

destination_url:payload.destination_url,

short_code:payload.short_code,

status:"active",

total_views:0,

total_clicks:0,

total_earnings:0,

link_type:"ads"

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
payload.destination_url || payload.destination

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

// ===============================
// SHORTLINKS
// ===============================

async function getShortlinks(){

const {data,error}=await supabaseClient
.from("shortlinks")
.select("*")
.order("id",{ascending:false});


if(error) throw error;

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


if(error) throw error;

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


if(error) throw error;

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


if(error) throw error;

return data;

}


async function getWithdraws(){

const {data,error}=await supabaseClient
.from("withdraws")
.select("*")
.order("id",{ascending:false});


if(error) throw error;

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


if(error) throw error;

return data;

}


// ===============================
// REPORT
// ===============================

async function getDashboardReport(){

const {data,error}=await supabaseClient
.from("dashboard_daily_report")
.select("*")
.order("report_date",{ascending:false});


if(error) throw error;

return data;

}



async function getReports(userId){

const {data,error}=await supabaseClient
.from("dashboard_daily_report")
.select("*")
.eq("user_id",userId)
.order("report_date",{ascending:true});


if(error){
console.error("Report Error:",error);
return [];
}

return data;

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
getProfiles,

getLinks,
createLink,
updateLink,
deleteLink,

getShortlinks,

getClicks,

getTransactions,

getWithdrawals,
getWithdraws,

getAnnouncements,

getDashboardReport,
getReports

};

console.log("DATABASE JS READY",window.database);
