// ======================================================
// CLICK2PAY MY LINK SYSTEM
// FINAL / CLEAN / DATABASE VERSION
// ======================================================

let allLinks = [];
let filteredLinks = [];
let currentFilter = "all";

let smartList;
let adsList;
let sellList;

let totalAdsLink;
let totalAdsView;
let totalSellLink;
let totalSellRevenue;

let totalLink;
let totalView;
let totalClick;
let totalEarning;

let refreshTimer = null;
let isCreatingLink = false;

let currentSellOrders = [];

// ======================================================
// DOM INIT
// ======================================================

function initElements() {

    smartList =
        document.getElementById("smartLinkList");

    adsList =
        document.getElementById("adsLinkList");

    sellList =
        document.getElementById("sellLinkList");

    totalAdsLink =
        document.getElementById("totalAdsLink");

    totalAdsView =
        document.getElementById("totalAdsView");

    totalSellLink =
        document.getElementById("totalSellLink");

    totalSellRevenue =
        document.getElementById("totalSellRevenue");

    totalLink =
        document.getElementById("totalLink");

    totalView =
        document.getElementById("totalView");

    totalClick =
        document.getElementById("totalClick");

    totalEarning =
        document.getElementById("totalEarning");
}

// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ======================================================
// SAFE URL
// ======================================================

function safeURL(value) {

    if (!value) {
        return "";
    }

    try {

        const url =
            new URL(String(value).trim());

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }

        return url.href;

    } catch {

        return "";
    }
}

// ======================================================
// GENERATE SHORT CODE
// ======================================================

function generateShortCode(length = 8) {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const array =
        new Uint32Array(length);

    crypto.getRandomValues(array);

    let result = "";

    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            chars[
                array[i] % chars.length
            ];
    }

    return result;
}

// ======================================================
// NUMBER HELPER
// ======================================================

function getNumber(...values) {

    for (const value of values) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            continue;
        }

        const number =
            Number(value);

        if (
            Number.isFinite(number)
        ) {
            return number;
        }
    }

    return 0;
}

// ======================================================
// RUPIAH
// ======================================================

function formatRupiah(value) {

    return (
        "Rp " +
        getNumber(value)
            .toLocaleString("id-ID")
    );
}

// ======================================================
// PAID STATUS
// ======================================================

function isPaidStatus(status) {

    return [
        "paid",
        "success",
        "completed",
        "settled"
    ].includes(
        String(status || "")
            .toLowerCase()
    );
}

