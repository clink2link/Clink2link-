// js/database.js
// =====================================================
// CLICK2PAY DATABASE
// FINAL FRONTEND VERSION
// Supabase + Backend API
// =====================================================

"use strict";

// =====================================================
// CONFIG
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

if (
    typeof supabase === "undefined" ||
    typeof supabase.createClient !== "function"
) {
    console.error(
        "CLICK2PAY: Supabase library belum dimuat."
    );
}

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
// CONSTANTS
// =====================================================

const LINK_TYPES = {
    ADS: "ads",
    SELL: "sell"
};

const PAID_STATUSES = new Set([
    "paid",
    "completed",
    "success",
    "settled"
]);

// =====================================================
// LOCAL STORAGE
// =====================================================

function currentUserId() {
    return (
        localStorage.getItem("user_id") ||
        null
    );
}

function saveUserLocal(user) {
    if (!user) return;

    if (user.id !== undefined && user.id !== null) {
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
// SAFE HELPERS
// =====================================================

function normalizeString(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}

function normalizeLinkType(link) {
    if (!link) return "";

    const type =
        normalizeString(
            link.type
        ).toLowerCase();

    const linkType =
        normalizeString(
            link.link_type
        ).toLowerCase();

    if (
        type === LINK_TYPES.SELL ||
        linkType === LINK_TYPES.SELL
    ) {
        return LINK_TYPES.SELL;
    }

    if (
        type === LINK_TYPES.ADS ||
        linkType === LINK_TYPES.ADS
    ) {
        return LINK_TYPES.ADS;
    }

    return "";
}

function isSellLink(link) {
    return (
        normalizeLinkType(link) ===
        LINK_TYPES.SELL
    );
}

function isAdsLink(link) {
    return (
        normalizeLinkType(link) ===
        LINK_TYPES.ADS
    );
}

function normalizeLink(link) {
    if (!link) return null;

    const normalized = {
        ...link
    };

    const type =
        normalizeLinkType(link);

    normalized.type =
        type ||
        normalizeString(link.type);

    normalized.link_type =
        type ||
        normalizeString(link.link_type);

    normalized.title =
        link.title ||
        link.name ||
        "";

    normalized.destination =
        link.destination ||
        link.destination_url ||
        "";

    normalized.destination_url =
        link.destination_url ||
        link.destination ||
        "";

    normalized.short_code =
        link.short_code ||
        link.code ||
        "";

    normalized.total_views =
        Number(
            link.total_views ??
            link.views ??
            0
        );

    normalized.total_clicks =
        Number(
            link.total_clicks ??
            link.clicks ??
            0
        );

    normalized.total_earnings =
        Number(
            link.total_earnings ??
            link.earnings ??
            0
        );

    normalized.views =
        Number(
            link.views ??
            link.total_views ??
            0
        );

    normalized.clicks =
        Number(
            link.clicks ??
            link.total_clicks ??
            0
        );

    normalized.earnings =
        Number(
            link.earnings ??
            link.total_earnings ??
            0
        );

    normalized.price =
        Number(
            link.price || 0
        );

    normalized.sales =
        Number(
            link.sales || 0
        );

    normalized.sold =
        Number(
            link.sold || 0
        );

    return normalized;
}

function normalizeLinks(rows) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows
        .map(normalizeLink)
        .filter(Boolean);
}

function emptyStatistics() {
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

// =====================================================
// SESSION
// =====================================================

async function getSession() {
    try {
        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

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

    if (session?.access_token) {
        headers.Authorization =
            `Bearer ${session.access_token}`;
    }

    let response;

    try {
        response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );
    } catch (error) {
        console.error(
            "API NETWORK ERROR:",
            error
        );

        throw new Error(
            "Tidak dapat terhubung ke server."
        );
    }

    let result = null;

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        try {
            result =
                await response.json();
        } catch {
            result = null;
        }
    } else {
        try {
            const text =
                await response.text();

            result =
                text
                    ? {
                        message: text
                    }
                    : null;
        } catch {
            result = null;
        }
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
// USER
// =====================================================

async function getUser() {
    try {
        const session =
            await getSession();

        if (!session?.user) {
            clearLocalUser();
            return null;
        }

        const {
            data,
            error
        } =
            await supabaseClient
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
        } =
            await supabaseClient
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

    for (
        const field of allowedFields
    ) {
        if (
            payload[field] !==
            undefined
        ) {
            update[field] =
                payload[field];
        }
    }

    if (
        Object.keys(update).length ===
        0
    ) {
        return getUser();
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
// PROFILES
// =====================================================

async function getUserProfile(userId) {
    if (!userId) return null;

    const {
        data,
        error
    } =
        await supabaseClient
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

    for (
        const field of allowedFields
    ) {
        if (
            payload[field] !==
            undefined
        ) {
            update[field] =
                payload[field];
        }
    }

    if (
        Object.keys(update).length ===
        0
    ) {
        return getUserProfile(
            userId
        );
    }

    const {
        data,
        error
    } =
        await supabaseClient
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

    if (
        String(userId) !==
        String(session.user.id)
    ) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
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

async function canUseSellLink(
    userId
) {
    const user =
        await getSellAccess(
            userId
        );

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
        if (
            !user.premium_expires_at
        ) {
            return true;
        }

        const expires =
            new Date(
                user.premium_expires_at
            );

        if (
            !Number.isNaN(
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
// PENTING:
// Jangan menggunakan daftar kolom panjang
// yang dapat menyebabkan seluruh query gagal
// jika salah satu kolom tidak tersedia.
//
// Gunakan "*" agar Ads Link dan Sell Link
// tetap dapat dibaca selama row ada.
// =====================================================

async function getLinks(userId) {
    if (!userId) {
        return [];
    }

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

    try {
        const {
            data,
            error
        } =
            await supabaseClient
                .from("links")
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
                "GET LINKS:",
                error
            );

            return [];
        }

        return normalizeLinks(
            data || []
        );

    } catch (error) {
        console.error(
            "GET LINKS EXCEPTION:",
            error
        );

        return [];
    }
}

// =====================================================
// ADS LINKS
// =====================================================

async function getAdsLinks(userId) {
    const links =
        await getLinks(userId);

    return links.filter(
        isAdsLink
    );
}

// =====================================================
// SELL LINKS
// =====================================================

async function getSellLinks(userId) {
    const links =
        await getLinks(userId);

    return links.filter(
        isSellLink
    );
}

// =====================================================
// LINK BY CODE
// =====================================================

async function getLinkByCode(code) {
    const normalizedCode =
        normalizeString(code);

    if (!normalizedCode) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("links")
            .select("*")
            .eq(
                "short_code",
                normalizedCode
            )
            .maybeSingle();

    if (error) {
        console.error(
            "GET LINK BY CODE:",
            error
        );

        return null;
    }

    return normalizeLink(
        data
    );
}

// =====================================================
// CREATE LINK
// =====================================================

async function createLink(
    payload = {}
) {
    const session =
        await requireSession();

    const shortCode =
        normalizeString(
            payload.short_code
        );

    const title =
        normalizeString(
            payload.title
        );

    const destination =
        normalizeString(
            payload.destination ||
            payload.destination_url
        );

    if (!shortCode) {
        throw new Error(
            "short_code wajib diisi"
        );
    }

    if (!title) {
        throw new Error(
            "title wajib diisi"
        );
    }

    if (!destination) {
        throw new Error(
            "destination wajib diisi"
        );
    }

    const type =
        normalizeString(
            payload.type ||
            payload.link_type ||
            "ads"
        ).toLowerCase();

    if (
        type !== LINK_TYPES.ADS &&
        type !== LINK_TYPES.SELL
    ) {
        throw new Error(
            "Tipe link tidak valid."
        );
    }

    const insert = {
        user_id:
            session.user.id,

        type,

        title,

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
            shortCode,

        destination_url:
            destination,

        link_type:
            type,

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
    } =
        await supabaseClient
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

    return normalizeLink(
        data
    );
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

    for (
        const field of allowedFields
    ) {
        if (
            payload[field] !==
            undefined
        ) {
            update[field] =
                payload[field];
        }
    }

    if (
        update.type !== undefined
    ) {
        update.type =
            normalizeString(
                update.type
            ).toLowerCase();
    }

    if (
        update.link_type !== undefined
    ) {
        update.link_type =
            normalizeString(
                update.link_type
            ).toLowerCase();
    }

    const {
        data,
        error
    } =
        await supabaseClient
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

    return normalizeLink(
        data
    );
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
    } =
        await supabaseClient
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
    if (!linkId) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
    linkId
) {
    if (!linkId) {
        return [];
    }

    const session =
        await getSession();

    if (!session?.user) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("link_access")
            .select("*")
            .eq(
                "link_id",
                linkId
            )
            .eq(
                "buyer_id",
                session.user.id
            );

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

function calculateSellPayment(
    price
) {
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
    if (!payload.link_id) {
        throw new Error(
            "link_id wajib diisi"
        );
    }

    const price =
        Number(
            payload.price || 0
        );

    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {
        throw new Error(
            "Harga sell tidak valid."
        );
    }

    return apiRequest(
        "/api/sell-order",
        {
            method: "POST",
            body: JSON.stringify({
                link_id:
                    payload.link_id,

                price,

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
    if (!userId) {
        return [];
    }

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
    } =
        await supabaseClient
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
    if (!invoiceId) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
    invoiceId
) {
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
// PAYMENT
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
    } =
        await supabaseClient
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
        userId ||
        session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
    if (!userId) {
        return [];
    }

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
    } =
        await supabaseClient
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
        userId ||
        session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
        userId ||
        session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
    if (
        payload.amount ===
        undefined
    ) {
        throw new Error(
            "amount wajib diisi"
        );
    }

    const amount =
        Number(
            payload.amount
        );

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "Jumlah withdrawal tidak valid."
        );
    }

    return apiRequest(
        "/api/withdrawals",
        {
            method: "POST",
            body: JSON.stringify({
                amount,

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
// LEGACY WITHDRAW
// =====================================================

async function getWithdraws(
    userId = null
) {
    return getWithdrawals(
        userId
    );
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
    if (!userId) {
        return [];
    }

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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
// REPORTS
// =====================================================

async function getDashboardReport() {
    const {
        data,
        error
    } =
        await supabaseClient
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
    if (!userId) {
        return [];
    }

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
    } =
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
    if (!userId) {
        return null;
    }

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
    } =
        await supabaseClient
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
        return emptyStatistics();
    }

    const [
        links,
        orders
    ] =
        await Promise.all([
            getLinks(userId),
            getSellOrders(userId)
        ]);

    const paidOrders =
        orders.filter(
            order =>
                PAID_STATUSES.has(
                    normalizeString(
                        order.status
                    ).toLowerCase()
                )
        );

    const adsLinks =
        links.filter(
            isAdsLink
        );

    const sellLinks =
        links.filter(
            isSellLink
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
    } =
        await supabaseClient
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
    if (!userId) {
        return [];
    }

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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
        console.error(
            "MARK NOTIFICATION:",
            error
        );

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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
    } =
        await query;

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
        userId ||
        session.user.id;

    if (
        String(targetUser) !==
        String(session.user.id)
    ) {
        return [];
    }

    const {
        data,
        error
    } =
        await supabaseClient
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
// GLOBAL EXPORT
// =====================================================

window.database = {

    // Core
    supabase:
        supabaseClient,

    // Session
    getSession,

    // User
    getUser,
    getUsers,
    getProfile,
    getCurrentProfile,
    getProfiles,
    updateProfile,
    logout,

    // Profile
    getUserProfile,
    updateUserProfile,

    // Sell access
    getSellAccess,
    canUseSellLink,

    // Links
    getLinks,
    getAdsLinks,
    getSellLinks,
    getLinkByCode,
    createLink,
    updateLink,
    deleteLink,

    // Link analytics
    createLinkView,
    getLinkViews,

    // Link access
    createLinkAccess,
    getLinkAccess,

    // Sell
    calculateSellPayment,
    createSellOrder,
    getSellOrders,

    // Link payment
    createLinkPayment,
    getLinkPayment,
    updateLinkPayment,

    // Payment
    createPayment,
    getPaymentStatus,
    checkSellPayment,

    // Payment requests
    createPaymentRequest,
    getPaymentRequests,

    // Wallet
    getWalletTransactions,
    createWalletTransaction,

    // Transactions
    getTransactions,
    createTransaction,

    // Withdraw
    getWithdraws,
    createWithdraw,
    getWithdrawals,
    createWithdrawal,

    // Payment methods
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

// =====================================================
// READY
// =====================================================

console.log(
    "CLICK2PAY DATABASE READY",
    {
        api: API_URL,
        supabase: SUPABASE_URL,
        sell: true,
        ads: true
    }
);
