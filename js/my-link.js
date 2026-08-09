// ======================================================
// CLICK2PAY MY LINK SYSTEM
// FINAL / CLEAN VERSION
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
// ======================================================
// INIT DOM
// ======================================================
function initElements() {
    smartList = document.getElementById("smartLinkList");
    adsList = document.getElementById("adsLinkList");
    sellList = document.getElementById("sellLinkList");
    totalAdsLink = document.getElementById("totalAdsLink");
    totalAdsView = document.getElementById("totalAdsView");
    totalSellLink = document.getElementById("totalSellLink");
    totalSellRevenue = document.getElementById("totalSellRevenue");
    totalLink = document.getElementById("totalLink");
    totalView = document.getElementById("totalView");
    totalClick = document.getElementById("totalClick");
    totalEarning = document.getElementById("totalEarning");
}
// ======================================================
// HTML ESCAPE
// ======================================================
function escapeHTML(value) {
    if (value === null || value === undefined) {
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
        const url = new URL(value);
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
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
    }
    return result;
}
// ======================================================
// LOAD LINKS
// ======================================================
async function loadMyLinks() {
    try {
        if (!database) {
            throw new Error("Database belum tersedia.");
        }
        const user = await database.getUser();
        if (!user) {
            window.location.href = "index.html";
            return;
        }
        const data = await database.getLinks(user.id);
        allLinks = Array.isArray(data) ? data : [];
        window.allLinks = allLinks;
        await checkSellAccess(user);
        updateStats();
        applyCurrentFilter();
    } catch (err) {
        console.error("LOAD LINK ERROR:", err);
        if (smartList) {
            smartList.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <h3>Gagal Memuat Link</h3>
                    <p>${escapeHTML(err.message)}</p>
                </div>
            `;
        }
    }
}
// ======================================================
// CHECK SELL ACCESS
// ======================================================
async function checkSellAccess(user) {
    try {
        const linkType =
            document.getElementById("linkType");
        const sellInfo =
            document.getElementById("sellInfo");
        if (!linkType) {
            return;
        }
        const profile =
            await database.getProfile(user.id);
        const active =
            profile &&
            (
                profile.sell_link_enabled === true ||
                Number(profile.withdraw_count || 0) >= 3
            );
        const option =
            linkType.querySelector(
                "option[value='sell']"
            );
        if (active) {
            if (option) {
                option.disabled = false;
            }
            if (sellInfo) {
                sellInfo.innerHTML = `
                    <span class="status-success">
                        <i class="fa-solid fa-circle-check"></i>
                        Sell Link sudah aktif
                    </span>
                `;
            }
        } else {
            if (option) {
                option.disabled = true;
            }
            if (linkType.value === "sell") {
                linkType.value = "ads";
            }
            if (sellInfo) {
                sellInfo.innerHTML = `
                    <span class="status-danger">
                        <i class="fa-solid fa-lock"></i>
                        Sell Link belum aktif
                    </span>
                `;
            }
        }
    } catch (err) {
        console.error(
            "SELL ACCESS ERROR:",
            err
        );
    }
}
// ======================================================
// LINK TYPE
// ======================================================
function getLinkType(link) {
    return String(
        link?.link_type ||
        link?.type ||
        "ads"
    ).toLowerCase();
}
// ======================================================
// SHORT URL
// ======================================================
function getShortUrl(link) {
    if (link?.short_url) {
        return String(link.short_url);
    }
    if (link?.short_code) {
        return `${location.origin}/s/${encodeURIComponent(link.short_code)}`;
    }
    return "-";
}
// ======================================================
// DESTINATION
// ======================================================
function getDestination(link) {
    return String(
        link?.destination_url ||
        link?.destination ||
        "-"
    );
}
// ======================================================
// NUMBER HELPER
// ======================================================
function getNumber(...values) {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            const number = Number(value);
            if (Number.isFinite(number)) {
                return number;
            }
        }
    }
    return 0;
}
// ======================================================
// UPDATE STATS
// ======================================================
function updateStats() {
    const adsLinks =
        allLinks.filter(
            link => getLinkType(link) === "ads"
        );
    const sellLinks =
        allLinks.filter(
            link => getLinkType(link) === "sell"
        );
    const views =
        allLinks.reduce(
            (total, link) =>
                total +
                getNumber(
                    link.total_views,
                    link.views
                ),
            0
        );
    const clicks =
        allLinks.reduce(
            (total, link) =>
                total +
                getNumber(
                    link.total_clicks,
                    link.clicks
                ),
            0
        );
    const earnings =
        allLinks.reduce(
            (total, link) =>
                total +
                getNumber(
                    link.total_earnings,
                    link.earnings
                ),
            0
        );
    const adsViews =
        adsLinks.reduce(
            (total, link) =>
                total +
                getNumber(
                    link.total_views,
                    link.views
                ),
            0
        );
    const sellRevenue =
        sellLinks.reduce(
            (total, link) =>
                total +
                getNumber(
                    link.seller_receive,
                    link.total_earnings,
                    link.earnings
                ),
            0
        );
    if (totalLink) {
        totalLink.textContent =
            allLinks.length.toLocaleString("id-ID");
    }
    if (totalView) {
        totalView.textContent =
            views.toLocaleString("id-ID");
    }
    if (totalClick) {
        totalClick.textContent =
            clicks.toLocaleString("id-ID");
    }
    if (totalEarning) {
        totalEarning.textContent =
            "Rp " +
            earnings.toLocaleString("id-ID");
    }
    if (totalAdsLink) {
        totalAdsLink.textContent =
            adsLinks.length.toLocaleString("id-ID");
    }
    if (totalAdsView) {
        totalAdsView.textContent =
            adsViews.toLocaleString("id-ID");
    }
    if (totalSellLink) {
        totalSellLink.textContent =
            sellLinks.length.toLocaleString("id-ID");
    }
    if (totalSellRevenue) {
        totalSellRevenue.textContent =
            "Rp " +
            sellRevenue.toLocaleString("id-ID");
    }
}
// ======================================================
// RENDER ALL
// ======================================================
function renderAllLinks() {
    const adsFiltered =
        filteredLinks.filter(
            link => getLinkType(link) === "ads"
        );
    const sellFiltered =
        filteredLinks.filter(
            link => getLinkType(link) === "sell"
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
function renderLinkBox(box, list, message) {
    if (!box) {
        return;
    }
    if (!list.length) {
        box.innerHTML = `
            <div class="empty">
                <i class="fa-solid fa-link-slash"></i>
                <h3>${escapeHTML(message)}</h3>
                <p>Link kamu akan tampil di sini.</p>
            </div>
        `;
        return;
    }
    box.innerHTML =
        list
            .map(link => createLinkCard(link))
            .join("");
}
// ======================================================
// COUNT
// ======================================================
function updateCount(id, total) {
    const element =
        document.getElementById(id);
    if (element) {
        element.textContent =
            `${total.toLocaleString("id-ID")} Link`;
    }
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
            link.title || "Smart Link"
        );
    const alias =
        escapeHTML(link.alias);
    const campaign =
        escapeHTML(link.campaign);
    const device =
        escapeHTML(link.device);
    const shortDisplay =
        escapeHTML(short);
    const destinationDisplay =
        escapeHTML(destination);
    const typeClass =
        type === "ads"
            ? "blue"
            : "orange";
    const typeLabel =
        type.toUpperCase();
    const id =
        escapeHTML(link.id);
    return `
        <div class="link-card"
             data-link-id="${id}">
            <div class="link-top">
                <h3>
                    ${title}
                </h3>
            </div>
            <div class="link-meta">
                <span>
                    <i class="fa-solid fa-eye"></i>
                    ${views.toLocaleString("id-ID")}
                    View
                </span>
                <span>
                    <i class="fa-solid fa-computer-mouse"></i>
                    ${clicks.toLocaleString("id-ID")}
                    Click
                </span>
                <span>
                    <i class="fa-solid fa-calendar"></i>
                    ${formatDate(link.created_at)}
                </span>
            </div>
            <div class="destination-link">
                <i class="fa-solid fa-globe"></i>
                ${
                    safeDestination
                        ? `
                            <a
                                href="${escapeHTML(safeDestination)}"
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
                <span class="badge green">
                    Rp ${earn.toLocaleString("id-ID")}
                </span>
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
window.editLink = function(id) {
    const link =
        allLinks.find(
            item => String(item.id) === String(id)
        );
    if (!link) {
        alert("Link tidak ditemukan.");
        return;
    }
    const modal =
        document.getElementById("editModal");
    const editId =
        document.getElementById("editId");
    const editTitle =
        document.getElementById("editTitle");
    const editUrl =
        document.getElementById("editUrl");
    if (!modal) {
        return;
    }
    if (editId) {
        editId.value = link.id;
    }
    if (editTitle) {
        editTitle.value =
            link.title || "";
    }
    if (editUrl) {
        editUrl.value =
            getDestination(link) === "-"
                ? ""
                : getDestination(link);
    }
    modal.classList.add("active");
};
// ======================================================
// SAVE EDIT
// ======================================================
window.saveEdit = async function() {
    try {
        const id =
            document.getElementById("editId")?.value;
        const title =
            document
                .getElementById("editTitle")
                ?.value
                .trim();
        const destination =
            document
                .getElementById("editUrl")
                ?.value
                .trim();
        if (!id) {
            alert("ID link tidak ditemukan.");
            return;
        }
        if (!title || !destination) {
            alert("Judul dan URL wajib diisi.");
            return;
        }
        if (!safeURL(destination)) {
            alert(
                "URL tidak valid. Gunakan http:// atau https://"
            );
            return;
        }
        await database.updateLink(
            id,
            {
                title,
                destination,
                destination_url: destination
            }
        );
        closeEdit();
        await loadMyLinks();
        alert(
            "Link berhasil diperbarui."
        );
    } catch (err) {
        console.error(
            "SAVE EDIT ERROR:",
            err
        );
        alert(
            err.message ||
            "Gagal memperbarui link."
        );
    }
};
// ======================================================
// CLOSE EDIT
// ======================================================
window.closeEdit = function() {
    const modal =
        document.getElementById("editModal");
    if (modal) {
        modal.classList.remove("active");
    }
};
// ======================================================
// DELETE LINK
// ======================================================
window.deleteLink = async function(id) {
    const link =
        allLinks.find(
            item => String(item.id) === String(id)
        );
    const title =
        link?.title || "link ini";
    if (
        !confirm(
            `Yakin ingin menghapus "${title}"?`
        )
    ) {
        return;
    }
    try {
        await database.deleteLink(id);
        await loadMyLinks();
        alert(
            "Link berhasil dihapus."
        );
    } catch (err) {
        console.error(
            "DELETE LINK ERROR:",
            err
        );
        alert(
            err.message ||
            "Gagal menghapus link."
        );
    }
};
// ======================================================
// COPY LINK
// ======================================================
window.copyLink = async function(url) {
    if (!url || url === "-") {
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
            await navigator.clipboard.writeText(url);
        } else {
            const input =
                document.createElement("textarea");
            input.value = url;
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.appendChild(input);
            input.focus();
            input.select();
            document.execCommand("copy");
            input.remove();
        }
        alert(
            "Link berhasil disalin."
        );
    } catch (err) {
        console.error(
            "COPY ERROR:",
            err
        );
        alert(
            "Gagal menyalin link."
        );
    }
};
// ======================================================
// COPY BY ID
// ======================================================
window.copyLinkById = function(id) {
    const link =
        allLinks.find(
            item => String(item.id) === String(id)
        );
    if (!link) {
        alert(
            "Link tidak ditemukan."
        );
        return;
    }
    copyLink(
        getShortUrl(link)
    );
};
// ======================================================
// SEARCH
// ======================================================
window.searchLinks = function() {
    applyCurrentFilter();
};
// ======================================================
// FILTER
// ======================================================
window.filterLink = function(type, btn) {
    currentFilter =
        String(type || "all").toLowerCase();
    document
        .querySelectorAll(
            ".link-filter button"
        )
        .forEach(button => {
            button.classList.remove("active");
        });
    if (btn) {
        btn.classList.add("active");
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
            searchElement?.value || ""
        )
        .toLowerCase()
        .trim();
    // SEARCH
    if (keyword) {
        data =
            data.filter(link => {
                const title =
                    String(
                        link.title || ""
                    ).toLowerCase();
                const url =
                    getDestination(link)
                        .toLowerCase();
                const short =
                    getShortUrl(link)
                        .toLowerCase();
                const type =
                    getLinkType(link)
                        .toLowerCase();
                const alias =
                    String(
                        link.alias || ""
                    ).toLowerCase();
                const campaign =
                    String(
                        link.campaign || ""
                    ).toLowerCase();
                return (
                    title.includes(keyword) ||
                    url.includes(keyword) ||
                    short.includes(keyword) ||
                    type.includes(keyword) ||
                    alias.includes(keyword) ||
                    campaign.includes(keyword)
                );
            });
    }
    // FILTER
    if (
        currentFilter !== "all" &&
        currentFilter !== ""
    ) {
        data =
            data.filter(
                link =>
                    getLinkType(link) ===
                    currentFilter
            );
    }
    filteredLinks =
        data;
    renderAllLinks();
    // ==================================================
    // PANEL VISIBILITY
    // ==================================================
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
    smartPanel.style.display = "";
    adsPanel.style.display = "";
    sellPanel.style.display = "";
    if (currentFilter === "ads") {
        smartPanel.style.display = "none";
        sellPanel.style.display = "none";
    }
    if (currentFilter === "sell") {
        smartPanel.style.display = "none";
        adsPanel.style.display = "none";
    }
}
// ======================================================
// FORMAT DATE
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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}
// ======================================================
// ADVANCED SETTINGS
// ======================================================
function getAdvancedSettings() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "advanced_settings"
            )
        ) || {};
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
            .getElementById("customAlias")
            ?.value
            .trim() || "";
    const expired =
        document
            .getElementById("expiredLink")
            ?.value || "never";
    const campaign =
        document
            .getElementById("campaignName")
            ?.value
            .trim() || "";
    const device =
        document
            .getElementById("targetDevice")
            ?.value || "all";
    const data = {
        alias,
        expired,
        campaign,
        device
    };
    localStorage.setItem(
        "advanced_settings",
        JSON.stringify(data)
    );
    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.remove("active");
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
            settings.alias || "";
    }
    if (expired) {
        expired.value =
            settings.expired || "never";
    }
    if (campaign) {
        campaign.value =
            settings.campaign || "";
    }
    if (device) {
        device.value =
            settings.device || "all";
    }
    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.add("active");
}
// ======================================================
// CLOSE ADVANCED
// ======================================================
function closeAdvanced() {
    document
        .getElementById(
            "advancedModal"
        )
        ?.classList.remove("active");
}
// ======================================================
// CREATE SMART LINK
// ======================================================
async function createSmartLink() {
    const input =
        document.getElementById(
            "urlInput"
        );
    const typeSelect =
        document.getElementById(
            "linkType"
        );
    if (!input) {
        console.error(
            "urlInput tidak ditemukan."
        );
        return;
    }
    const url =
        input.value.trim();
    const type =
        typeSelect?.value || "ads";
    if (!url) {
        alert(
            "Masukkan Destination URL."
        );
        return;
    }
    if (!safeURL(url)) {
        alert(
            "URL tidak valid. Gunakan http:// atau https://"
        );
        return;
    }
    try {
        const user =
            await database.getUser();
        if (!user) {
            window.location.href =
                "index.html";
            return;
        }
        // ==============================================
        // CHECK SELL ACCESS
        // ==============================================
        if (type === "sell") {
            const profile =
                await database.getProfile(
                    user.id
                );
            const sellActive =
                profile &&
                (
                    profile.sell_link_enabled === true ||
                    Number(
                        profile.withdraw_count || 0
                    ) >= 3
                );
            if (!sellActive) {
                alert(
                    "Sell Link belum aktif untuk akun kamu."
                );
                return;
            }
        }
        // ==============================================
        // ADVANCED SETTINGS
        // ==============================================
        const advanced =
            getAdvancedSettings();
        // ==============================================
        // GENERATE UNIQUE CODE
        // ==============================================
        let shortCode = "";
        let attempts = 0;
        do {
            shortCode =
                generateShortCode(8);
            attempts++;
            if (attempts > 20) {
                throw new Error(
                    "Gagal membuat Short Code unik."
                );
            }
        } while (
            await database.getLinkByCode(
                shortCode
            )
        );
        // ==============================================
        // CREATE
        // ==============================================
        const created =
            await database.createLink({
                user_id: user.id,
                title:
                    advanced.campaign ||
                    (
                        type === "sell"
                            ? "Sell Link"
                            : "Ads Link"
                    ),
                destination: url,
                destination_url: url,
                short_code: shortCode,
                type: type,
                link_type: type,
                price: 0,
                status: "active",
                total_views: 0,
                total_clicks: 0,
                total_earnings: 0,
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
            });
        // ==============================================
        // SAVE LAST LINK
        // ==============================================
        if (created) {
            localStorage.setItem(
                "last_short_code",
                created.short_code ||
                shortCode
            );
            if (created.id) {
                localStorage.setItem(
                    "last_link_id",
                    created.id
                );
            }
        }
        // ==============================================
        // RESET
        // ==============================================
        input.value = "";
        localStorage.removeItem(
            "advanced_settings"
        );
        await loadMyLinks();
        // ==============================================
        // RESULT
        // ==============================================
        const result =
            document.getElementById(
                "createResult"
            );
        const finalCode =
            created?.short_code ||
            shortCode;
        const finalURL =
            `${location.origin}/s/${encodeURIComponent(finalCode)}`;
        if (result) {
            result.innerHTML = `
                <div class="create-success">
                    <div class="link-title">
                        <i class="fa-solid fa-circle-check"></i>
                        Link berhasil dibuat
                    </div>
                    <div class="link-url">
                        ${escapeHTML(finalURL)}
                    </div>
                </div>
            `;
        }
        alert(
            `${
                type === "sell"
                    ? "Sell"
                    : "Ads"
            } Link berhasil dibuat.`
        );
    } catch (err) {
        console.error(
            "CREATE LINK ERROR:",
            err
        );
        alert(
            err.message ||
            "Gagal membuat link."
        );
    }
}
// ======================================================
// EVENT BINDINGS
// ======================================================
function bindEvents() {
    // CREATE
    document
        .getElementById(
            "shortenBtn"
        )
        ?.addEventListener(
            "click",
            createSmartLink
        );
    // ADVANCED
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
    // EDIT CLOSE
    document
        .getElementById(
            "cancelEditBtn"
        )
        ?.addEventListener(
            "click",
            closeEdit
        );
    document
        .getElementById(
            "closeEditBtn"
        )
        ?.addEventListener(
            "click",
            closeEdit
        );
    // SEARCH
    document
        .getElementById(
            "searchLink"
        )
        ?.addEventListener(
            "input",
            applyCurrentFilter
        );
    // CLOSE MODALS
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
                event.target === editModal
            ) {
                closeEdit();
            }
            if (
                advancedModal &&
                event.target === advancedModal
            ) {
                closeAdvanced();
            }
        }
    );
    // ESC
    window.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape"
            ) {
                closeEdit();
                closeAdvanced();
            }
        }
    );
}
// ======================================================
// AUTO REFRESH
// ======================================================
let refreshTimer = null;
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(
            refreshTimer
        );
    }
    refreshTimer =
        setInterval(
            () => {
                loadMyLinks();
            },
            30000
        );
}
// ======================================================
// INIT
// ======================================================
document.addEventListener(
    "DOMContentLoaded",
    async () => {
        initElements();
        bindEvents();
        await loadMyLinks();
        startAutoRefresh();
    }
);