// ======================================================
// JAKARTA DATE
// ======================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return "-";
    }

    return parsed.toLocaleString(
        "id-ID",
        {
            timeZone:
                "Asia/Jakarta",

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}

// ======================================================
// LINK TYPE
// ======================================================

function getLinkType(link) {

    const type =
        String(
            link?.link_type ??
            link?.type ??
            "ads"
        )
        .toLowerCase()
        .trim();

    if (
        type === "sell_link" ||
        type === "sell"
    ) {
        return "sell";
    }

    if (
        type === "ads" ||
        type === "ad"
    ) {
        return "ads";
    }

    return type || "ads";
}

// ======================================================
// SHORT URL
// ======================================================

function getShortUrl(link) {

    if (link?.short_url) {

        return String(
            link.short_url
        );
    }

    if (link?.short_code) {

        return (
            `${location.origin}/s/` +
            encodeURIComponent(
                link.short_code
            )
        );
    }

    return "-";
}

// ======================================================
// DESTINATION
// ======================================================

function getDestination(link) {

    return String(
        link?.destination_url ??
        link?.destination ??
        "-"
    );
}

// ======================================================
// GET USER
// ======================================================

async function getCurrentUser() {

    if (
        !window.database
    ) {
        throw new Error(
            "Database belum tersedia."
        );
    }

    const user =
        await window.database.getUser();

    return user;
}

// ======================================================
// CHECK PREMIUM / SELL ACCESS
// ======================================================

async function getSellAccess(user) {

    if (
        !user ||
        !window.database
    ) {
        return {
            active: false,
            profile: null
        };
    }

    const profile =
        await window.database.getProfile(
            user.id
        );

    if (!profile) {

        return {
            active: false,
            profile: null
        };
    }

    // --------------------------------------------------
    // PREMIUM
    // --------------------------------------------------

    let premiumActive =
        profile.is_premium === true;

    if (
        premiumActive &&
        profile.premium_expires_at
    ) {

        const expires =
            new Date(
                profile.premium_expires_at
            );

        if (
            Number.isNaN(
                expires.getTime()
            ) ||
            expires <= new Date()
        ) {

            premiumActive = false;
        }
    }

    // --------------------------------------------------
    // SELL ACCESS
    // --------------------------------------------------

    const active =
        premiumActive ||
        profile.sell_link_enabled === true ||
        profile.sell_unlocked === true ||
        getNumber(
            profile.withdraw_count
        ) >= 3;

    return {
        active,
        premiumActive,
        profile
    };
}

// ======================================================
// APPLY SELL ACCESS TO UI
// ======================================================

async function checkSellAccess(user) {

    try {

        const linkType =
            document.getElementById(
                "linkType"
            );

        const sellInfo =
            document.getElementById(
                "sellInfo"
            );

        if (!linkType) {
            return false;
        }

        const access =
            await getSellAccess(user);

        const option =
            linkType.querySelector(
                "option[value='sell']"
            );

        const sellLinkOption =
            linkType.querySelector(
                "option[value='sell_link']"
            );

        const active =
            access.active === true;

        // ------------------------------------------------
        // ENABLE / DISABLE SELL OPTION
        // ------------------------------------------------

        if (option) {
            option.disabled =
                !active;
        }

        if (sellLinkOption) {
            sellLinkOption.disabled =
                !active;
        }

        if (!active) {

            if (
                linkType.value === "sell" ||
                linkType.value === "sell_link"
            ) {

                linkType.value =
                    "ads";
            }

            if (sellInfo) {

                sellInfo.innerHTML = `
                    <span class="status-danger">
                        <i class="fa-solid fa-lock"></i>
                        Sell Link belum aktif
                    </span>
                `;
            }

        } else {

            if (sellInfo) {

                sellInfo.innerHTML = `
                    <span class="status-success">
                        <i class="fa-solid fa-circle-check"></i>
                        Sell Link sudah aktif
                    </span>
                `;
            }
        }

        console.log(
            "MY LINK SELL ACCESS:",
            {
                username:
                    access.profile?.username,

                is_premium:
                    access.profile?.is_premium,

                premium_expires_at:
                    access.profile?.premium_expires_at,

                premiumActive:
                    access.premiumActive,

                sell_link_enabled:
                    access.profile?.sell_link_enabled,

                sell_unlocked:
                    access.profile?.sell_unlocked,

                withdraw_count:
                    access.profile?.withdraw_count,

                active
            }
        );

        return active;

    } catch (error) {

        console.error(
            "SELL ACCESS ERROR:",
            error
        );

        return false;
    }
}

// ======================================================
// LOAD SELL ORDERS
// ======================================================

async function loadSellOrders(user) {

    currentSellOrders = [];

    try {

        if (
            !window.database ||
            !user
        ) {
            return [];
        }

        if (
            typeof window.database.getSellOrders !==
            "function"
        ) {

            console.warn(
                "database.getSellOrders() belum tersedia."
            );

            return [];
        }

        const orders =
            await window.database.getSellOrders(
                user.id
            );

        currentSellOrders =
            Array.isArray(orders)
                ? orders
                : [];

        return currentSellOrders;

    } catch (error) {

        console.error(
            "LOAD SELL ORDERS ERROR:",
            error
        );

        currentSellOrders = [];

        return [];
    }
}

// ======================================================
// SELL REVENUE
// ======================================================

function getSellRevenue() {

    return currentSellOrders.reduce(
        (total, order) => {

            if (
                !isPaidStatus(
                    order?.status
                )
            ) {
                return total;
            }

            return (
                total +
                getNumber(
                    order.seller_receive
                )
            );

        },
        0
    );
}

// ======================================================
// LOAD LINKS
// ======================================================

async function loadMyLinks() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }

        const data =
            await window.database.getLinks(
                user.id
            );

        allLinks =
            Array.isArray(data)
                ? data
                : [];

        window.allLinks =
            allLinks;

        // ------------------------------------------------
        // SELL ACCESS
        // ------------------------------------------------

        await checkSellAccess(
            user
        );

        // ------------------------------------------------
        // SELL ORDERS
        // ------------------------------------------------

        await loadSellOrders(
            user
        );

        // ------------------------------------------------
        // STATS
        // ------------------------------------------------

        updateStats();

        // ------------------------------------------------
        // FILTER
        // ------------------------------------------------

        applyCurrentFilter();

    } catch (error) {

        console.error(
            "LOAD LINK ERROR:",
            error
        );

        if (smartList) {

            smartList.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-circle-xmark"></i>

                    <h3>
                        Gagal Memuat Link
                    </h3>

                    <p>
                        ${escapeHTML(
                            error?.message ||
                            "Terjadi kesalahan."
                        )}
                    </p>
                </div>
            `;
        }
    }
}

// ======================================================
// UPDATE STATS
// ======================================================

function updateStats() {

    const adsLinks =
        allLinks.filter(
            link =>
                getLinkType(link) ===
                "ads"
        );

    const sellLinks =
        allLinks.filter(
            link =>
                getLinkType(link) ===
                "sell"
        );

    // --------------------------------------------------
    // ALL
    // --------------------------------------------------

    const views =
        allLinks.reduce(
            (
                total,
                link
            ) => {

                return (
                    total +
                    getNumber(
                        link.total_views,
                        link.views
                    )
                );

            },
            0
        );

    const clicks =
        allLinks.reduce(
            (
                total,
                link
            ) => {

                return (
                    total +
                    getNumber(
                        link.total_clicks,
                        link.clicks
                    )
                );

            },
            0
        );

    // --------------------------------------------------
    // ADS
    // --------------------------------------------------

    const adsViews =
        adsLinks.reduce(
            (
                total,
                link
            ) => {

                return (
                    total +
                    getNumber(
                        link.total_views,
                        link.views
                    )
                );

            },
            0
        );

    const adsEarning =
        adsLinks.reduce(
            (
                total,
                link
            ) => {

                return (
                    total +
                    getNumber(
                        link.total_earnings,
                        link.earnings
                    )
                );

            },
            0
        );

    // --------------------------------------------------
    // SELL
    // Revenue berasal dari paid sell_orders
    // --------------------------------------------------

    const sellRevenue =
        getSellRevenue();

    // --------------------------------------------------
    // TOTAL EARNING
    // --------------------------------------------------

    const totalRevenue =
        adsEarning +
        sellRevenue;

    // --------------------------------------------------
    // DISPLAY
    // --------------------------------------------------

    if (totalLink) {

        totalLink.textContent =
            allLinks.length
                .toLocaleString(
                    "id-ID"
                );
    }

    if (totalView) {

        totalView.textContent =
            views.toLocaleString(
                "id-ID"
            );
    }

    if (totalClick) {

        totalClick.textContent =
            clicks.toLocaleString(
                "id-ID"
            );
    }

    if (totalEarning) {

        totalEarning.textContent =
            formatRupiah(
                totalRevenue
            );
    }

    if (totalAdsLink) {

        totalAdsLink.textContent =
            adsLinks.length
                .toLocaleString(
                    "id-ID"
                );
    }

    if (totalAdsView) {

        totalAdsView.textContent =
            adsViews.toLocaleString(
                "id-ID"
            );
    }

    if (totalSellLink) {

        totalSellLink.textContent =
            sellLinks.length
                .toLocaleString(
                    "id-ID"
                );
    }

    if (totalSellRevenue) {

        totalSellRevenue.textContent =
            formatRupiah(
                sellRevenue
            );
    }
}

// ======================================================
// RENDER ALL
// ======================================================

function renderAllLinks() {

    const adsFiltered =
        filteredLinks.filter(
            link =>
                getLinkType(link) ===
                "ads"
        );

    const sellFiltered =
        filteredLinks.filter(
            link =>
                getLinkType(link) ===
                "sell"
        );

    renderLinkBox(
        smartList,
        filteredLinks,
        "Belum Ada Smart Link"
    );

    renderLinkBox(
        adsList,
        adsFiltered,
        "Belum Ada Ads Link"
    );

    renderLinkBox(
        sellList,
        sellFiltered,
        "Belum Ada Sell Link"
    );

    updateCount(
        "smartCount",
        filteredLinks.length
    );

    updateCount(
        "adsCount",
        adsFiltered.length
    );

    updateCount(
        "sellCount",
        sellFiltered.length
    );
}

// ======================================================
// RENDER BOX
// ======================================================

function renderLinkBox(
    box,
    list,
    message
) {

    if (!box) {
        return;
    }

    if (!list.length) {

        box.innerHTML = `
            <div class="empty">

                <i class="fa-solid fa-link-slash"></i>

                <h3>
                    ${escapeHTML(message)}
                </h3>

                <p>
                    Link kamu akan tampil di sini.
                </p>

            </div>
        `;

        return;
    }

    box.innerHTML =
        list
            .map(
                link =>
                    createLinkCard(link)
            )
            .join("");
}

// ======================================================
// COUNT
// ======================================================

function updateCount(
    id,
    total
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        `${getNumber(total).toLocaleString(
            "id-ID"
        )} Link`;
}

// ======================================================
// CREATE LINK CARD
// ======================================================

function createLinkCard(link) {

    const type =
        getLinkType(link);

    const short =
        getShortUrl(link);

    const destination =
        getDestination(link);

    const safeDestination =
        safeURL(destination);

    const views =
        getNumber(
            link.total_views,
            link.views
        );

    const clicks =
        getNumber(
            link.total_clicks,
            link.clicks
        );

    const earn =
        getNumber(
            link.total_earnings,
            link.earnings
        );

    const title =
        escapeHTML(
            link.title ||
            (
                type === "sell"
                    ? "Sell Link"
                    : "Ads Link"
            )
        );

    const alias =
        escapeHTML(
            link.alias
        );

    const campaign =
        escapeHTML(
            link.campaign
        );

    const device =
        escapeHTML(
            link.device
        );

    const shortDisplay =
        escapeHTML(
            short
        );

    const destinationDisplay =
        escapeHTML(
            destination
        );

    const typeClass =
        type === "ads"
            ? "blue"
            : "orange";

    const typeLabel =
        type === "sell"
            ? "SELL"
            : "ADS";

    const id =
        escapeHTML(
            link.id
        );

    return `
        <div
            class="link-card"
            data-link-id="${id}"
        >

            <div class="link-top">

                <h3>
                    ${title}
                </h3>

            </div>

            <div class="link-meta">

                <span>
                    <i class="fa-solid fa-eye"></i>
                    ${views.toLocaleString(
                        "id-ID"
                    )}
                    View
                </span>

                <span>
                    <i class="fa-solid fa-computer-mouse"></i>
                    ${clicks.toLocaleString(
                        "id-ID"
                    )}
                    Click
                </span>

                <span>
                    <i class="fa-solid fa-calendar"></i>
                    ${formatDate(
                        link.created_at
                    )}
                </span>

            </div>

            <div class="destination-link">

                <i class="fa-solid fa-globe"></i>

                ${
                    safeDestination

                        ? `
                            <a
                                href="${escapeHTML(
                                    safeDestination
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ${destinationDisplay}
                            </a>
                        `

                        : `
                            <span>
                                ${destinationDisplay}
                            </span>
                        `
                }

            </div>

            <div class="badge-group">

                <span class="badge ${typeClass}">
                    ${typeLabel} LINK
                </span>

                ${
                    type === "ads"

                        ? `
                            <span class="badge green">
                                ${formatRupiah(
                                    earn
                                )}
                            </span>
                        `

                        : ""
                }

            </div>

            ${
                alias ||
                campaign ||
                device

                    ? `
                        <div class="advanced-info">

                            ${
                                alias
                                    ? `
                                        <span>
                                            <i class="fa-solid fa-tag"></i>
                                            ${alias}
                                        </span>
                                    `
                                    : ""
                            }

                            ${
                                campaign
                                    ? `
                                        <span>
                                            <i class="fa-solid fa-bullseye"></i>
                                            ${campaign}
                                        </span>
                                    `
                                    : ""
                            }

                            ${
                                device
                                    ? `
                                        <span>
                                            <i class="fa-solid fa-mobile-screen"></i>
                                            ${device}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>
                    `
                    : ""
            }

            <div class="copy-box">

                <input
                    type="text"
                    readonly
                    value="${shortDisplay}"
                >

                <button
                    type="button"
                    class="btn-copy"
                    onclick="copyLinkById('${id}')"
                >
                    <i class="fa-solid fa-copy"></i>
                </button>

            </div>

            <div class="link-actions">

                <button
                    type="button"
                    class="btn-edit"
                    onclick="editLink('${id}')"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button
                    type="button"
                    class="btn-delete"
                    onclick="deleteLink('${id}')"
                >
                    <i class="fa-solid fa-trash"></i>
                    Hapus
                </button>

            </div>

        </div>
    `;
}

// ======================================================
// EDIT LINK
// ======================================================

window.editLink =
function(id) {

    const link =
        allLinks.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!link) {

        alert(
            "Link tidak ditemukan."
        );

        return;
    }

    const modal =
        document.getElementById(
            "editModal"
        );

    const editId =
        document.getElementById(
            "editId"
        );

    const editTitle =
        document.getElementById(
            "editTitle"
        );

    const editUrl =
        document.getElementById(
            "editUrl"
        );

    if (!modal) {
        return;
    }

    if (editId) {

        editId.value =
            link.id;
    }

    if (editTitle) {

        editTitle.value =
            link.title ||
            "";
    }

    if (editUrl) {

        editUrl.value =
            getDestination(link) === "-"
                ? ""
                : getDestination(link);
    }

    modal.classList.add(
        "active"
    );
};

// ======================================================
// SAVE EDIT
// ======================================================

window.saveEdit =
async function() {

    try {

        if (!window.database) {

            throw new Error(
                "Database belum tersedia."
            );
        }

        const id =
            document
                .getElementById(
                    "editId"
                )
                ?.value;

        const title =
            document
                .getElementById(
                    "editTitle"
                )
                ?.value
                .trim();

        const destination =
            document
                .getElementById(
                    "editUrl"
                )
                ?.value
                .trim();

        if (!id) {

            alert(
                "ID link tidak ditemukan."
            );

            return;
        }

        if (
            !title ||
            !destination
        ) {

            alert(
                "Judul dan URL wajib diisi."
            );

            return;
        }

        const validatedURL =
            safeURL(
                destination
            );

        if (!validatedURL) {

            alert(
                "URL tidak valid. Gunakan http:// atau https://"
            );

            return;
        }

        await window.database.updateLink(
            id,
            {
                title,
                destination:
                    validatedURL,
                destination_url:
                    validatedURL
            }
        );

        closeEdit();

        await loadMyLinks();

        alert(
            "Link berhasil diperbarui."
        );

    } catch (error) {

        console.error(
            "SAVE EDIT ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal memperbarui link."
        );
    }
};

// ======================================================
// CLOSE EDIT
// ======================================================

window.closeEdit =
function() {

    const modal =
        document.getElementById(
            "editModal"
        );

    if (modal) {

        modal.classList.remove(
            "active"
        );
    }
};

// ======================================================
// DELETE LINK
// ======================================================

window.deleteLink =
async function(id) {

    const link =
        allLinks.find(
            item =>
                String(item.id) ===
                String(id)
        );

    const title =
        link?.title ||
        "link ini";

    if (
        !confirm(
            `Yakin ingin menghapus "${title}"?`
        )
    ) {

        return;
    }

    try {

        if (!window.database) {

            throw new Error(
                "Database belum tersedia."
            );
        }

        await window.database.deleteLink(
            id
        );

        await loadMyLinks();

        alert(
            "Link berhasil dihapus."
        );

    } catch (error) {

        console.error(
            "DELETE LINK ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal menghapus link."
        );
    }
};

// ======================================================
// COPY LINK
// ======================================================

window.copyLink =
async function(url) {

    if (
        !url ||
        url === "-"
    ) {

        alert(
            "Short link tidak tersedia."
        );

        return;
    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard
                .writeText(
                    url
                );

        } else {

            const input =
                document.createElement(
                    "textarea"
                );

            input.value =
                url;

            input.style.position =
                "fixed";

            input.style.opacity =
                "0";

            document.body.appendChild(
                input
            );

            input.focus();

            input.select();

            document.execCommand(
                "copy"
            );

            input.remove();
        }

        alert(
            "Link berhasil disalin."
        );

    } catch (error) {

        console.error(
            "COPY ERROR:",
            error
        );

        alert(
            "Gagal menyalin link."
        );
    }
};

