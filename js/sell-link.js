/* =================================
CLICK2PAY SELL LINK SYSTEM
================================= */

document.addEventListener("DOMContentLoaded", () => {

let sellActive = false;

let sellLinks = [];
let filteredLinks = [];
let sellOrders = [];

let currentUser = null;
let currentProfile = null;
let currentFilter = "all";

/* =========================
LOAD USER
========================= */

async function loadUser() {

    try {

        if (!window.database) {
            console.error("DATABASE BELUM READY");
            return null;
        }

        if (currentUser) {
            return currentUser;
        }

        const user = await database.getUser();

        if (!user) {
            console.error("USER TIDAK DITEMUKAN");
            return null;
        }

        currentUser = user;

        currentProfile = await database.getProfile(user.id);

        const sellUnlocked =
            user.sell_unlocked === true;

        const withdrawCount =
            Number(user.withdraw_count || 0);

        const withdrawUnlocked =
            withdrawCount >= 3;

        const premiumActive =
            user.is_premium === true &&
            user.premium_expires_at &&
            new Date(user.premium_expires_at).getTime() > Date.now();

        sellActive =
            sellUnlocked ||
            withdrawUnlocked ||
            premiumActive;

        console.log("CURRENT USER:", currentUser);
        console.log("CURRENT PROFILE:", currentProfile);

        console.log("SELL ACCESS:", {
            sell_unlocked: sellUnlocked,
            withdraw_count: withdrawCount,
            withdraw_requirement: withdrawUnlocked,
            is_premium: user.is_premium,
            premium_expires_at: user.premium_expires_at,
            premium_active: premiumActive,
            sellActive: sellActive
        });

        checkAccess();

        return currentUser;

    } catch (err) {

        console.error("LOAD USER ERROR:", err);

        currentUser = null;
        currentProfile = null;
        sellActive = false;

        checkAccess();

        return null;
    }

}

/* =========================
LOAD SELL ORDERS
========================= */

async function loadSellOrders() {

    try {

        if (!currentUser) {
            sellOrders = [];
            return;
        }

        const { data, error } = await database.supabase
            .from("sell_orders")
            .select(`
                link_id,
                seller_id,
                price,
                seller_receive,
                status,
                paid_at
            `)
            .eq("seller_id", currentUser.id);

        if (error) throw error;

        sellOrders = Array.isArray(data) ? data : [];

        console.log("SELL ORDERS:", sellOrders);

    } catch (err) {

        console.error("LOAD SELL ORDER ERROR:", err);

        sellOrders = [];

    }

}

/* =========================
LOAD SELL LINKS
========================= */

async function loadSellLinks() {

    try {

        if (!currentUser) {
            console.error("USER BELUM LOGIN");
            return;
        }

        const data = await database.getLinks(currentUser.id);

        if (!Array.isArray(data)) {

            sellLinks = [];
            filteredLinks = [];

            renderSellStats();
            renderLinks();

            return;

        }

        sellLinks = data.filter(link =>
            String(link.link_type || link.type).toLowerCase() === "sell"
        );

        filteredLinks = [...sellLinks];

        renderSellStats();
        applyFilter();

        console.log("TOTAL SELL LINK:", sellLinks.length);

    } catch (err) {

        console.error("LOAD SELL LINK ERROR:", err);

        sellLinks = [];
        filteredLinks = [];

        renderSellStats();

        const box = document.getElementById("sellList");

        if (box) {

            box.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Gagal Memuat Sell Link</h3>
                    <p>${err.message || "Unknown Error"}</p>
                </div>
            `;

        }

    }

}

/* =========================
HELPER
========================= */

function numberValue(value) {

    if (value === null || value === undefined) return 0;

    const number = Number(
        String(value).replace(/,/g, "")
    );

    return Number.isFinite(number) ? number : 0;

}

function getLinkOrders(linkId) {

    if (!linkId || !Array.isArray(sellOrders)) return [];

    return sellOrders.filter(order =>
        String(order.link_id) === String(linkId)
    );

}

function getPaidOrders(linkId) {

    return getLinkOrders(linkId).filter(order =>
        String(order.status || "").trim().toLowerCase() === "paid"
    );

}

/* =========================
STATS
========================= */

function renderSellStats() {

    const totalLink = document.getElementById("sellTotalLink");
    const totalPrice = document.getElementById("sellTotalPrice");
    const totalView = document.getElementById("sellTotalView");
    const totalSold = document.getElementById("sellTotalSold");
    const totalRevenue = document.getElementById("sellTotalRevenue");

    let totalSellPrice = 0;
    let totalRevenueValue = 0;
    let totalSoldValue = 0;
    let totalViewsValue = 0;

    for (const link of sellLinks) {

        totalSellPrice += numberValue(link.price);

        totalViewsValue += numberValue(
            link.total_views || link.views
        );

        const paidOrders = getPaidOrders(link.id);

        totalSoldValue += paidOrders.length || numberValue(
            link.sales || link.sold
        );

        for (const order of paidOrders) {

            totalRevenueValue += numberValue(
                order.seller_receive ?? order.price
            );

        }

    }

    if (totalLink)
        totalLink.textContent = sellLinks.length.toLocaleString("id-ID");

    if (totalPrice)
        totalPrice.textContent = "Rp " + totalSellPrice.toLocaleString("id-ID");

    if (totalView)
        totalView.textContent = totalViewsValue.toLocaleString("id-ID");

    if (totalSold)
        totalSold.textContent = totalSoldValue.toLocaleString("id-ID");

    if (totalRevenue)
        totalRevenue.textContent = "Rp " + totalRevenueValue.toLocaleString("id-ID");

    console.log({
        totalLink: sellLinks.length,
        totalSellPrice,
        totalViewsValue,
        totalSoldValue,
        totalRevenueValue
    });

}

/* =========================
SEARCH & FILTER
========================= */

const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".link-filter button");

function applyFilter() {

    const keyword = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    filteredLinks = sellLinks.filter((link) => {

        const title = String(link.title || "").toLowerCase();

        const destination = String(
            link.destination_url ||
            link.destination ||
            ""
        ).toLowerCase();

        const shortCode = String(
            link.short_code ||
            link.shortcode ||
            link.code ||
            ""
        ).toLowerCase();

        const matchSearch =
            title.includes(keyword) ||
            destination.includes(keyword) ||
            shortCode.includes(keyword);

        let matchFilter = true;

        switch (currentFilter) {
            case "active":
                matchFilter = String(link.status) === "active";
                break;

            case "inactive":
                matchFilter = String(link.status) !== "active";
                break;

            default:
                matchFilter = true;
        }

        return matchSearch && matchFilter;

    });

    renderLinks();

}

searchInput?.addEventListener("input", applyFilter);

filterButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        filterButtons.forEach(b =>
            b.classList.remove("active")
        );

        btn.classList.add("active");

        currentFilter = btn.dataset.filter || "all";

        applyFilter();

    });

});


/* =========================
GENERATE SHORT CODE
========================= */

function generateCode(length = 8) {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let code = "";

    if (window.crypto?.getRandomValues) {

        const bytes = new Uint8Array(length);

        crypto.getRandomValues(bytes);

        bytes.forEach(b => {
            code += chars[b % chars.length];
        });

    } else {

        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }

    }

    return code;

}


/* =========================
CREATE SELL LINK
========================= */

const createBtn = document.getElementById("createSellBtn");

if (createBtn) {

    createBtn.onclick = async () => {

        if (!sellActive)
            return alert("Sell Link belum aktif.");

        if (!currentUser)
            return alert("User belum login.");

        const title =
            document.getElementById("sellTitle")?.value.trim();

        const destination =
            document.getElementById("sellUrl")?.value.trim();

        const price = Math.floor(
            numberValue(
                document.getElementById("sellPrice")?.value
            )
        );

        if (!title || !destination || price < 10000) {

            alert("Lengkapi data.\nHarga minimal Rp10.000.");

            return;

        }

        try {

            const url = new URL(destination);

            if (!["http:", "https:"].includes(url.protocol))
                throw new Error();

        } catch {

            alert("URL tidak valid.");

            return;

        }

        createBtn.disabled = true;

        createBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Membuat Sell Link...';

        try {

            let short_code;

            do {

                short_code = generateCode();

            } while (await database.getLinkByCode(short_code));

            const newLink = await database.createLink({

                user_id: currentUser.id,

                type: "sell",

                link_type: "sell",

                title,

                destination,

                destination_url: destination,

                short_code,

                price,

                status: "active",

                sold: 0,

                sales: 0,

                views: 0,

                total_views: 0

            });

            document.getElementById("sellTitle").value = "";
            document.getElementById("sellUrl").value = "";
            document.getElementById("sellPrice").value = "";

            await loadSellOrders();
            await loadSellLinks();

            if (newLink?.id)
                generateLink(newLink.id);

            applyFilter();

            document.getElementById("createResult")?.replaceChildren();

            const result = document.getElementById("createResult");

            if (result) {

                result.innerHTML = `
                    <div class="success-box">
                        <i class="fa-solid fa-circle-check"></i>
                        Sell Link berhasil dibuat.
                    </div>
                `;

            }

        } catch (err) {

            console.error(err);

            alert(err.message || "Gagal membuat Sell Link.");

        } finally {

            createBtn.disabled = false;

            checkAccess();

        }

    };

}


/* =========================
RENDER SELL LINKS
========================= */

function renderLinks() {

    const box = document.getElementById("sellList");

    if (!box) return;

    if (!filteredLinks.length) {

        box.innerHTML = `
            <div class="empty">
                <i class="fa-solid fa-box-open"></i>
                <h3>Belum Ada Sell Link</h3>
                <p>Silakan buat Sell Link pertama Anda.</p>
            </div>
        `;

        return;

    }

    box.innerHTML = filteredLinks.map(link => {

        const shortCode =
            link.short_code ||
            link.shortcode ||
            link.code ||
            "";

        const sellUrl = `${location.origin}/b/${shortCode}`;

        const status = String(link.status) === "active";

        const paidOrders = getPaidOrders(link.id);

        const sold = paidOrders.length
            ? paidOrders.length
            : numberValue(link.sales ?? link.sold);

        const revenue = paidOrders.reduce(
            (t, o) => t + numberValue(o.seller_receive),
            0
        );

        const views = numberValue(
            link.total_views ?? link.views
        );

        const price = numberValue(link.price);

        const destination =
            link.destination_url ||
            link.destination ||
            "-";

        const date = link.created_at
            ? new Date(link.created_at).toLocaleDateString("id-ID")
            : "-";

        return `...`;

    }).join("");

}

/* =========================
GENERATE SELL LINK
========================= */

window.generateLink = function (id) {

    const link = sellLinks.find(
        item => String(item.id) === String(id)
    );

    if (!link) {
        console.error("SELL LINK TIDAK DITEMUKAN:", id);
        return;
    }

    const box = document.getElementById("generatedBox");

    if (!box) return;

    const shortCode =
        link.short_code ||
        link.shortcode ||
        link.code ||
        "";

    if (!shortCode) {
        alert("Short code tidak ditemukan.");
        return;
    }

    const buyLink = `${location.origin}/b/${shortCode}`;

    const price = numberValue(link.price);

    box.innerHTML = `
        <div class="link-card">

            <div class="link-top">
                <h3>${link.title || "Sell Link"}</h3>
            </div>

            <div class="badge-group">

                <span class="badge green">
                    <i class="fa-solid fa-circle-check"></i>
                    Link Aktif
                </span>

                <span class="badge blue">
                    <i class="fa-solid fa-money-bill"></i>
                    Rp ${price.toLocaleString("id-ID")}
                </span>

            </div>

            <label>Buy Link</label>

            <div class="copy-box">

                <input readonly value="${buyLink}">

                <button
                    class="btn-copy"
                    onclick="copySell('${buyLink}')"
                >
                    <i class="fa-regular fa-copy"></i>
                </button>

            </div>

            <div class="link-info">
                <small>
                    Short Code:
                    <b>${shortCode}</b>
                </small>
            </div>

        </div>
    `;

    box.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

};

/* =========================
COPY LINK
========================= */

window.copySell = async function (text) {

    try {

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            const input = document.createElement("input");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }

        alert("Link berhasil disalin.");

    } catch (err) {

        console.error(err);
        alert("Gagal menyalin link.");

    }

};

/* =========================
ACCESS
========================= */

function checkAccess() {

    const btn = document.getElementById("createSellBtn");
    const status = document.getElementById("sellStatus");

    if (!btn || !status) return;

    status.classList.remove("active", "inactive");

    if (sellActive) {

        status.classList.add("active");

        btn.disabled = false;
        btn.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            Create Sell Link
        `;

        status.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Sell Link Aktif
        `;

    } else {

        status.classList.add("inactive");

        btn.disabled = true;
        btn.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            Sell Link Terkunci
        `;

        status.innerHTML = `
            <i class="fa-solid fa-circle-xmark"></i>
            Aktifkan Sell Link terlebih dahulu
        `;

    }

}

/* =========================
EDIT SELL LINK
========================= */

window.editSell = async function (id) {

    const link = sellLinks.find(item => String(item.id) === String(id));

    if (!link) {
        alert("Sell Link tidak ditemukan.");
        return;
    }

    const title = prompt("Judul", link.title || "");
    if (title === null) return;

    const destination = prompt(
        "Destination URL",
        link.destination_url || link.destination || ""
    );

    if (destination === null) return;

    try {
        new URL(destination);
    } catch {
        alert("URL tidak valid.");
        return;
    }

    const priceText = prompt(
        "Harga",
        link.price || 10000
    );

    if (priceText === null) return;

    const price = Number(priceText);

    if (price < 10000) {
        alert("Minimal Rp10.000");
        return;
    }

    try {

        const { error } = await database.supabase
            .from("links")
            .update({
                title,
                destination: destination,
                destination_url: destination,
                price
            })
            .eq("id", id);

        if (error) throw error;

        await loadSellLinks();

        alert("Sell Link berhasil diperbarui.");

    } catch (err) {

        console.error(err);
        alert(err.message);

    }

};


/* =========================
DELETE / HIDE SELL LINK
========================= */

window.deleteSell = async function (id) {

    const link = sellLinks.find(item =>
        String(item.id) === String(id)
    );

    if (!link) {
        alert("Sell Link tidak ditemukan.");
        return;
    }

    if (!confirm(`Sembunyikan Sell Link "${link.title}"?`)) {
        return;
    }

    try {

        const { error } = await database.supabase
            .from("links")
            .update({
                status: "inactive"
            })
            .eq("id", id);

        if (error) throw error;

        // Hapus dari data lokal agar langsung hilang dari dashboard
        sellLinks = sellLinks.filter(item =>
            String(item.id) !== String(id)
        );

        filteredLinks = filteredLinks.filter(item =>
            String(item.id) !== String(id)
        );

        renderSellStats();
        renderLinks();

        alert("Sell Link berhasil disembunyikan.");

    } catch (err) {

        console.error("DELETE SELL ERROR:", err);

        alert(
            err.message ||
            "Gagal menyembunyikan Sell Link."
        );

    }

};


/* =========================
TOGGLE SELL STATUS
========================= */

window.toggleSellStatus = async function (id) {

    const link = sellLinks.find(item =>
        String(item.id) === String(id)
    );

    if (!link) {
        alert("Sell Link tidak ditemukan.");
        return;
    }

    const newStatus =
        link.status === "active"
            ? "inactive"
            : "active";

    try {

        const { error } = await database.supabase
            .from("links")
            .update({
                status: newStatus
            })
            .eq("id", id);

        if (error) throw error;

        link.status = newStatus;

        renderSellStats();
        applyFilter();

        alert(
            newStatus === "active"
                ? "Sell Link berhasil diaktifkan."
                : "Sell Link berhasil dinonaktifkan."
        );

    } catch (err) {

        console.error(err);

        alert(
            err.message ||
            "Gagal mengubah status Sell Link."
        );

    }

};

/* =========================
INIT
========================= */

(async function initSellLink() {

    try {

        const user = await loadUser();

        if (!user) return;

        // Load semua order
        await loadSellOrders();

        // Load semua sell link
        await loadSellLinks();

        // Render ulang statistik & list
        renderSellStats();
        applyFilter();

        console.log("SELL LINK SYSTEM READY");

    } catch (err) {

        console.error("SELL LINK INIT ERROR:", err);

    }

})();

}); // END DOMContentLoaded
