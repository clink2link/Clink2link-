/* ========= USERS ========= */

async function getUser(id){
    return await supabaseClient
        .from("users")
        .select("*")
        .eq("id",id)
        .single();
}

async function updateUser(id,data){
    return await supabaseClient
        .from("users")
        .update(data)
        .eq("id",id);
}


/* ========= PROFILES ========= */

async function getProfile(id){
    return await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id",id)
        .single();
}

async function updateProfile(id,data){
    return await supabaseClient
        .from("profiles")
        .update(data)
        .eq("id",id);
}


/* ========= LINKS ========= */

async function getLinks(userId){
    return await supabaseClient
        .from("links")
        .select("*")
        .eq("user_id",userId);
}

async function createLink(data){
    return await supabaseClient
        .from("links")
        .insert(data);
}

async function updateLink(id,data){
    return await supabaseClient
        .from("links")
        .update(data)
        .eq("id",id);
}


/* ========= SHORTLINKS ========= */

async function getShortlinks(userId){
    return await supabaseClient
        .from("shortlinks")
        .select("*")
        .eq("user_id",userId);
}

async function createShortlink(data){
    return await supabaseClient
        .from("shortlinks")
        .insert(data);
}


/* ========= CLICKS ========= */

async function addClick(data){
    return await supabaseClient
        .from("clicks")
        .insert(data);
}

async function getClicks(linkId){
    return await supabaseClient
        .from("clicks")
        .select("*")
        .eq("link_id",linkId);
}


/* ========= TRANSACTIONS ========= */

async function getTransactions(userId){
    return await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id",userId)
        .order("created_at",{ascending:false});
}

async function createTransaction(data){
    return await supabaseClient
        .from("transactions")
        .insert(data);
}


/* ========= WITHDRAW ========= */

async function getWithdraws(userId){
    return await supabaseClient
        .from("withdraws")
        .select("*")
        .eq("user_id",userId);
}

async function createWithdraw(data){
    return await supabaseClient
        .from("withdraws")
        .insert(data);
}


/* ========= WITHDRAWALS ========= */

async function getWithdrawals(userId){
    return await supabaseClient
        .from("withdrawals")
        .select("*")
        .eq("user_id",userId);
}


/* ========= REPORT ========= */

async function getDailyReport(userId){
    return await supabaseClient
        .from("dashboard_daily_report")
        .select("*")
        .eq("user_id",userId)
        .order("report_date",{ascending:false});
}


/* ========= ANNOUNCEMENT ========= */

async function getAnnouncements(){
    return await supabaseClient
        .from("announcements")
        .select("*")
        .eq("is_active",true)
        .order("created_at",{ascending:false});
}


/* ========= PASSWORD RESET ========= */

async function getPasswordReset(token){
    return await supabaseClient
        .from("password_resets")
        .select("*")
        .eq("token",token)
        .single();
}