// ======================================================
// COPY BY ID
// ======================================================

window.copyLinkById =
function(id) {

    const link =
        allLinks.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!link) {

        alert(
            "Link tidak ditemukan."
        );

        return;
    }

    window.copyLink(
        getShortUrl(link)
    );
};

// ======================================================
// SEARCH
// ======================================================

window.searchLinks =
function() {

    applyCurrentFilter();
};

// ======================================================
// FILTER
// ======================================================

window.filterLink =
function(
    type,
    btn
) {

    currentFilter =
        String(
            type ||
            "all"
        )
        .toLowerCase()
        .trim();

    document
        .querySelectorAll(
            ".link-filter button"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );
            }
        );

    if (btn) {

        btn.classList.add(
            "active"
        );
    }

    applyCurrentFilter();
};

// ======================================================
// APPLY FILTER
// ======================================================

function applyCurrentFilter() {

    let data =
        [...allLinks];

    const searchElement =
        document.getElementById(
            "searchLink"
        );

    const keyword =
        (
            searchElement?.value ||
            ""
        )
        .toLowerCase()
        .trim();

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    if (keyword) {

        data =
            data.filter(
                link => {

                    const title =
                        String(
                            link.title ||
                            ""
                        )
                        .toLowerCase();

                    const url =
                        getDestination(
                            link
                        )
                        .toLowerCase();

                    const short =
                        getShortUrl(
                            link
                        )
                        .toLowerCase();

                    const type =
                        getLinkType(
                            link
                        )
                        .toLowerCase();

                    const alias =
                        String(
                            link.alias ||
                            ""
                        )
                        .toLowerCase();

                    const campaign =
                        String(
                            link.campaign ||
                            ""
                        )
                        .toLowerCase();

                    return (
                        title.includes(
                            keyword
                        ) ||

                        url.includes(
                            keyword
                        ) ||

                        short.includes(
                            keyword
                        ) ||

                        type.includes(
                            keyword
                        ) ||

                        alias.includes(
                            keyword
                        ) ||

                        campaign.includes(
                            keyword
                        )
                    );
                }
            );
    }

    // --------------------------------------------------
    // FILTER TYPE
    // --------------------------------------------------

    if (
        currentFilter !== "all" &&
        currentFilter !== ""
    ) {

        data =
            data.filter(
                link =>
                    getLinkType(
                        link
                    ) ===
                    currentFilter
            );
    }

    filteredLinks =
        data;

    renderAllLinks();

    // --------------------------------------------------
    // PANEL VISIBILITY
    // --------------------------------------------------

    const smartPanel =
        document.getElementById(
            "smartPanel"
        );

    const adsPanel =
        document.getElementById(
            "adsPanel"
        );

    const sellPanel =
        document.getElementById(
            "sellPanel"
        );

    if (
        !smartPanel ||
        !adsPanel ||
        !sellPanel
    ) {

        return;
    }

    smartPanel.style.display =
        "";

    adsPanel.style.display =
        "";

    sellPanel.style.display =
        "";

    if (
        currentFilter ===
        "ads"
    ) {

        smartPanel.style.display =
            "none";

        sellPanel.style.display =
            "none";
    }

    if (
        currentFilter ===
        "sell"
    ) {

        smartPanel.style.display =
            "none";

        adsPanel.style.display =
            "none";
    }
}

