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


// Password verification sementara untuk login lama
async function verifyPassword(password, hash){

if(typeof bcrypt === "undefined"){
throw new Error("bcrypt belum dimuat");
}

return bcrypt.compareSync(
password,
hash
);

}
// ===============================
// AUTH
// ===============================

async function getUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Get User Error:", error);
        return null;
    }

    return user;

}


// ===============================
// USERS
// ===============================

async function getUsers() {

    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Get Users Error:", error);
        return [];
    }

    return data;

}


// ===============================
// PROFILES
// ===============================

async function getProfile(userId) {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Get Profile Error:", error);
        return null;
    }

    return data;

}

async function getProfiles() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*");

    if (error) {
        console.error("Get Profiles Error:", error);
        return [];
    }

    return data;

}

// ===============================
// AUTH
// ===============================

async function logout() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout Error:", error);
    }

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
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });

    if (error) throw error;

    return data;

}

async function getReports(userId){

    const { data, error } = await supabaseClient
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .order("report_date", { ascending: true });

    if(error){
        console.error(error);
        return [];
    }

    return data;

}


// ===============================
// EXPORT
// ===============================

window.database = {

    supabase: supabaseClient,

    verifyPassword,

    // AUTH
    getUser,
    logout,

    // PROFILE
    getProfile,
    getProfiles,

    // USERS
    getUsers,

    // LINKS
    getLinks,
    updateLink,
    deleteLink,

    // SHORTLINKS
    getShortlinks,

    // CLICKS
    getClicks,

    // TRANSACTIONS
    getTransactions,

    // WITHDRAWALS
    getWithdrawals,
    getWithdraws,

    // ANNOUNCEMENTS
    getAnnouncements,

    // REPORTS
    getDashboardReport,
    getReports

};
