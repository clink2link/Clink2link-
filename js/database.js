// js/database.js
// =====================================================
// CLICK2PAY DATABASE
// HARDENED FRONTEND VERSION
// Supabase + Backend API
// =====================================================

const SUPABASE_URL =
    "https://lwjtagxkqeprjpupmadf.supabase.co";

// =====================================================
// IMPORTANT
// =====================================================
// WAJIB gunakan ANON/PUBLISHABLE KEY di frontend.
//
// JANGAN masukkan:
// service_role key
//
// Ambil key dari:
// Supabase Dashboard
// → Project Settings
// → API
// → Publishable / anon key
// =====================================================

const SUPABASE_ANON_KEY =
    "GANTI_DENGAN_ANON_PUBLISHABLE_KEY";

const API_URL =
    "https://click2pay.my.id";

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseClient =
    supabase.createClient(
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
// LOCAL HELPERS
// =====================================================

function currentUserId() {
    return (
        localStorage.getItem("user_id") ||
        null
    );
}

function saveUserLocal(user) {
    if (!user) return;

    if (user.id) {
        localStorage.setItem(
            "user_id",
            String(user.id)
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

// =====================================================
// SESSION
// =====================================================

async function getSession() {
    try {
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
    } catch (error) {
        console.error(
            "GET SESSION EXCEPTION:",
            error
        );

        return null;
    }
}

async function requireSession() {
    const session =
        await getSession();

    if (!session?.user) {
        throw new Error(
            "User belum login."
        );
    }

    return session;
}

// =====================================================
// GENERIC API
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {
    const session =
        await getSession();

    const headers = {
        "Content-Type":
            "application/json",
        ...(options.headers || {})
    };

    /*
     * Supabase access token dikirim
     * ke backend agar backend dapat
     * memvalidasi user.
     */
    if (session?.access_token) {
        headers.Authorization =
            `Bearer ${session.access_token}`;
    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let result = null;

    try {
        result =
            await response.json();
    } catch {
        result = null;
    }

    if (!response.ok) {
        throw new Error(
            result?.error ||
            result?.message ||
            `Request gagal (${response.status})`
        );
    }

    return (
        result?.data ??
        result
    );
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
            .eq(
                "id",
                session.user.id
            )
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

        return data || null;

    } catch (error) {
        console.error(
            "GET USER EXCEPTION:",
            error
        );

        return null;
    }
}

async function getCurrentProfile() {
    return getUser();
}

async function getProfile(userId) {
    if (!userId) {
        return null;
    }

    try {
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
            .maybeSingle();

        if (error) {
            console.error(
                "GET PROFILE:",
                error
            );
            return null;
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

async function getUsers() {
    /*
     * Jangan gunakan ini dari halaman user biasa.
     *
     * Untuk admin, sebaiknya gunakan:
     * GET /api/admin/users
     *
     * agar service role tetap berada di backend.
     */
    try {
        return await apiRequest(
            "/api/admin/users"
        );
    } catch (error) {
        console.error(
            "GET USERS:",
            error
        );

        return [];
    }
}

async function getProfiles() {
    return getUsers();
}

async function updateProfile(
    payload = {}
) {
    const session =
        await requireSession();

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
        return getUser();
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
        console.error(
            "UPDATE PROFILE:",
            error
        );
        throw error;
    }

    saveUserLocal(data);

    return data;
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
        .eq(
            "id",
            userId
        )
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

    const session =
        await requireSession();

    /*
     * User hanya boleh mengubah
     * profile miliknya sendiri.
     */
    if (
        String(userId) !==
        String(session.user.id)
    ) {
        throw new Error(
            "Tidak boleh mengubah profile user lain."
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
        .eq(
            "id",
            session.user.id
        )
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

    const session =
        await getSession();

    if (!session?.user) {
        return null;
    }

    /*
     * Jangan izinkan user membaca
     * data sell access user lain.
     */
    if (
        String(userId) !==
        String(session.user.id)
    ) {
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
            balance,
            sell_unlocked,
            withdraw_count,
            is_premium,
            premium_expires_at,
            is_banned,
            email_verified
        `)
        .eq(
            "id",
            session.user.id
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

async function canUseSellLink(userId) {
    const user =
        await getSellAccess(userId);

    if (!user) {
        return false;
    }

    if (user.is_banned === true) {
        return false;
    }

    if (user.sell_unlocked === true) {
        return true;
    }

    if (
        Number(
            user.withdraw_count || 0
        ) >= 3
    ) {
        return true;
    }

    if (user.is_premium === true) {
        if (!user.premium_expires_at) {
            return true;
        }

        const expires =
            new Date(
                user.premium_expires_at
            );

        if (
            !isNaN(
                expires.getTime()
            ) &&
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

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    /*
     * Jangan percaya userId dari
     * localStorage.
     */
    if (
        String(userId) !==
        String(session.user.id)
    ) {
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
            session.user.id
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
}

async function getSellLinks(userId) {
    const links =
        await getLinks(userId);

    return links.filter(
        link =>
            String(
                link.type
            ).toLowerCase() ===
                "sell" ||
            String(
                link.link_type
            ).toLowerCase() ===
                "sell"
    );
}

async function getAdsLinks(userId) {
    const links =
        await getLinks(userId);

    return links.filter(
        link =>
            String(
                link.type
            ).toLowerCase() ===
                "ads" ||
            String(
                link.link_type
            ).toLowerCase() ===
                "ads"
    );
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
    const session =
        await requireSession();

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

    /*
     * user_id SELALU diambil dari session.
     * Jangan percaya payload.user_id.
     */
    const insert = {
        user_id:
            session.user.id,

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

    const session =
        await requireSession();

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
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            session.user.id
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

    const session =
        await requireSession();

    const {
        error
    } = await supabaseClient
        .from("links")
        .delete()
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            session.user.id
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
// IMPORTANT:
// Jangan percaya "earning" dari browser.
// Untuk earning production gunakan backend.
//
// Endpoint yang disarankan:
// POST /api/link/view
// =====================================================

async function createLinkView(
    payload = {}
) {
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    return apiRequest(
        "/api/link/view",
        {
            method: "POST",
            body: JSON.stringify({
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
                    null
            })
        }
    );
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
    /*
     * Jangan membuat akses setelah
     * pembayaran hanya dari frontend.
     *
     * Backend settlement yang harus
     * membuat link_access.
     */
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    return apiRequest(
        "/api/link/access",
        {
            method: "POST",
            body: JSON.stringify({
                link_id:
                    payload.link_id,

                payment_id:
                    payload.payment_id ||
                    null
            })
        }
    );
}

async function getLinkAccess(
    linkId,
    buyerId = null
) {
    if (!linkId) return [];

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    let query =
        supabaseClient
            .from("link_access")
            .select("*")
            .eq(
                "link_id",
                linkId
            );

    /*
     * Buyer ID tidak boleh sembarang.
     */
    query =
        query.eq(
            "buyer_id",
            session.user.id
        );

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

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        return {
            fee: 0,
            seller_receive: 0
        };
    }

    const fee =
        Math.floor(
            amount * 0.20
        );

    return {
        fee,
        seller_receive:
            amount - fee
    };
}

// =====================================================
// SELL ORDERS
// =====================================================

async function createSellOrder(
    payload = {}
) {
    /*
     * CREATE SELL ORDER harus melalui
     * backend.
     *
     * Backend harus:
     * - validasi seller
     * - validasi link
     * - validasi harga
     * - hitung fee
     * - hitung seller_receive
     * - buat order
     * - buat invoice
     */
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    return apiRequest(
        "/api/sell-order",
        {
            method: "POST",
            body: JSON.stringify({
                link_id:
                    payload.link_id,

                price:
                    Number(
                        payload.price || 0
                    ),

                quantity:
                    Number(
                        payload.quantity || 1
                    )
            })
        }
    );
}

async function getSellOrders(
    userId
) {
    if (!userId) return [];

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    if (
        String(userId) !==
        String(session.user.id)
    ) {
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
            session.user.id
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
    /*
     * Payment record dibuat backend.
     */
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    return apiRequest(
        "/api/link-payment",
        {
            method: "POST",
            body: JSON.stringify({
                link_id:
                    payload.link_id,

                amount:
                    Number(
                        payload.amount || 0
                    )
            })
        }
    );
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
    /*
     * Payment status tidak boleh
     * diubah bebas oleh frontend.
     *
     * Gunakan backend:
     * POST /api/payment/webhook
     * atau verify-payment.
     */
    if (!invoiceId) {
        throw new Error(
            "invoiceId wajib diisi"
        );
    }

    return apiRequest(
        "/api/payment/verify",
        {
            method: "POST",
            body: JSON.stringify({
                invoice_id:
                    invoiceId
            })
        }
    );
}

// =====================================================
// PAYMENT API
// =====================================================

async function createPayment(
    payload = {}
) {
    return apiRequest(
        "/api/create-payment",
        {
            method: "POST",
            body: JSON.stringify(
                payload
            )
        }
    );
}

async function getPaymentStatus(
    orderId
) {
    if (!orderId) {
        throw new Error(
            "orderId wajib diisi"
        );
    }

    return apiRequest(
        `/api/payment-status/${encodeURIComponent(
            orderId
        )}`
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

    return apiRequest(
        `/api/check-payment?invoice_id=${encodeURIComponent(
            invoiceId
        )}`
    );
}

// =====================================================
// PAYMENT REQUESTS
// =====================================================

async function createPaymentRequest(
    payload = {}
) {
    const session =
        await requireSession();

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
                session.user.id,

            payment_name:
                payload.payment_name,

            status:
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
    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    const targetUser =
        userId || session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("payment_requests")
        .select("*")
        .eq(
            "user_id",
            session.user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

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

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    if (
        String(userId) !==
        String(session.user.id)
    ) {
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
            session.user.id
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

/*
 * JANGAN izinkan frontend membuat
 * wallet transaction secara langsung.
 *
 * Semua transaksi saldo berasal
 * dari backend/RPC.
 */
async function createWalletTransaction(
    payload = {}
) {
    return apiRequest(
        "/api/wallet/transaction",
        {
            method: "POST",
            body: JSON.stringify({
                type:
                    payload.type,

                title:
                    payload.title ||
                    null,

                description:
                    payload.description ||
                    null
            })
        }
    );
}

// =====================================================
// TRANSACTIONS
// =====================================================

async function getTransactions(
    userId = null
) {
    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    const targetUser =
        userId || session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
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
            session.user.id
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

async function createTransaction(
    payload = {}
) {
    return apiRequest(
        "/api/transaction",
        {
            method: "POST",
            body: JSON.stringify({
                type:
                    payload.type ||
                    "other",

                title:
                    payload.title ||
                    "Transaction",

                description:
                    payload.description ||
                    null
            })
        }
    );
}

// =====================================================
// WITHDRAWALS
// =====================================================

async function getWithdrawals(
    userId = null
) {
    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    const targetUser =
        userId || session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
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
        .eq(
            "user_id",
            session.user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

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
    /*
     * Withdrawal WAJIB backend.
     *
     * Backend:
     * 1. cek session
     * 2. cek balance
     * 3. lock balance
     * 4. buat withdrawal
     * 5. kurangi saldo
     * 6. buat wallet transaction
     */
    if (
        payload.amount ===
        undefined
    ) {
        throw new Error(
            "amount wajib diisi"
        );
    }

    return apiRequest(
        "/api/withdrawals",
        {
            method: "POST",
            body: JSON.stringify({
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
                    null
            })
        }
    );
}

// =====================================================
// LEGACY WITHDRAWS
// =====================================================

async function getWithdraws(
    userId = null
) {
    /*
     * Legacy wrapper.
     *
     * Gunakan withdrawals untuk
     * sistem baru.
     */
    return getWithdrawals(userId);
}

async function createWithdraw(
    payload = {}
) {
    return createWithdrawal(
        payload
    );
}

// =====================================================
// PAYMENT METHODS
// =====================================================

async function getPaymentMethods(
    userId
) {
    if (!userId) return [];

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    if (
        String(userId) !==
        String(session.user.id)
    ) {
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
            session.user.id
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
    const session =
        await requireSession();

    const {
        data,
        error
    } = await supabaseClient
        .from("payment_methods")
        .insert({
            user_id:
                session.user.id,

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

    const session =
        await requireSession();

    const {
        error
    } = await supabaseClient
        .from("payment_methods")
        .delete()
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            session.user.id
        );

    if (error) {
        console.error(
            "DELETE PAYMENT METHOD:",
            error
        );

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

    const session =
        await getSession();

    if (
        !session?.user ||
        String(userId) !==
        String(session.user.id)
    ) {
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
            session.user.id
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

async function getTodayReport(
    userId
) {
    if (!userId) return null;

    const session =
        await getSession();

    if (
        !session?.user ||
        String(userId) !==
        String(session.user.id)
    ) {
        return null;
    }

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
            session.user.id
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

/*
 * Daily report sebaiknya dibuat
 * oleh backend/worker, bukan user.
 */
async function upsertDailyReport(
    userId,
    reportDate,
    payload = {}
) {
    return apiRequest(
        "/api/reports/daily",
        {
            method: "POST",
            body: JSON.stringify({
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

                sell_views:
                    Number(
                        payload.sell_views || 0
                    ),

                sell_clicks:
                    Number(
                        payload.sell_clicks || 0
                    )
            })
        }
    );
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
                "ads" ||
                String(
                    link.link_type
                ).toLowerCase() ===
                "ads"
        );

    const sellLinks =
        links.filter(
            link =>
                String(
                    link.type
                ).toLowerCase() ===
                "sell" ||
                String(
                    link.link_type
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

    const session =
        await getSession();

    if (
        !session?.user ||
        String(userId) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            session.user.id
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

    const session =
        await requireSession();

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
        .eq(
            "user_id",
            session.user.id
        )
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// =====================================================
// CPM
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
    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    const targetUser =
        userId || session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("referrals")
        .select("*")
        .or(
            `referrer_id.eq.${session.user.id},referred_id.eq.${session.user.id}`
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

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

    // Session
    getSession,

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

    // Withdraws legacy
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
    "CLICK2PAY DATABASE READY",
    window.database
);