// ======================================================
// ADVANCED SETTINGS
// ======================================================

function getAdvancedSettings() {

    try {

        const saved =
            localStorage.getItem(
                "advanced_settings"
            );

        if (!saved) {
            return {};
        }

        const parsed =
            JSON.parse(
                saved
            );

        return (
            parsed &&
            typeof parsed === "object"
                ? parsed
                : {}
        );

    } catch {

        return {};
    }
}

// ======================================================
// SAVE ADVANCED
// ======================================================

function saveAdvancedSettings() {

    const alias =
        document
            .getElementById(
                "customAlias"
            )
            ?.value
            .trim() ||
        "";

    const expired =
        document
            .getElementById(
                "expiredLink"
            )
            ?.value ||
        "never";

    const campaign =
        document
            .getElementById(
                "campaignName"
            )
            ?.value
            .trim() ||
        "";

    const device =
        document
            .getElementById(
                "targetDevice"
            )
            ?.value ||
        "all";

    const data = {
        alias,
        expired,
        campaign,
        device
    };

    localStorage.setItem(
        "advanced_settings",
        JSON.stringify(
            data
        )
    );

    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.remove(
            "active"
        );

    alert(
        "Advanced Settings berhasil disimpan."
    );
}

// ======================================================
// OPEN ADVANCED
// ======================================================

