// =====================================================
// SUPABASE CONFIG
// =====================================================

const SUPABASE_URL =
    "https://lwjtagxkqeprjpupmadf.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyb2xlIjoiYW5vbiJ9";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

const API_URL =
    "https://click2pay.my.id";


// =====================================================
// USER
// =====================================================

async function getUser() {

    try {

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("GET USER SESSION:", sessionError);
            return null;
        }

        if (!session?.user) {
            return null;
        }

        const { data, error } = await supabaseClient
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
                withdraw_count,
                is_admin,
                is_banned,
                email_verified,
                created_at,
                updated_at,
                ref_code,
                sell_earning_total,
                sell_earning_month,
                sell_earning_today,
                is_premium,
                premium_expires_at
            `)
            .eq("id", session.user.id)
            .maybeSingle();

        if (error) {
            console.error("GET USER:", error);
            return null;
        }

        if (data) {

            localStorage.setItem(
                "user_id",
                data.id
            );

            localStorage.setItem(
                "username",
                data.username || ""
            );

        }

        return data || null;

    } catch (error) {

        console.error(
            "GET USER EXCEPTION:",
            error
        );

        return null;

    }

}


// =====================================================
// GET USERS
// =====================================================

async function getUsers() {

    try {

        const {
            data,
            error
        } = await supabaseClient
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
                withdraw_count,
                is_admin,
                is_banned,
                email_verified,
                created_at,
                updated_at,
                ref_code,
                sell_earning_total,
                sell_earning_month,
                sell_earning_today,
                is_premium,
                premium_expires_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "GET USERS:",
                error
            );

            return [];

        }

        return data || [];

    } catch (error) {

        console.error(
            "GET USERS EXCEPTION:",
            error
        );

        return [];

    }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.replace(
        "index.html"
    );

}


// =====================================================
// PROFILE
// profiles table
// =====================================================

async function getProfile(userId) {

    try {

        if (!userId) {
            console.warn(
                "GET PROFILE: USER ID KOSONG"
            );

            return null;
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                photo_url,
                balance,
                ads_earning_today,
                ads_earning_month,
                ads_earning_total,
                sell_earning_today,
                sell_earning_month,
                sell_earning_total,
                total_views,
                total_clicks,
                withdraw_count,
                sell_link_enabled,
                status,
                created_at,
                updated_at
            `)
            .eq("id", userId)
            .maybeSingle();

        if (error) {

            console.error(
                "GET PROFILE ERROR:",
                error
            );

            return null;

        }

        if (!data) {

            console.warn(
                "PROFILE TIDAK DITEMUKAN:",
                userId
            );

            return null;

        }

        localStorage.setItem(
            "user_id",
            data.id
        );

        localStorage.setItem(
            "username",
            data.username || ""
        );

        return data;

    } catch (error) {

        console.error(
            "GET PROFILE EXCEPTION:",
            error
        );

        return null;

    }

}


// =====================================================
// CURRENT PROFILE
// =====================================================

async function getCurrentProfile() {

    try {

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "GET SESSION ERROR:",
                error
            );

            return null;

        }

        if (!session?.user) {

            console.warn(
                "SUPABASE SESSION TIDAK ADA"
            );

            return null;

        }

        return await getProfile(
            session.user.id
        );

    } catch (error) {

        console.error(
            "GET CURRENT PROFILE:",
            error
        );

        return null;

    }

}


// =====================================================
// GET ALL PROFILES
// =====================================================

async function getProfiles() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                photo_url,
                balance,
                ads_earning_today,
                ads_earning_month,
                ads_earning_total,
                sell_earning_today,
                sell_earning_month,
                sell_earning_total,
                total_views,
                total_clicks,
                withdraw_count,
                sell_link_enabled,
                status,
                created_at,
                updated_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "GET PROFILES:",
                error
            );

            return [];

        }

        return data || [];

    } catch (error) {

        console.error(
            "GET PROFILES EXCEPTION:",
            error
        );

        return [];

    }

}


