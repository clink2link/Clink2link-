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

        console.log("CURRENT USER:", user);

        if (!user) {
            console.error("USER TIDAK DITEMUKAN");
            return null;
        }

        currentUser = user;

        currentProfile = await database.getProfile(user.id);

        console.log("CURRENT PROFILE:", currentProfile);

        if (currentProfile) {
            sellActive = Boolean(
                currentProfile.sell_link_enabled === true ||
                Number(currentProfile.withdraw_count || 0) >= 1
            );
        } else {
            console.warn("PROFILE TIDAK DITEMUKAN");
            sellActive = false;
        }

        console.log("SELL ACCESS:", sellActive);

        checkAccess();

        return currentUser;

    } catch (err) {
        console.error("LOAD USER ERROR:", err);
        return null;
    }

}

/* =========================
LOAD SELL ORDERS
========================= */

async function loadSellOrders() {

    try {
        if (!currentUser) {
            console.warn("USER BELUM TERSEDIA");
            sellOrders = [];
            return;
        }

        if (!database || !database.supabase) {
            console.error("SUPABASE BELUM READY");
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
            `);

        if (error) {
            throw error;
        }

        sellOrders = Array.isArray(data) ? data : [];

        console.log("SELL ORDERS:", sellOrders);
        console.log("TOTAL SELL ORDERS:", sellOrders.length);

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
        console.log("=== START LOAD SELL LINK ===");

        if (!currentUser) {
            console.error("USER BELUM LOGIN");
            return;
        }

        console.log("USER ID:", currentUser.id);

        const data = await database.getLinks(currentUser.id);

        console.log("ALL USER LINKS:", data);

        if (!Array.isArray(data)) {
            console.error("DATA LINKS INVALID:", data);

            sellLinks = [];
            filteredLinks = [];

            renderSellStats();
            renderLinks();
            return;
        }

        sellLinks = data.filter(link =>
            link.link_type === "sell" ||
            link.type === "sell"
        );

        console.log("FILTER SELL LINK:", sellLinks);
        console.log("TOTAL SELL:", sellLinks.length);

        filteredLinks = [...sellLinks];

        renderSellStats();
        applyFilter();

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
                    <p>${err.message}</p>
                </div>
            `;
        }
    }

}

/* =========================
HELPER
========================= */

function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function getLinkOrders(linkId) {
    if (!linkId) {
        return [];
    }

    return sellOrders.filter(order =>
        String(order.link_id) === String(linkId)
    );
}

function getPaidOrders(linkId) {
    return getLinkOrders(linkId).filter(order =>
        String(order.status || "").toLowerCase() === "paid"
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

        const price = numberValue(link.price);
        totalSellPrice += price;

        const views = numberValue(
            link.total_views ??
            link.views ??
            0
        );
        totalViewsValue += views;

        const paidOrders = getPaidOrders(link.id);

        if (paidOrders.length > 0) {
            totalSoldValue += paidOrders.length;
        } else {
            totalSoldValue += numberValue(
                link.sales ??
                link.sold ??
                0
            );
        }

        for (const order of paidOrders) {
            totalRevenueValue += numberValue(
                order.seller_receive
            );
        }
    }

    if (totalLink) {
        totalLink.textContent =
            sellLinks.length.toLocaleString("id-ID");
    }

    if (totalPrice) {
        totalPrice.textContent =
            "Rp " +
            totalSellPrice.toLocaleString("id-ID");
    }

    if (totalView) {
        totalView.textContent =
            totalViewsValue.toLocaleString("id-ID");
    }

    if (totalSold) {
        totalSold.textContent =
            totalSoldValue.toLocaleString("id-ID");
    }

    if (totalRevenue) {
        totalRevenue.textContent =
            "Rp " +
            totalRevenueValue.toLocaleString("id-ID");
    }

    console.log("================================");
    console.log("SELL STATISTICS");
    console.log("Total Sell Link:", sellLinks.length);
    console.log("Total Harga Jual:", totalSellPrice);
    console.log("Total View:", totalViewsValue);
    console.log("Total Terjual:", totalSoldValue);
    console.log("Total Pendapatan Terjual:", totalRevenueValue);
    console.log("================================");

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
            link.destination ||
            link.destination_url ||
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
                matchFilter = link.status === "active";
                break;

            case "inactive":
                matchFilter = link.status !== "active";
                break;

            default:
                matchFilter = true;
        }

        return matchSearch && matchFilter;
    });

    renderLinks();
}

