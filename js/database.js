// js/database.js

// ===============================
// SUPABASE DATABASE CONFIG
// ===============================

const SUPABASE_URL = "https://lwjtagxkqeprjpupmadf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anRhZ3hrcWVwcmpwdXBtYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDExNzYsImV4cCI6MjA5OTg3NzE3Nn0.Cg8TIBtOE4PHmnSybJtMqEoCFx-Qm4Kkl8exSOanTes";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ===============================
// USERS
// ===============================

async function getUsers() {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// PROFILES
// ===============================

async function getProfiles() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*");

    if (error) throw error;

    return data;
}


// ===============================
// LINKS
// ===============================

async function getLinks(userId){

const {data,error}=await supabaseClient
.from("links")
.select("*")
.eq("user_id",userId)
.order("id",{ascending:false});


if(error){
console.error("Get Links Error:",error);
return [];
}

return data;

}
async function updateLink(id,data){

return supabaseClient
.from("links")
.update(data)
.eq("id",id);

}

async function deleteLink(id){

return supabaseClient
.from("links")
.delete()
.eq("id",id);

}


// ===============================
// SHORTLINKS
// ===============================

async function getShortlinks() {
    const { data, error } = await supabaseClient
        .from("shortlinks")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// CLICKS
// ===============================

async function getClicks() {
    const { data, error } = await supabaseClient
        .from("clicks")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// TRANSACTIONS
// ===============================

async function getTransactions() {
    const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// WITHDRAWALS
// ===============================

async function getWithdrawals() {
    const { data, error } = await supabaseClient
        .from("withdrawals")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// WITHDRAWS
// ===============================

async function getWithdraws() {
    const { data, error } = await supabaseClient
        .from("withdraws")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// ANNOUNCEMENTS
// ===============================

async function getAnnouncements() {
    const { data, error } = await supabaseClient
        .from("announcements")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// DASHBOARD REPORT
// ===============================

async function getDashboardReport() {
    const { data, error } = await supabaseClient
        .from("dashboard_daily_report")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;
}


// ===============================
// EXPORT
// ===============================

window.database = {
    getUsers,
    getProfiles,
    getLinks,
    updateLink,
    deleteLink,
    getShortlinks,
    getClicks,
    getTransactions,
    getWithdrawals,
    getWithdraws,
    getAnnouncements,
    getDashboardReport
};
