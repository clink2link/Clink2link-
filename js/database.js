// js/database.js
// =====================================================
// CLICK2PAY DATABASE
// FINAL VERSION
// Supabase + API
// =====================================================
const SUPABASE_URL =
    "https://lwjtagxkqeprjpupmadf.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anRhZ3hrcWVwcmpwdXBtYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDExNzYsImV4cCI6MjA5OTg3NzE3Nn0.Cg8TIBtOE4PHmnSybJtMqEoCFx-Qm4Kkl8exSOanTes";
const API_URL =
    "https://click2pay.my.id";
// =====================================================
// SUPABASE CLIENT
// =====================================================
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
// =====================================================
// HELPERS
// =====================================================
function currentUserId() {
    return localStorage.getItem("user_id") || null;
}
function saveUserLocal(user) {
    if (!user) return;
    if (user.id) {
        localStorage.setItem(
            "user_id",
            user.id
        );
    }
    if (user.username !== undefined) {
        localStorage.setItem(
            "username",
            user.username || ""
        );
    }
}
function clearLocalUser() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
}
async function getSession() {
    const {
        data,
        error
    } = await supabaseClient.auth.getSession();
    if (error) {
        console.error(
            "GET SESSION:",
            error
        );
        return null;
    }
    return data?.session || null;
}
// =====================================================
// AUTH / USER
// =====================================================
async function getUser() {
    try {
        const session =
            await getSession();
        if (!session?.user) {
            return null;
        }
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
        if (error) {
            console.error(
                "GET USER:",
                error
            );
            return null;
        }
        if (data) {
            saveUserLocal(data);
        }
        return data;
    } catch (error) {
        console.error(
            "GET USER EXCEPTION:",
            error
        );
        return null;
    }
}
async function getUsers() {
    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .select("*")
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
async function logout() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error(
            "LOGOUT ERROR:",
            error
        );
    }
    clearLocalUser();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(
        "index.html"
    );
}
// =====================================================
// USER BY ID
// =====================================================
async function getProfile(userId) {
    if (!userId) {
        console.warn(
            "GET PROFILE: USER ID KOSONG"
        );
        return null;
    }
    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
        if (error) {
            console.error(
                "GET PROFILE:",
                error
            );
            return null;
        }
        if (data) {
            saveUserLocal(data);
        }
        return data || null;
    } catch (error) {
        console.error(
            "GET PROFILE EXCEPTION:",
            error
        );
        return null;
    }
}
// =====================================================
// CURRENT USER
// =====================================================
async function getCurrentProfile() {
    try {
        const session =
            await getSession();
        if (!session?.user) {
            return null;
        }
        const userId =
            session.user.id;
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
        if (error) {
            console.error(
                "GET CURRENT PROFILE:",
                error
            );
            return null;
        }
        if (data) {
            saveUserLocal(data);
        }
        return data || null;
    } catch (error) {
        console.error(
            "GET CURRENT PROFILE EXCEPTION:",
            error
        );
        return null;
    }
}
// =====================================================
// ALL USERS
// =====================================================
async function getProfiles() {
    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .select("*")
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
// UPDATE USER
// =====================================================
async function updateProfile(payload = {}) {
    try {
        const session =
            await getSession();
        if (!session?.user) {
            throw new Error(
                "User belum login."
            );
        }
        // Jangan mengizinkan frontend
        // mengubah field sensitif secara sembarangan.
        const allowedFields = [
            "username",
            "email"
        ];
        const update = {};
        allowedFields.forEach(
            field => {
                if (
                    payload[field] !==
                    undefined
                ) {
                    update[field] =
                        payload[field];
                }
            }
        );
        if (
            Object.keys(update).length === 0
        ) {
            return await getUser();
        }
        const {
            data,
            error
        } = await supabaseClient
            .from("users")
            .update(update)
            .eq(
                "id",
                session.user.id
            )
            .select()
            .single();
        if (error) {
            throw error;
        }
        saveUserLocal(data);
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
// PROFILES TABLE
// =====================================================
async function getUserProfile(userId) {
    if (!userId) return null;
    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
    if (error) {
        console.error(
            "GET USER PROFILE:",
            error
        );
        return null;
    }
    return data || null;
}
async function updateUserProfile(
    userId,
    payload = {}
) {
    if (!userId) {
        throw new Error(
            "userId wajib diisi"
        );
    }
    const allowedFields = [
        "username",
        "full_name",
        "photo_url"
    ];
    const update = {};
    allowedFields.forEach(
        field => {
            if (
                payload[field] !==
                undefined
            ) {
                update[field] =
                    payload[field];
            }
        }
    );
    if (
        Object.keys(update).length === 0
    ) {
        return getUserProfile(userId);
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .update(update)
        .eq("id", userId)
        .select()
        .single();
    if (error) {
        console.error(
            "UPDATE USER PROFILE:",
            error
        );
        throw error;
    }
    return data;
}
// =====================================================
// SELL ACCESS
// =====================================================
async function getSellAccess(userId) {
    if (!userId) return null;
    const {
        data,
        error
    } = await supabaseClient
        .from("users")
        .select(`
            id,
            username,
            balance,
            sell_unlocked,
            withdraw_count,
            is_premium,
            premium_expires_at,
            is_banned,
            email_verified
        `)
        .eq("id", userId)
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
async function canUseSellLink(userId) {
    const user =
        await getSellAccess(userId);
    if (!user) {
        return false;
    }
    if (user.is_banned === true) {
        return false;
    }
    // Manual unlock
    if (user.sell_unlocked === true) {
        return true;
    }
    // Withdraw >= 3
    if (
        Number(
            user.withdraw_count || 0
        ) >= 3
    ) {
        return true;
    }
    // Premium
    if (user.is_premium === true) {
        if (!user.premium_expires_at) {
            return true;
        }
        const expires =
            new Date(
                user.premium_expires_at
            );
        if (
            !isNaN(expires.getTime()) &&
            expires > new Date()
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
async function getLinks(userId) {
    if (!userId) return [];
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
                "GET LINKS:",
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
async function getSellLinks(userId) {
    if (!userId) return [];
    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .select(LINK_COLUMNS)
        .eq("user_id", userId)
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
async function getAdsLinks(userId) {
    if (!userId) return [];
    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .select(LINK_COLUMNS)
        .eq("user_id", userId)
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
async function getLinkByCode(code) {
    if (!code) return null;
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
async function createLink(payload = {}) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    if (!payload.short_code) {
        throw new Error(
            "short_code wajib diisi"
        );
    }
    if (!payload.title) {
        throw new Error(
            "title wajib diisi"
        );
    }
    const destination =
        payload.destination ||
        payload.destination_url;
    if (!destination) {
        throw new Error(
            "destination wajib diisi"
        );
    }
    const insert = {
        user_id:
            payload.user_id,
        type:
            payload.type ||
            "ads",
        title:
            payload.title,
        alias:
            payload.alias ||
            null,
        destination,
        campaign:
            payload.campaign ||
            null,
        device:
            payload.device ||
            "all",
        expired_at:
            payload.expired_at ||
            null,
        price:
            Number(
                payload.price || 0
            ),
        status:
            payload.status ||
            "active",
        views: 0,
        clicks: 0,
        earnings: 0,
        short_code:
            payload.short_code,
        destination_url:
            payload.destination_url ||
            destination,
        link_type:
            payload.link_type ||
            payload.type ||
            "ads",
        custom_alias:
            payload.custom_alias ||
            null,
        campaign_name:
            payload.campaign_name ||
            null,
        target_device:
            payload.target_device ||
            payload.device ||
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
    payload = {}
) {
    if (!id) {
        throw new Error(
            "Link ID wajib diisi"
        );
    }
    const allowedFields = [
        "type",
        "title",
        "alias",
        "destination",
        "campaign",
        "device",
        "expired_at",
        "price",
        "status",
        "short_code",
        "destination_url",
        "link_type",
        "custom_alias",
        "campaign_name",
        "target_device",
        "expired"
    ];
    const update = {};
    allowedFields.forEach(
        field => {
            if (
                payload[field] !==
                undefined
            ) {
                update[field] =
                    payload[field];
            }
        }
    );
    const {
        data,
        error
    } = await supabaseClient
        .from("links")
        .update(update)
        .eq("id", id)
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
        .eq("id", id);
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
async function createLinkView(
    payload = {}
) {
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }
    const insert = {
        link_id:
            payload.link_id,
        visitor_ip:
            payload.visitor_ip ||
            null,
        country:
            payload.country ||
            null,
        device:
            payload.device ||
            null,
        browser:
            payload.browser ||
            null,
        referer:
            payload.referer ||
            null,
        is_valid:
            payload.is_valid !== false,
        earning:
            Number(
                payload.earning || 0
            )
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
async function getLinkViews(linkId) {
    if (!linkId) return [];
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
// LINK ACCESS
// =====================================================
async function createLinkAccess(
    payload = {}
) {
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }
    const insert = {
        link_id:
            payload.link_id,
        payment_id:
            payload.payment_id ||
            null,
        buyer_id:
            payload.buyer_id ||
            null
    };
    const {
        data,
        error
    } = await supabaseClient
        .from("link_access")
        .insert(insert)
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE LINK ACCESS:",
            error
        );
        throw error;
    }
    return data;
}
async function getLinkAccess(
    linkId,
    buyerId = null
) {
    if (!linkId) return [];
    let query =
        supabaseClient
            .from("link_access")
            .select("*")
            .eq(
                "link_id",
                linkId
            );
    if (buyerId) {
        query =
            query.eq(
                "buyer_id",
                buyerId
            );
    }
    const {
        data,
        error
    } = await query;
    if (error) {
        console.error(
            "GET LINK ACCESS:",
            error
        );
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
    payload = {}
) {
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }
    if (!payload.seller_id) {
        throw new Error(
            "seller_id wajib diisi"
        );
    }
    const insert = {
        link_id:
            payload.link_id,
        buyer_id:
            payload.buyer_id ||
            null,
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
            payload.payment_id ||
            null,
        paid_at:
            payload.paid_at ||
            null,
        fee:
            Number(
                payload.fee || 0
            ),
        seller_receive:
            Number(
                payload.seller_receive ||
                0
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
async function getSellOrders(
    userId
) {
    if (!userId) return [];
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
// LINK PAYMENTS
// =====================================================
async function createLinkPayment(
    payload = {}
) {
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }
    if (
        payload.amount ===
        undefined
    ) {
        throw new Error(
            "amount wajib diisi"
        );
    }
    const insert = {
        link_id:
            payload.link_id,
        invoice_id:
            payload.invoice_id ||
            null,
        amount:
            Number(
                payload.amount
            ),
        qr_url:
            payload.qr_url ||
            null,
        status:
            payload.status ||
            "WAITING",
        expired_at:
            payload.expired_at ||
            null,
        paid_at:
            payload.paid_at ||
            null
    };
    const {
        data,
        error
    } = await supabaseClient
        .from("link_payments")
        .insert(insert)
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE LINK PAYMENT:",
            error
        );
        throw error;
    }
    return data;
}
async function getLinkPayment(
    invoiceId
) {
    if (!invoiceId) return null;
    const {
        data,
        error
    } = await supabaseClient
        .from("link_payments")
        .select("*")
        .eq(
            "invoice_id",
            invoiceId
        )
        .maybeSingle();
    if (error) {
        console.error(
            "GET LINK PAYMENT:",
            error
        );
        return null;
    }
    return data || null;
}
async function updateLinkPayment(
    invoiceId,
    payload = {}
) {
    if (!invoiceId) {
        throw new Error(
            "invoiceId wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("link_payments")
        .update(payload)
        .eq(
            "invoice_id",
            invoiceId
        )
        .select()
        .single();
    if (error) {
        console.error(
            "UPDATE LINK PAYMENT:",
            error
        );
        throw error;
    }
    return data;
}
// =====================================================
// PAYMENT API
// =====================================================
async function createPayment(
    payload = {}
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
// PAYMENT REQUESTS
// =====================================================
async function createPaymentRequest(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    if (!payload.payment_name) {
        throw new Error(
            "payment_name wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("payment_requests")
        .insert({
            user_id:
                payload.user_id,
            payment_name:
                payload.payment_name,
            status:
                payload.status ||
                "pending"
        })
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE PAYMENT REQUEST:",
            error
        );
        throw error;
    }
    return data;
}
async function getPaymentRequests(
    userId = null
) {
    let query =
        supabaseClient
            .from("payment_requests")
            .select("*")
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
// WALLET
// =====================================================
async function getWalletTransactions(
    userId
) {
    if (!userId) return [];
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
async function createWalletTransaction(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    if (!payload.type) {
        throw new Error(
            "type wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("wallet_transactions")
        .insert({
            user_id:
                payload.user_id,
            type:
                payload.type,
            amount:
                Number(
                    payload.amount || 0
                ),
            title:
                payload.title ||
                null,
            description:
                payload.description ||
                null,
            status:
                payload.status ||
                "success"
        })
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE WALLET:",
            error
        );
        throw error;
    }
    return data;
}
// =====================================================
// TRANSACTIONS
// =====================================================
async function getTransactions(
    userId = null
) {
    let query =
        supabaseClient
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
            "GET TRANSACTIONS:",
            error
        );
        return [];
    }
    return data || [];
}
async function createTransaction(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("transactions")
        .insert({
            user_id:
                payload.user_id,
            type:
                payload.type ||
                "other",
            amount:
                Number(
                    payload.amount || 0
                ),
            description:
                payload.description ||
                null,
            title:
                payload.title ||
                "Transaction",
            status:
                payload.status ||
                "success"
        })
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE TRANSACTION:",
            error
        );
        throw error;
    }
    return data;
}
// =====================================================
// WITHDRAWS
// Legacy / Internal Withdraw Table
// =====================================================
async function getWithdraws(
    userId = null
) {
    let query =
        supabaseClient
            .from("withdraws")
            .select(`
                id,
                user_id,
                method,
                account_number,
                amount,
                status,
                created_at,
                type,
                fee
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
            "GET WITHDRAWS:",
            error
        );
        return [];
    }
    return data || [];
}
async function createWithdraw(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("withdraws")
        .insert({
            user_id:
                payload.user_id,
            method:
                payload.method,
            account_number:
                payload.account_number,
            amount:
                Number(
                    payload.amount || 0
                ),
            status:
                payload.status ||
                "pending",
            type:
                payload.type ||
                "withdraw",
            fee:
                Number(
                    payload.fee || 0
                )
        })
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
// WITHDRAWALS
// Main Withdrawal Table
// =====================================================
async function getWithdrawals(
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
async function createWithdrawal(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    if (
        payload.amount ===
        undefined
    ) {
        throw new Error(
            "amount wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("withdrawals")
        .insert({
            user_id:
                payload.user_id,
            amount:
                Number(
                    payload.amount
                ),
            method:
                payload.method ||
                null,
            account_name:
                payload.account_name ||
                null,
            account_number:
                payload.account_number ||
                null,
            status:
                payload.status ||
                "pending",
            paid_at:
                payload.paid_at ||
                null
        })
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
// PAYMENT METHODS
// =====================================================
async function getPaymentMethods(
    userId
) {
    if (!userId) return [];
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
async function createPaymentMethod(
    payload = {}
) {
    if (!payload.user_id) {
        throw new Error(
            "user_id wajib diisi"
        );
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("payment_methods")
        .insert({
            user_id:
                payload.user_id,
            bank_name:
                payload.bank_name ||
                null,
            account_name:
                payload.account_name ||
                null,
            account_number:
                payload.account_number ||
                null,
            method:
                payload.method ||
                null
        })
        .select()
        .single();
    if (error) {
        console.error(
            "CREATE PAYMENT METHOD:",
            error
        );
        throw error;
    }
    return data;
}
async function deletePaymentMethod(
    id
) {
    if (!id) {
        throw new Error(
            "Payment method ID wajib diisi"
        );
    }
    const {
        error
    } = await supabaseClient
        .from("payment_methods")
        .delete()
        .eq(
            "id",
            id
        );
    if (error) {
        throw error;
    }
    return true;
}
// =====================================================
// DAILY REPORTS
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
async function getReports(
    userId
) {
    if (!userId) return [];
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
            "GET REPORTS:",
            error
        );
        return [];
    }
    return data || [];
}
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
async function getTodayReport(
    userId
) {
    if (!userId) return null;
    const date =
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
        ).format(
            new Date()
        );
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
            date
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
// STATISTICS
// =====================================================
async function getStatistics(
    userId
) {
    if (!userId) {
        return {
            links: [],
            orders: [],
            paidOrders: [],
            totalAdsLinks: 0,
            totalSellLinks: 0,
            totalAdsViews: 0,
            totalAdsClicks: 0,
            totalSellViews: 0,
            totalSellClicks: 0,
            totalSold: 0,
            totalSellPrice: 0,
            totalSellFee: 0,
            totalSellEarn: 0
        };
    }
    const [
        links,
        orders
    ] = await Promise.all([
        getLinks(userId),
        getSellOrders(userId)
    ]);
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
            link =>
                String(
                    link.type
                ).toLowerCase() ===
                "ads"
        );
    const sellLinks =
        links.filter(
            link =>
                String(
                    link.type
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
// NOTIFICATIONS
// =====================================================
async function getNotifications(
    userId
) {
    if (!userId) return [];
    const {
        data,
        error
    } = await supabaseClient
        .from("notifications")
        .select("*")
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
async function markNotificationRead(
    id
) {
    if (!id) {
        throw new Error(
            "Notification ID wajib diisi"
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
            id
        )
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
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
            `)
            .order(
                "country",
                {
                    ascending: true
                }
            );
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
// REFERRALS
// =====================================================
async function getReferrals(
    userId = null
) {
    let query =
        supabaseClient
            .from("referrals")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );
    if (userId) {
        query =
            query.or(
                `referrer_id.eq.${userId},referred_id.eq.${userId}`
            );
    }
    const {
        data,
        error
    } = await query;
    if (error) {
        console.error(
            "GET REFERRALS:",
            error
        );
        return [];
    }
    return data || [];
}
// =====================================================
// EXPORT
// =====================================================
window.database = {
    // Supabase
    supabase:
        supabaseClient,
    // Auth / Users
    getUser,
    getUsers,
    getProfile,
    getCurrentProfile,
    getProfiles,
    updateProfile,
    logout,
    // Profiles
    getUserProfile,
    updateUserProfile,
    // Sell Access
    getSellAccess,
    canUseSellLink,
    // Links
    getLinks,
    getSellLinks,
    getAdsLinks,
    getLinkByCode,
    createLink,
    updateLink,
    deleteLink,
    // Link Views
    createLinkView,
    getLinkViews,
    // Link Access
    createLinkAccess,
    getLinkAccess,
    // Sell
    calculateSellPayment,
    createSellOrder,
    getSellOrders,
    // Link Payments
    createLinkPayment,
    getLinkPayment,
    updateLinkPayment,
    // Payment API
    createPayment,
    getPaymentStatus,
    checkSellPayment,
    // Payment Requests
    createPaymentRequest,
    getPaymentRequests,
    // Wallet
    getWalletTransactions,
    createWalletTransaction,
    // Transactions
    getTransactions,
    createTransaction,
    // Withdraws
    getWithdraws,
    createWithdraw,
    // Withdrawals
    getWithdrawals,
    createWithdrawal,
    // Payment Methods
    getPaymentMethods,
    createPaymentMethod,
    deletePaymentMethod,
    // Reports
    getDashboardReport,
    getReports,
    getTodayReport,
    upsertDailyReport,
    // Statistics
    getStatistics,
    // Announcements
    getAnnouncements,
    // Notifications
    getNotifications,
    markNotificationRead,
    // CPM
    getCPMMarket,
    getCPMRate,
    getCPMSettings,
    // Referrals
    getReferrals
};
console.log(
    "DATABASE JS READY",
    window.database
);