if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
}

filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterButtons.forEach((b) =>
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

    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);

    let code = "";

    bytes.forEach((b) => {
        code += chars[b % chars.length];
    });

    return code;
}

/* =========================
CREATE SELL LINK
========================= */

const createBtn = document.getElementById("createSellBtn");

if (createBtn) {

    createBtn.onclick = async () => {

        if (!sellActive) {
            alert("Sell Link belum aktif.");
            return;
        }

        if (!currentUser) {
            alert("User belum login.");
            return;
        }

        const title =
            document.getElementById("sellTitle").value.trim();

        const destination =
            document.getElementById("sellUrl").value.trim();

        const price = numberValue(
            document.getElementById("sellPrice").value
        );

        if (!title || !destination || price < 10000) {
            alert(
                "Lengkapi data dengan benar.\nHarga minimal Rp10.000."
            );
            return;
        }

        try {
            new URL(destination);
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
            } while (
                await database.getLinkByCode(short_code)
            );

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

            if (newLink?.id) {
                generateLink(newLink.id);
            }

            applyFilter();

            const result =
                document.getElementById("createResult");

            if (result) {
                result.innerHTML = `
                    <div class="success-box">
                        <i class="fa-solid fa-circle-check"></i>
                        Sell Link berhasil dibuat.
                    </div>
                `;
            }

        } catch (err) {

            console.error("CREATE SELL ERROR:", err);

            alert(
                err.message ||
                "Gagal membuat Sell Link."
            );

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

    box.innerHTML = filteredLinks.map((link) => {

        const shortCode =
            link.short_code ||
            link.shortcode ||
            link.code ||
            "";

        const sellUrl = `${location.origin}/b/${shortCode}`;

        const status = link.status === "active";

        const paidOrders = getPaidOrders(link.id);

        const sold = paidOrders.length
            ? paidOrders.length
            : numberValue(link.sales ?? link.sold);

        const revenue = paidOrders.reduce(
            (total, order) =>
                total + numberValue(order.seller_receive),
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

        return `
        <div class="link-card">

            <div class="link-top">
                <h3>${link.title || "Tanpa Judul"}</h3>
            </div>

            <div class="link-meta">
                <span><i class="fa-regular fa-calendar"></i> ${date}</span>
                <span><i class="fa-solid fa-money-bill"></i> Rp ${price.toLocaleString("id-ID")}</span>
                <span><i class="fa-solid fa-eye"></i> ${views.toLocaleString("id-ID")} View</span>
                <span><i class="fa-solid fa-cart-shopping"></i> ${sold.toLocaleString("id-ID")} Terjual</span>
                <span><i class="fa-solid fa-money-bill-trend-up"></i> Rp ${revenue.toLocaleString("id-ID")}</span>
            </div>

            <div class="destination-link">
                <i class="fa-solid fa-link"></i>
                <a href="${destination}" target="_blank" rel="noopener noreferrer" class="destination-url">
                    ${destination}
                </a>
            </div>

            <div class="badge-group">

                <span class="badge blue">
                    <i class="fa-solid fa-tag"></i>
                    Sell Link
                </span>

                <span class="badge ${status ? "green" : "red"}">
                    <i class="fa-solid fa-circle"></i>
                    ${status ? "Aktif" : "Nonaktif"}
                </span>

                <span class="badge orange">
                    <i class="fa-solid fa-cart-shopping"></i>
                    Terjual ${sold}x
                </span>

                <span class="badge green">
                    <i class="fa-solid fa-money-bill-trend-up"></i>
                    Rp ${revenue.toLocaleString("id-ID")}
                </span>

            </div>

            <div class="copy-box">

                <input
                    readonly
                    value="${sellUrl}"
                >

                <button
                    class="btn-copy"
                    onclick="copySell('${sellUrl}')"
                >
                    <i class="fa-regular fa-copy"></i>
                </button>

            </div>

            <div class="link-actions">

                <button
                    class="btn-edit"
                    onclick="editSell('${link.id}')"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button
                    class="btn-delete"
                    onclick="deleteSell('${link.id}')"
                >
                    <i class="fa-solid fa-eye-slash"></i>
                    Hide
                </button>

            </div>

        </div>
        `;

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
