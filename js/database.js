// js/database.js

const SUPABASE_URL =
"https://lwjtagxkqeprjpupmadf.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anRhZ3hrcWVwcmpwdXBtYWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDMwMTE3NiwiZXhwIjoyMDk5ODc3MTc2fQ.jaiA6dZ2IWMh2gJuS9qPEorNlXpMT5BgyXaRRSJCSvk";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const API_URL =
"https://click2pay.my.id";

// =====================================================
// USER
// =====================================================

async function getUser() {

try {
    const id = localStorage.getItem("user_id");
    if (!id) return null;
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error) {
        console.error("GET USER:", error);
        return null;
    }
    return data;
} catch (error) {
    console.error("GET USER EXCEPTION:", error);
    return null;
}

}

async function getUsers() {

const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .order("created_at", {
        ascending: false
    });
if (error) {
    console.error("GET USERS:", error);
    return [];
}
return data || [];

}

async function logout() {

localStorage.removeItem("user_id");
sessionStorage.clear();
location.replace("index.html");

}

// =====================================================
// PROFILE
// =====================================================

async function getProfile(userId) {
    if (!userId) return null;
    const { data, error } =
        await supabaseClient
            .from("users")
            .select(`
                id,
                username,
                email,
                status,
                balance,
                country,
                total_ads,
                total_sell,
                total_views,
                total_clicks,
                ads_earning_today,
                ads_earning_month,
                ads_earning_total,
                sell_earning_today,
                sell_earning_month,
                sell_earning_total,
                sell_unlocked,
                sell_link_enabled,
                withdraw_count,
                is_admin,
                is_banned,
                created_at,
                updated_at
            `)
            .eq("id", userId)
            .maybeSingle();
    if (error) {
        console.error(
            "GET PROFILE:",
            error
        );
        return null;
    }
    return data;
}