function openAdvanced() {

    const settings =
        getAdvancedSettings();

    const alias =
        document.getElementById(
            "customAlias"
        );

    const expired =
        document.getElementById(
            "expiredLink"
        );

    const campaign =
        document.getElementById(
            "campaignName"
        );

    const device =
        document.getElementById(
            "targetDevice"
        );

    if (alias) {

        alias.value =
            settings.alias ||
            "";
    }

    if (expired) {

        expired.value =
            settings.expired ||
            "never";
    }

    if (campaign) {

        campaign.value =
            settings.campaign ||
            "";
    }

    if (device) {

        device.value =
            settings.device ||
            "all";
    }

    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.add(
            "active"
        );
}

// ======================================================
// CLOSE ADVANCED
// ======================================================

function closeAdvanced() {

    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.remove(
            "active"
        );
}

// ======================================================
// CREATE SMART LINK
// ======================================================

async function createSmartLink() {

    if (isCreatingLink) {
        return;
    }

    const input =
        document.getElementById(
            "urlInput"
        );

    const typeSelect =
        document.getElementById(
            "linkType"
        );

    const shortenBtn =
        document.getElementById(
            "shortenBtn"
        );

    if (!input) {

        console.error(
            "urlInput tidak ditemukan."
        );

        return;
    }

    const url =
        input.value.trim();

    const rawType =
        typeSelect?.value ||
        "ads";

    const type =
        rawType === "sell_link"
            ? "sell"
            : rawType;

    // --------------------------------------------------
    // VALIDATE URL
    // --------------------------------------------------

    if (!url) {

        alert(
            "Masukkan Destination URL."
        );

        return;
    }

    const validatedURL =
        safeURL(url);

    if (!validatedURL) {

        alert(
            "URL tidak valid. Gunakan http:// atau https://"
        );

        return;
    }

    try {

        isCreatingLink =
            true;

        if (shortenBtn) {

            shortenBtn.disabled =
                true;

            shortenBtn.dataset.originalText =
                shortenBtn.innerHTML;

            shortenBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Membuat...
            `;
        }

        // ------------------------------------------------
        // USER
        // ------------------------------------------------

        const user =
            await getCurrentUser();

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }

        // ------------------------------------------------
        // SELL ACCESS
        // ------------------------------------------------

        if (
            type === "sell"
        ) {

            const access =
                await getSellAccess(
                    user
                );

            if (!access.active) {

                alert(
                    "Sell Link belum aktif untuk akun kamu."
                );

                return;
            }
        }

        // ------------------------------------------------
        // ADVANCED
        // ------------------------------------------------

        const advanced =
            getAdvancedSettings();

        // ------------------------------------------------
        // UNIQUE SHORT CODE
        // ------------------------------------------------

        let shortCode = "";
        let attempts = 0;

        do {

            shortCode =
                generateShortCode(
                    8
                );

            attempts++;

            if (
                attempts > 20
            ) {

                throw new Error(
                    "Gagal membuat Short Code unik."
                );
            }

            const existing =
                await window.database
                    .getLinkByCode(
                        shortCode
                    );

            if (!existing) {
                break;
            }

        } while (true);

        // ------------------------------------------------
        // TITLE
        // ------------------------------------------------

        const title =
            advanced.campaign ||
            (
                type === "sell"
                    ? "Sell Link"
                    : "Ads Link"
            );

        // ------------------------------------------------
        // CREATE DATABASE
        // ------------------------------------------------

        const payload = {

            user_id:
                user.id,

            title,

            destination:
                validatedURL,

            destination_url:
                validatedURL,

            short_code:
                shortCode,

            type,

            link_type:
                type,

            price:
                0,

            status:
                "active",

            total_views:
                0,

            total_clicks:
                0,

            total_earnings:
                0,

            alias:
                advanced.alias ||
                null,

            campaign:
                advanced.campaign ||
                null,

            expired:
                advanced.expired ||
                "never",

            device:
                advanced.device ||
                "all"
        };

        const created =
            await window.database
                .createLink(
                    payload
                );

        // ------------------------------------------------
        // FINAL CODE
        // ------------------------------------------------

        const finalCode =
            created?.short_code ||
            shortCode;

        const finalURL =
            `${location.origin}/s/${encodeURIComponent(
                finalCode
            )}`;

        // ------------------------------------------------
        // SAVE LAST LINK
        // ------------------------------------------------

        localStorage.setItem(
            "last_short_code",
            finalCode
        );

        if (created?.id) {

            localStorage.setItem(
                "last_link_id",
                created.id
            );
        }

        // ------------------------------------------------
        // RESET
        // ------------------------------------------------

        input.value =
            "";

        localStorage.removeItem(
            "advanced_settings"
        );

        // ------------------------------------------------
        // RESULT
        // ------------------------------------------------

        const result =
            document.getElementById(
                "createResult"
            );

        if (result) {

            result.innerHTML = `
                <div class="create-success">

                    <div class="link-title">

                        <i class="fa-solid fa-circle-check"></i>

                        Link berhasil dibuat

                    </div>

                    <div class="link-url">

                        ${escapeHTML(
                            finalURL
                        )}

                    </div>

                    <button
                        type="button"
                        onclick="copyLink('${escapeHTML(
                            finalURL
                        )}')"
                    >
                        <i class="fa-solid fa-copy"></i>
                        Salin Link
                    </button>

                </div>
            `;
        }

        // ------------------------------------------------
        // REFRESH
        // ------------------------------------------------

        await loadMyLinks();

        alert(
            `${
                type === "sell"
                    ? "Sell"
                    : "Ads"
            } Link berhasil dibuat.`
        );

    } catch (error) {

        console.error(
            "CREATE LINK ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal membuat link."
        );

    } finally {

        isCreatingLink =
            false;

        if (shortenBtn) {

            shortenBtn.disabled =
                false;

            if (
                shortenBtn.dataset.originalText
            ) {

                shortenBtn.innerHTML =
                    shortenBtn.dataset.originalText;
            }
        }
    }
}

// ======================================================
// EVENT BINDINGS
// ======================================================

function bindEvents() {

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    document
        .getElementById(
            "shortenBtn"
        )
        ?.addEventListener(
            "click",
            createSmartLink
        );

    // --------------------------------------------------
    // ADVANCED
    // --------------------------------------------------

    document
        .getElementById(
            "saveAdvanced"
        )
        ?.addEventListener(
            "click",
            saveAdvancedSettings
        );

    document
        .getElementById(
            "advanceBtn"
        )
        ?.addEventListener(
            "click",
            openAdvanced
        );

    document
        .getElementById(
            "closeAdvanced"
        )
        ?.addEventListener(
            "click",
            closeAdvanced
        );

    // --------------------------------------------------
    // EDIT CLOSE
    // --------------------------------------------------

    document
        .getElementById(
            "cancelEditBtn"
        )
        ?.addEventListener(
            "click",
            window.closeEdit
        );

    document
        .getElementById(
            "closeEditBtn"
        )
        ?.addEventListener(
            "click",
            window.closeEdit
        );

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    document
        .getElementById(
            "searchLink"
        )
        ?.addEventListener(
            "input",
            applyCurrentFilter
        );

    // --------------------------------------------------
    // MODAL CLICK OUTSIDE
    // --------------------------------------------------

    window.addEventListener(
        "click",
        event => {

            const editModal =
                document.getElementById(
                    "editModal"
                );

            const advancedModal =
                document.getElementById(
                    "advancedModal"
                );

            if (
                editModal &&
                event.target ===
                editModal
            ) {

                window.closeEdit();
            }

            if (
                advancedModal &&
                event.target ===
                advancedModal
            ) {

                closeAdvanced();
            }
        }
    );

    // --------------------------------------------------
    // ESC
    // --------------------------------------------------

    window.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                window.closeEdit();

                closeAdvanced();
            }
        }
    );
}

// ======================================================
// AUTO REFRESH
// ======================================================

function startAutoRefresh() {

    if (refreshTimer) {

        clearInterval(
            refreshTimer
        );
    }

    refreshTimer =
        setInterval(
            () => {

                if (
                    document.hidden
                ) {
                    return;
                }

                loadMyLinks();

            },
            30000
        );
}

// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (refreshTimer) {

            clearInterval(
                refreshTimer
            );

            refreshTimer =
                null;
        }
    }
);

// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.openAdvanced =
    openAdvanced;

window.closeAdvanced =
    closeAdvanced;

window.createSmartLink =
    createSmartLink;

window.applyCurrentFilter =
    applyCurrentFilter;

// ======================================================
// INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initElements();

        bindEvents();

        // ----------------------------------------------
        // WAIT DATABASE
        // ----------------------------------------------

        let attempts = 0;

        while (
            !window.database &&
            attempts < 100
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

            attempts++;
        }

        if (!window.database) {

            console.error(
                "DATABASE TIDAK TERSEDIA."
            );

            if (smartList) {

                smartList.innerHTML = `
                    <div class="empty">

                        <i class="fa-solid fa-database"></i>

                        <h3>
                            Database Tidak Tersedia
                        </h3>

                        <p>
                            Silakan refresh halaman.
                        </p>

                    </div>
                `;

            }

            return;
        }

        // ----------------------------------------------
        // LOAD
        // ----------------------------------------------

        await loadMyLinks();

        // ----------------------------------------------
        // AUTO REFRESH
        // ----------------------------------------------

        startAutoRefresh();
    }
);