// =====================================================
// UPDATE PROFILE
// profiles table
// =====================================================

async function updateProfile(payload) {

    try {

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session?.user) {
            throw new Error(
                "User belum login."
            );
        }

        const allowed = {
            username:
                payload.username,
            full_name:
                payload.full_name,
            photo_url:
                payload.photo_url
        };

        Object.keys(allowed).forEach(
            key => {
                if (
                    allowed[key] === undefined
                ) {
                    delete allowed[key];
                }
            }
        );

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .update(allowed)
            .eq(
                "id",
                session.user.id
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (data) {

            localStorage.setItem(
                "user_id",
                data.id
            );

            localStorage.setItem(
                "username",
                data.username || ""
            );

        }

        return data;

    } catch (error) {

        console.error(
            "UPDATE PROFILE:",
            error
        );

        throw error;

    }

}


// =====================================================
// SELL ACCESS
// users table
// =====================================================

async function getSellAccess(userId) {

    if (!userId) {
        return null;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("users")
        .select(`
            id,
            username,
            is_premium,
            premium_expires_at,
            withdraw_count,
            sell_unlocked
        `)
        .eq(
            "id",
            userId
        )
        .maybeSingle();

    if (error) {

        console.error(
            "GET SELL ACCESS:",
            error
        );

        return null;

    }

    return data || null;

}


// =====================================================
// CHECK SELL ACCESS
// =====================================================

async function canUseSellLink(userId) {

    const user =
        await getSellAccess(userId);

    if (!user) {
        return false;
    }

    // Manual unlock
    if (
        user.sell_unlocked === true
    ) {
        return true;
    }

    // Withdraw 3x
    const withdrawCount =
        Number(
            user.withdraw_count || 0
        );

    if (withdrawCount >= 3) {
        return true;
    }

    // Premium
    if (
        user.is_premium === true
    ) {

        if (
            !user.premium_expires_at
        ) {
            return true;
        }

        const expiredAt =
            new Date(
                user.premium_expires_at
            );

        if (
            !isNaN(
                expiredAt.getTime()
            ) &&
            expiredAt > new Date()
        ) {

            return true;

        }

    }

    return false;

}


// =====================================================
// LINKS
// =====================================================

const LINK_COLUMNS = `
    id,
    user_id,
    type,
    title,
    alias,
    destination,
    campaign,
    device,
    expired_at,
    price,
    status,
    views,
    clicks,
    earnings,
    created_at,
    short_code,
    destination_url,
    link_type,
    custom_alias,
    campaign_name,
    target_device,
    total_views,
    total_clicks,
    total_earnings,
    sold,
    expired,
    sales,
    updated_at
`;


// =====================================================
// GET LINKS
// =====================================================

async function getLinks(userId) {

    if (!userId) {
        return [];
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("links")
            .select(LINK_COLUMNS)
            .eq(
                "user_id",
                userId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "GET LINKS ERROR:",
                error
            );

            return [];

        }

        return data || [];

    } catch (error) {

        console.error(
            "GET LINKS EXCEPTION:",
            error
        );

        return [];

    }

}


// =====================================================
// SELL LINKS
// =====================================================