async function getCurrentProfile() {
    try {
        // =========================
        // GET AUTH USER
        // =========================
        const {
            data: authData,
            error: authError
        } = await supabaseClient.auth.getUser();
        if (authError) {
            console.error(
                "GET AUTH USER ERROR:",
                authError
            );
            return null;
        }
        const authUser =
            authData?.user;
        if (!authUser) {
            console.warn(
                "SUPABASE AUTH USER TIDAK ADA"
            );
            return null;
        }
        // =========================
        // GET USER PROFILE
        // =========================
        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("users")
            .select(`
                id,
                username,
                email,
                balance,
                country,
                total_ads,
                total_sell,
                total_views,
                total_clicks,
                ads_earning_today,
                ads_earning_month,
                ads_earning_total,
                sell_earning_today,
                sell_earning_month,
                sell_earning_total,
                sell_unlocked,
                sell_link_enabled,
                withdraw_count,
                is_admin,
                is_banned,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                authUser.id
            )
            .maybeSingle();
        if (profileError) {
            console.error(
                "GET CURRENT PROFILE ERROR:",
                profileError
            );
            return null;
        }
        if (!profile) {
            console.warn(
                "PROFILE USERS TIDAK DITEMUKAN:",
                authUser.id
            );
            return null;
        }
        // =========================
        // SYNC LOCAL STORAGE
        // =========================
        localStorage.setItem(
            "user_id",
            profile.id
        );
        localStorage.setItem(
            "username",
            profile.username || ""
        );
        return profile;
    } catch (error) {
        console.error(
            "GET CURRENT PROFILE EXCEPTION:",
            error
        );
        return null;
    }
}

async function getProfiles() {

const { data, error } = await supabaseClient
    .from("users")
    .select("*");
if (error) {
    console.error("GET PROFILES:", error);
    return [];
}
return data || [];

}

async function updateProfile(payload) {

const id = localStorage.getItem("user_id");
if (!id) return null;
const { data, error } = await supabaseClient
    .from("users")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
if (error) {
    console.error("UPDATE PROFILE:", error);
    throw error;
}
return data;

}

// =====================================================
// LINKS
// =====================================================

async function getLinks(userId) {

if (!userId) return [];
const { data, error } = await supabaseClient
    .from("links")
    .select(`
        id,
        user_id,
        type,
        link_type,
        title,
        alias,
        custom_alias,
        short_code,
        destination,
        destination_url,
        campaign,
        campaign_name,
        device,
        target_device,
        expired,
        expired_at,
        price,
        status,
        views,
        clicks,
        total_views,
        total_clicks,
        total_earnings,
        earnings,
        sales,
        sold,
        created_at,
        updated_at
    `)
    .eq("user_id", userId)
    .order("created_at", {
        ascending: false
    });
if (error) {
    console.error("GET LINKS:", error);
    return [];
}
return data || [];

}

async function getLinkByCode(code) {

if (!code) return null;
const { data, error } = await supabaseClient
    .from("links")
    .select("*")
    .eq("short_code", String(code))
    .maybeSingle();
if (error) {
    console.error("GET LINK BY CODE:", error);
    return null;
}
return data;

}

async function createLink(payload) {

if (!payload?.user_id) {
    throw new Error("user_id wajib diisi");
}
if (!payload?.short_code) {
    throw new Error("short_code wajib diisi");
}
if (!payload?.title) {
    throw new Error("title wajib diisi");
}
if (!payload?.destination && !payload?.destination_url) {
    throw new Error("destination wajib diisi");
}
const destination =
    payload.destination ||
    payload.destination_url;
const destinationUrl =
    payload.destination_url ||
    payload.destination;
const insert = {
    user_id: payload.user_id,
    type: payload.type || "ads",
    title: payload.title,
    alias: payload.alias || null,
    custom_alias:
        payload.custom_alias || null,
    short_code:
        payload.short_code,
    destination,
    destination_url:
        destinationUrl,
    campaign:
        payload.campaign || null,
    campaign_name:
        payload.campaign_name || null,
    device:
        payload.device || "all",
    target_device:
        payload.target_device || "all",
    expired:
        payload.expired || "never",
    expired_at:
        payload.expired_at || null,
    link_type:
        payload.link_type ||
        payload.type ||
        "ads",
    price:
        Number(payload.price || 0),
    status:
        payload.status || "active",
    views: 0,
    clicks: 0,
    earnings: 0,
    total_views: 0,
    total_clicks: 0,
    total_earnings: 0,
    sold: 0,
    sales: 0
};
const { data, error } = await supabaseClient
    .from("links")
    .insert(insert)
    .select()
    .single();
if (error) {
    console.error("CREATE LINK:", error);
    throw error;
}
return data;

}

async function updateLink(id, payload) {

if (!id) {
    throw new Error("Link ID wajib diisi");
}
const { data, error } = await supabaseClient
    .from("links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
if (error) {
    console.error("UPDATE LINK:", error);
    throw error;
}
return data;

}

async function deleteLink(id) {

if (!id) {
    throw new Error("Link ID wajib diisi");
}
const { error } = await supabaseClient
    .from("links")
    .delete()
    .eq("id", id);
if (error) {
    console.error("DELETE LINK:", error);
    throw error;
}
return true;

}

// =====================================================
// LINK VIEWS
// =====================================================

async function createLinkView(payload) {

if (!payload?.link_id) {
    throw new Error("link_id wajib diisi");
}
const insert = {
    link_id:
        payload.link_id,
    visitor_ip:
        payload.visitor_ip || null,
    country:
        payload.country || null,
    device:
        payload.device || null,
    browser:
        payload.browser || null,
    referer:
        payload.referer || null,
    is_valid:
        payload.is_valid !== false,
    earning:
        Number(payload.earning || 0),
    created_at:
        payload.created_at ||
        new Date().toISOString()
};
const { data, error } = await supabaseClient
    .from("link_views")
    .insert(insert)
    .select()
    .single();
if (error) {
    console.error("CREATE LINK VIEW:", error);
    throw error;
}
return data;

}

async function getLinkViews(linkId) {

if (!linkId) return [];
const { data, error } = await supabaseClient
    .from("link_views")
    .select("*")
    .eq("link_id", linkId)
    .order("created_at", {
        ascending: false
    });
if (error) {
    console.error("GET LINK VIEWS:", error);
    return [];
}
return data || [];

}

// =====================================================
// SELL FEE
// =====================================================

function calculateSellPayment(price) {

const amount =
    Number(price || 0);
const fee =
    Math.floor(amount * 0.20);
const seller_receive =
    amount - fee;
return {
    fee,
    seller_receive
};

}

// =====================================================
// SELL ORDERS
// =====================================================

async function createSellOrder(payload) {

if (!payload?.link_id) {
    throw new Error("link_id wajib diisi");
}
if (!payload?.seller_id) {
    throw new Error("seller_id wajib diisi");
}
const insert = {
    link_id:
        payload.link_id,
    buyer_id:
        payload.buyer_id || null,
    seller_id:
        payload.seller_id,
    price:
        Number(payload.price || 0),
    status:
        payload.status || "pending",
    payment_id:
        payload.payment_id || null,
    paid_at:
        payload.paid_at || null,
    fee:
        Number(payload.fee || 0),
    seller_receive:
        Number(payload.seller_receive || 0),
    expires_at:
        payload.expires_at || null,
    invoice_id:
        payload.invoice_id || null,
    payment_url:
        payload.payment_url || null,
    qris_string:
        payload.qris_string || null,
    balance_processed:
        payload.balance_processed || false,
    quantity:
        Number(payload.quantity || 1),
    views:
        Number(payload.views || 0)
};
const { data, error } = await supabaseClient
    .from("sell_orders")
    .insert(insert)
    .select()
    .single();
if (error) {
    console.error("CREATE SELL ORDER:", error);
    throw error;
}
return data;

}

async function getSellOrders(userId) {

if (!userId) return [];
const { data, error } = await supabaseClient
    .from("sell_orders")
    .select(`
        id,
        link_id,
        seller_id,
        buyer_id,
        price,
        fee,
        seller_receive,
        status,
        quantity,
        views,
        payment_id,
        invoice_id,
        payment_url,
        qris_string,
        balance_processed,
        expires_at,
        created_at,
        paid_at
    `)
    .eq("seller_id", userId)
    .order("created_at", {
        ascending: false
    });
if (error) {
    console.error("GET SELL ORDERS:", error);
    return [];
}
return data || [];

}

// =====================================================
// PAYMENT API
// =====================================================

async function createPayment(payload) {

const response = await fetch(
    `${API_URL}/api/create-payment`,
    {
        method: "POST",
        headers: {
            "Content-Type":
                "application/json"
        },
        body:
            JSON.stringify(payload)
    }
);
const result =
    await response.json();
if (!response.ok) {
    throw new Error(
        result.error ||
        "Payment gagal"
    );
}
return result.data || result;

}

async function getPaymentStatus(orderId) {

const response = await fetch(
    `${API_URL}/api/payment-status/${orderId}`
);
const result =
    await response.json();
if (!response.ok) {
    throw new Error(
        result.error ||
        "Status pembayaran gagal"
    );
}
return result.data || result;

}

async function checkSellPayment(invoiceId) {

if (!invoiceId) {
    throw new Error("Invoice kosong");
}
const response = await fetch(
    `${API_URL}/api/check-payment?invoice_id=${encodeURIComponent(invoiceId)}`
);
const result =
    await response.json();
if (!response.ok) {
    throw new Error(
        result.error ||
        "Check pembayaran gagal"
    );
}
return result.data || result;

}

// =====================================================
// WALLET
// =====================================================

async function getWalletTransactions(userId) {

if (!userId) return [];
const { data, error } =
    await supabaseClient
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
            ascending: false
        });
if (error) {
    console.error("GET WALLET:", error);
    return [];
}
return data || [];

}

async function createWalletTransaction(payload) {

const insert = {
    user_id:
        payload.user_id,
    type:
        payload.type,
    amount:
        Number(payload.amount || 0),
    title:
        payload.title || null,
    description:
        payload.description || null,
    status:
        payload.status || "success"
};
const { data, error } =
    await supabaseClient
        .from("wallet_transactions")
        .insert(insert)
        .select()
        .single();
if (error) {
    console.error(
        "CREATE WALLET TRANSACTION:",
        error
    );
    throw error;
}
return data;

}

// =====================================================
// WITHDRAW
// =====================================================

async function getWithdraws(userId = null) {

let query =
    supabaseClient
        .from("withdraws")
        .select("*")
        .order("created_at", {
            ascending: false
        });
if (userId) {
    query =
        query.eq(
            "user_id",
            userId
        );
}
const { data, error } =
    await query;
if (error) {
    console.error(
        "GET WITHDRAWS:",
        error
    );
    return [];
}
return data || [];

}

async function createWithdraw(payload) {

const insert = {
    user_id:
        payload.user_id,
    method:
        payload.method,
    account_number:
        payload.account_number,
    amount:
        Number(payload.amount || 0),
    type:
        payload.type || "withdraw",
    fee:
        Number(payload.fee || 0),
    status:
        payload.status || "pending"
};
const { data, error } =
    await supabaseClient
        .from("withdraws")
        .insert(insert)
        .select()
        .single();
if (error) {
    console.error(
        "CREATE WITHDRAW:",
        error
    );
    throw error;
}
return data;

}

// =====================================================
// DAILY REPORT
// =====================================================

async function getDashboardReport() {

const { data, error } =
    await supabaseClient
        .from("daily_reports")
        .select("*")
        .order("report_date", {
            ascending: false
        });
if (error) {
    console.error(
        "GET DASHBOARD REPORT:",
        error
    );
    return [];
}
return data || [];

}

async function getReports(userId) {

if (!userId) return [];
const { data, error } =
    await supabaseClient
        .from("daily_reports")
        .select(`
            id,
            user_id,
            report_date,
            ads_views,
            ads_clicks,
            ads_earnings,
            sell_views,
            sell_clicks,
            sell_earnings,
            created_at
        `)
        .eq("user_id", userId)
        .order("report_date", {
            ascending: false
        })
        .limit(30);
if (error) {
    console.error(
        "GET USER REPORT:",
        error
    );
    return [];
}
return data || [];

}

// =====================================================
// UPSERT DAILY REPORT
// =====================================================

async function upsertDailyReport(
userId,
reportDate,
payload = {}
) {

if (!userId) {
    throw new Error("userId wajib diisi");
}
if (!reportDate) {
    throw new Error("reportDate wajib diisi");
}
const row = {
    user_id:
        userId,
    report_date:
        reportDate,
    ads_views:
        Number(payload.ads_views || 0),
    ads_clicks:
        Number(payload.ads_clicks || 0),
    ads_earnings:
        Number(payload.ads_earnings || 0),
    sell_views:
        Number(payload.sell_views || 0),
    sell_clicks:
        Number(payload.sell_clicks || 0),
    sell_earnings:
        Number(payload.sell_earnings || 0)
};
const { data, error } =
    await supabaseClient
        .from("daily_reports")
        .upsert(
            row,
            {
                onConflict:
                    "user_id,report_date"
            }
        )
        .select()
        .single();
if (error) {
    console.error(
        "UPSERT DAILY REPORT:",
        error
    );
    throw error;
}
return data;

}

// =====================================================
// GET TODAY REPORT
// =====================================================

async function getTodayReport(userId) {

if (!userId) return null;
const now =
    new Date();
const jakarta =
    new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(now);
const { data, error } =
    await supabaseClient
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("report_date", jakarta)
        .maybeSingle();
if (error) {
    console.error(
        "GET TODAY REPORT:",
        error
    );
    return null;
}
return data;

}

// =====================================================
// STATISTICS
// =====================================================

async function getStatistics(userId) {

const links =
    await getLinks(userId);
const orders =
    await getSellOrders(userId);
const paidOrders =
    orders.filter(order =>
        [
            "paid",
            "completed",
            "success",
            "settled"
        ].includes(
            String(
                order.status
            ).toLowerCase()
        )
    );
return {
    links,
    orders,
    paidOrders,
    totalAdsLinks:
        links.filter(
            x =>
                String(x.type)
                    .toLowerCase() ===
                "ads"
        ).length,
    totalSellLinks:
        links.filter(
            x =>
                String(x.type)
                    .toLowerCase() ===
                "sell"
        ).length,
    totalAdsViews:
        links
            .filter(
                x =>
                    String(x.type)
                        .toLowerCase() ===
                    "ads"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.total_views || 0
                    ),
                0
            ),
    totalAdsClicks:
        links
            .filter(
                x =>
                    String(x.type)
                        .toLowerCase() ===
                    "ads"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.total_clicks || 0
                    ),
                0
            ),
    totalSellViews:
        links
            .filter(
                x =>
                    String(x.type)
                        .toLowerCase() ===
                    "sell"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.total_views || 0
                    ),
                0
            ),
    totalSellClicks:
        links
            .filter(
                x =>
                    String(x.type)
                        .toLowerCase() ===
                    "sell"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.total_clicks || 0
                    ),
                0
            ),
    totalSold:
        paidOrders.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 1
                ),
            0
        ),
    totalSellPrice:
        paidOrders.reduce(
            (total, item) =>
                total +
                Number(
                    item.price || 0
                ),
            0
        ),
    totalSellFee:
        paidOrders.reduce(
            (total, item) =>
                total +
                Number(
                    item.fee || 0
                ),
            0
        ),
    totalSellEarn:
        paidOrders.reduce(
            (total, item) =>
                total +
                Number(
                    item.seller_receive || 0
                ),
            0
        )
};

}

// =====================================================
// ANNOUNCEMENT
// =====================================================

async function getAnnouncements() {

const { data, error } =
    await supabaseClient
        .from("announcements")
        .select("*")
        .order("created_at", {
            ascending: false
        });
if (error) {
    console.error(
        "GET ANNOUNCEMENTS:",
        error
    );
    return [];
}
return data || [];

}

// =====================================================
// CPM MARKET
// =====================================================

async function getCPMMarket() {

const { data, error } =
    await supabaseClient
        .from("cpm_market")
        .select("*")
        .order("cpm", {
            ascending: false
        });
if (error) {
    console.error(
        "GET CPM MARKET:",
        error
    );
    return [];
}
return data || [];

}

// =====================================================
// CPM RATE
// =====================================================

async function getCPMRate(
    country = "Indonesia"
) {

const { data, error } =
    await supabaseClient
        .from("cpm_rates")
        .select("cpm")
        .eq("country", country)
        .maybeSingle();
if (error) {
    console.error(
        "GET CPM RATE:",
        error
    );
    return 0;
}
return Number(
    data?.cpm || 0
);

}

// =====================================================
// EXPORT
// =====================================================

window.database = {

supabase:
    supabaseClient,
// USER
getUser,
getUsers,
getProfile,
getCurrentProfile,
getProfiles,
updateProfile,
logout,
// LINKS
getLinks,
getLinkByCode,
createLink,
updateLink,
deleteLink,
// LINK VIEWS
createLinkView,
getLinkViews,
// SELL
calculateSellPayment,
createSellOrder,
getSellOrders,
// PAYMENT
createPayment,
getPaymentStatus,
checkSellPayment,
// WALLET
getWalletTransactions,
createWalletTransaction,
// WITHDRAW
getWithdraws,
createWithdraw,
// REPORT
getDashboardReport,
getReports,
getTodayReport,
upsertDailyReport,
// STATISTICS
getStatistics,
// ANNOUNCEMENT
getAnnouncements,
// CPM
getCPMMarket,
getCPMRate

};

console.log(
    "DATABASE JS READY",
    window.database
);