async function getSellLinks(userId) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .select(LINK_COLUMNS)
        .eq(
            "user_id",
            userId
        )
        .or(
            "type.eq.sell,link_type.eq.sell"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET SELL LINKS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// ADS LINKS
// =====================================================

async function getAdsLinks(userId) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .select(LINK_COLUMNS)
        .eq(
            "user_id",
            userId
        )
        .or(
            "type.eq.ads,link_type.eq.ads"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET ADS LINKS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// GET LINK BY CODE
// =====================================================

async function getLinkByCode(code) {

    if (!code) {
        return null;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .select("*")
        .eq(
            "short_code",
            String(code)
        )
        .maybeSingle();

    if (error) {

        console.error(
            "GET LINK BY CODE:",
            error
        );

        return null;

    }

    return data || null;

}


// =====================================================
// CREATE LINK
// =====================================================

async function createLink(payload) {

    if (!payload?.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }

    if (!payload?.short_code) {
        throw new Error(
            "short_code wajib diisi"
        );
    }

    if (!payload?.title) {
        throw new Error(
            "title wajib diisi"
        );
    }

    if (
        !payload?.destination &&
        !payload?.destination_url
    ) {

        throw new Error(
            "destination wajib diisi"
        );

    }

    const destination =
        payload.destination ||
        payload.destination_url;

    const destinationUrl =
        payload.destination_url ||
        payload.destination;

    const insert = {

        user_id:
            payload.user_id,

        type:
            payload.type || "ads",

        title:
            payload.title,

        alias:
            payload.alias || null,

        destination,

        campaign:
            payload.campaign || null,

        device:
            payload.device || "all",

        expired_at:
            payload.expired_at || null,

        price:
            Number(
                payload.price || 0
            ),

        status:
            payload.status || "active",

        views: 0,

        clicks: 0,

        earnings: 0,

        short_code:
            payload.short_code,

        destination_url:
            destinationUrl,

        link_type:
            payload.link_type ||
            payload.type ||
            "ads",

        custom_alias:
            payload.custom_alias || null,

        campaign_name:
            payload.campaign_name || null,

        target_device:
            payload.target_device ||
            "all",

        total_views: 0,

        total_clicks: 0,

        total_earnings: 0,

        sold: 0,

        expired:
            payload.expired ||
            "never",

        sales: 0

    };

    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .insert(insert)
        .select()
        .single();

    if (error) {

        console.error(
            "CREATE LINK:",
            error
        );

        throw error;

    }

    return data;

}


// =====================================================
// UPDATE LINK
// =====================================================

async function updateLink(
    id,
    payload
) {

    if (!id) {
        throw new Error(
            "Link ID wajib diisi"
        );
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();

    if (error) {

        console.error(
            "UPDATE LINK:",
            error
        );

        throw error;

    }

    return data;

}


// =====================================================
// DELETE LINK
// =====================================================

async function deleteLink(id) {

    if (!id) {
        throw new Error(
            "Link ID wajib diisi"
        );
    }

    const {
        error
    } = await supabaseClient
        .from("links")
        .delete()
        .eq(
            "id",
            id
        );

    if (error) {

        console.error(
            "DELETE LINK:",
            error
        );

        throw error;

    }

    return true;

}


// =====================================================
// LINK VIEWS
// =====================================================

async function createLinkView(payload) {

    if (!payload?.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
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
            Number(
                payload.earning || 0
            ),

        created_at:
            payload.created_at ||
            new Date().toISOString()

    };

    const {
        data,
        error
    } = await supabaseClient
        .from("link_views")
        .insert(insert)
        .select()
        .single();

    if (error) {

        console.error(
            "CREATE LINK VIEW:",
            error
        );

        throw error;

    }

    return data;

}


// =====================================================
// GET LINK VIEWS
// =====================================================

async function getLinkViews(
    linkId
) {

    if (!linkId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("link_views")
        .select("*")
        .eq(
            "link_id",
            linkId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET LINK VIEWS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// SELL FEE
// =====================================================

function calculateSellPayment(
    price
) {

    const amount =
        Number(
            price || 0
        );

    const fee =
        Math.floor(
            amount * 0.20
        );

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

async function createSellOrder(
    payload
) {

    if (!payload?.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    if (!payload?.seller_id) {
        throw new Error(
            "seller_id wajib diisi"
        );
    }

    const insert = {

        link_id:
            payload.link_id,

        buyer_id:
            payload.buyer_id || null,

        seller_id:
            payload.seller_id,

        price:
            Number(
                payload.price || 0
            ),

        status:
            payload.status ||
            "pending",

        payment_id:
            payload.payment_id || null,

        paid_at:
            payload.paid_at || null,

        fee:
            Number(
                payload.fee || 0
            ),

        seller_receive:
            Number(
                payload.seller_receive || 0
            ),

        expires_at:
            payload.expires_at ||
            null,

        invoice_id:
            payload.invoice_id ||
            null,

        payment_url:
            payload.payment_url ||
            null,

        qris_string:
            payload.qris_string ||
            null,

        balance_processed:
            payload.balance_processed ||
            false,

        quantity:
            Number(
                payload.quantity || 1
            ),

        views:
            Number(
                payload.views || 0
            )

    };

    const {
        data,
        error
    } = await supabaseClient
        .from("sell_orders")
        .insert(insert)
        .select()
        .single();

    if (error) {

        console.error(
            "CREATE SELL ORDER:",
            error
        );

        throw error;

    }

    return data;

}


// =====================================================
// GET SELL ORDERS
// =====================================================

async function getSellOrders(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("sell_orders")
        .select(`
            id,
            link_id,
            buyer_id,
            seller_id,
            price,
            status,
            created_at,
            payment_id,
            paid_at,
            fee,
            seller_receive,
            expires_at,
            invoice_id,
            payment_url,
            qris_string,
            balance_processed,
            quantity,
            views
        `)
        .eq(
            "seller_id",
            userId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET SELL ORDERS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// PAYMENT API
// =====================================================

async function createPayment(
    payload
) {

    const response =
        await fetch(
            `${API_URL}/api/create-payment`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
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

    return (
        result.data ||
        result
    );

}


// =====================================================
// PAYMENT STATUS
// =====================================================

async function getPaymentStatus(
    orderId
) {

    const response =
        await fetch(
            `${API_URL}/api/payment-status/${encodeURIComponent(orderId)}`
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.error ||
            "Status pembayaran gagal"
        );

    }

    return (
        result.data ||
        result
    );

}


// =====================================================
// CHECK SELL PAYMENT
// =====================================================

async function checkSellPayment(
    invoiceId
) {

    if (!invoiceId) {

        throw new Error(
            "Invoice kosong"
        );

    }

    const response =
        await fetch(
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

    return (
        result.data ||
        result
    );

}


// =====================================================
// WALLET
// =====================================================

async function getWalletTransactions(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("wallet_transactions")
        .select(`
            id,
            user_id,
            type,
            amount,
            title,
            description,
            status,
            created_at
        `)
        .eq(
            "user_id",
            userId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET WALLET:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// CREATE WALLET TRANSACTION
// =====================================================

async function createWalletTransaction(
    payload
) {

    const insert = {

        user_id:
            payload.user_id,

        type:
            payload.type,

        amount:
            Number(
                payload.amount || 0
            ),

        title:
            payload.title || null,

        description:
            payload.description ||
            null,

        status:
            payload.status ||
            "success"

    };

    const {
        data,
        error
    } = await supabaseClient
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
// WITHDRAWALS
// =====================================================

async function getWithdraws(
    userId = null
) {

    let query =
        supabaseClient
            .from("withdrawals")
            .select(`
                id,
                user_id,
                amount,
                method,
                account_name,
                account_number,
                status,
                created_at,
                paid_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (userId) {

        query =
            query.eq(
                "user_id",
                userId
            );

    }

    const {
        data,
        error
    } = await query;

    if (error) {

        console.error(
            "GET WITHDRAWALS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// CREATE WITHDRAWAL
// =====================================================

async function createWithdraw(
    payload
) {

    const insert = {

        user_id:
            payload.user_id,

        amount:
            Number(
                payload.amount || 0
            ),

        method:
            payload.method,

        account_name:
            payload.account_name ||
            null,

        account_number:
            payload.account_number,

        status:
            payload.status ||
            "pending"

    };

    const {
        data,
        error
    } = await supabaseClient
        .from("withdrawals")
        .insert(insert)
        .select()
        .single();

    if (error) {

        console.error(
            "CREATE WITHDRAWAL:",
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

    const {
        data,
        error
    } = await supabaseClient
        .from("daily_reports")
        .select("*")
        .order(
            "report_date",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET DASHBOARD REPORT:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// USER REPORT
// =====================================================

async function getReports(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
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
        .eq(
            "user_id",
            userId
        )
        .order(
            "report_date",
            {
                ascending: false
            }
        )
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
        throw new Error(
            "userId wajib diisi"
        );
    }

    if (!reportDate) {
        throw new Error(
            "reportDate wajib diisi"
        );
    }

    const row = {

        user_id:
            userId,

        report_date:
            reportDate,

        ads_views:
            Number(
                payload.ads_views || 0
            ),

        ads_clicks:
            Number(
                payload.ads_clicks || 0
            ),

        ads_earnings:
            Number(
                payload.ads_earnings || 0
            ),

        sell_views:
            Number(
                payload.sell_views || 0
            ),

        sell_clicks:
            Number(
                payload.sell_clicks || 0
            ),

        sell_earnings:
            Number(
                payload.sell_earnings || 0
            )

    };

    const {
        data,
        error
    } = await supabaseClient
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
// TODAY REPORT
// =====================================================

async function getTodayReport(
    userId
) {

    if (!userId) {
        return null;
    }

    const now =
        new Date();

    const jakarta =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "Asia/Jakarta",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        ).format(now);

    const {
        data,
        error
    } = await supabaseClient
        .from("daily_reports")
        .select("*")
        .eq(
            "user_id",
            userId
        )
        .eq(
            "report_date",
            jakarta
        )
        .maybeSingle();

    if (error) {

        console.error(
            "GET TODAY REPORT:",
            error
        );

        return null;

    }

    return data || null;

}


// =====================================================
// TRANSACTIONS
// =====================================================

async function getTransactions(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("transactions")
        .select(`
            id,
            user_id,
            type,
            amount,
            description,
            created_at,
            title,
            status
        `)
        .eq(
            "user_id",
            userId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET TRANSACTIONS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// STATISTICS
// =====================================================

async function getStatistics(
    userId
) {

    const links =
        await getLinks(
            userId
        );

    const orders =
        await getSellOrders(
            userId
        );

    const paidOrders =
        orders.filter(
            order =>
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

    const adsLinks =
        links.filter(
            x =>
                String(
                    x.type
                ).toLowerCase() ===
                "ads"
        );

    const sellLinks =
        links.filter(
            x =>
                String(
                    x.type
                ).toLowerCase() ===
                "sell"
        );

    return {

        links,

        orders,

        paidOrders,

        totalAdsLinks:
            adsLinks.length,

        totalSellLinks:
            sellLinks.length,

        totalAdsViews:
            adsLinks.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.total_views ||
                        0
                    ),
                0
            ),

        totalAdsClicks:
            adsLinks.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.total_clicks ||
                        0
                    ),
                0
            ),

        totalSellViews:
            sellLinks.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.total_views ||
                        0
                    ),
                0
            ),

        totalSellClicks:
            sellLinks.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.total_clicks ||
                        0
                    ),
                0
            ),

        totalSold:
            paidOrders.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.quantity ||
                        1
                    ),
                0
            ),

        totalSellPrice:
            paidOrders.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.price ||
                        0
                    ),
                0
            ),

        totalSellFee:
            paidOrders.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.fee ||
                        0
                    ),
                0
            ),

        totalSellEarn:
            paidOrders.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.seller_receive ||
                        0
                    ),
                0
            )

    };

}


// =====================================================
// ANNOUNCEMENTS
// =====================================================

async function getAnnouncements() {

    const {
        data,
        error
    } = await supabaseClient
        .from("announcements")
        .select(`
            id,
            title,
            content,
            created_by,
            created_at
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );

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

    const {
        data,
        error
    } = await supabaseClient
        .from("cpm_market")
        .select(`
            id,
            country,
            flag,
            cpm,
            change,
            trend,
            created_at,
            updated_at
        `)
        .order(
            "cpm",
            {
                ascending: false
            }
        );

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

    const {
        data,
        error
    } = await supabaseClient
        .from("cpm_rates")
        .select(`
            id,
            country,
            cpm,
            updated_at,
            history,
            change,
            trend
        `)
        .eq(
            "country",
            country
        )
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
// CPM SETTINGS
// =====================================================

async function getCPMSettings(
    country = null
) {

    let query =
        supabaseClient
            .from("cpm_settings")
            .select(`
                id,
                country,
                ads_cpm,
                sell_cpm,
                updated_at
            `);

    if (country) {

        query =
            query.eq(
                "country",
                country
            );

    }

    const {
        data,
        error
    } = await query;

    if (error) {

        console.error(
            "GET CPM SETTINGS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// PAYMENT REQUESTS
// =====================================================

async function getPaymentRequests(
    userId = null
) {

    let query =
        supabaseClient
            .from("payment_requests")
            .select(`
                id,
                user_id,
                payment_name,
                status,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (userId) {

        query =
            query.eq(
                "user_id",
                userId
            );

    }

    const {
        data,
        error
    } = await query;

    if (error) {

        console.error(
            "GET PAYMENT REQUESTS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// PAYMENT METHODS
// =====================================================

async function getPaymentMethods(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("payment_methods")
        .select(`
            id,
            user_id,
            bank_name,
            account_name,
            account_number,
            created_at,
            method
        `)
        .eq(
            "user_id",
            userId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET PAYMENT METHODS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// NOTIFICATIONS
// =====================================================

async function getNotifications(
    userId
) {

    if (!userId) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("notifications")
        .select(`
            id,
            user_id,
            title,
            message,
            is_read,
            created_at
        `)
        .eq(
            "user_id",
            userId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "GET NOTIFICATIONS:",
            error
        );

        return [];

    }

    return data || [];

}


// =====================================================
// MARK NOTIFICATION READ
// =====================================================

async function markNotificationRead(
    notificationId
) {

    if (!notificationId) {
        throw new Error(
            "notificationId wajib diisi"
        );
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("notifications")
        .update({
            is_read: true
        })
        .eq(
            "id",
            notificationId
        )
        .select()
        .single();

    if (error) {

        console.error(
            "MARK NOTIFICATION READ:",
            error
        );

        throw error;

    }

    return data;

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
    logout,

    // PROFILE
    getProfile,
    getCurrentProfile,
    getProfiles,
    updateProfile,

    // SELL ACCESS
    getSellAccess,
    canUseSellLink,

    // LINKS
    getLinks,
    getSellLinks,
    getAdsLinks,
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

    // PAYMENT API
    createPayment,
    getPaymentStatus,
    checkSellPayment,

    // WALLET
    getWalletTransactions,
    createWalletTransaction,

    // WITHDRAWALS
    getWithdraws,
    createWithdraw,

    // TRANSACTIONS
    getTransactions,

    // REPORT
    getDashboardReport,
    getReports,
    getTodayReport,
    upsertDailyReport,

    // STATISTICS
    getStatistics,

    // ANNOUNCEMENTS
    getAnnouncements,

    // CPM
    getCPMMarket,
    getCPMRate,
    getCPMSettings,

    // PAYMENT REQUEST
    getPaymentRequests,

    // PAYMENT METHODS
    getPaymentMethods,

    // NOTIFICATIONS
    getNotifications,
    markNotificationRead

};


console.log(
    "DATABASE JS READY",
    window.database
);
