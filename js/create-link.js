// ======================================================
// CLICK2PAY ADS LINKS
// FINAL / CLEAN / DATABASE VERSION
// ======================================================

"use strict";

// ======================================================
// STATE
// ======================================================

let allLinks = [];
let filteredLinks = [];

let currentFilter = "all";

let currentUser = null;
let currentProfile = null;

let refreshTimer = null;

// ======================================================
// DOM ELEMENTS
// ======================================================

let linkList = null;
let totalLink = null;
let totalView = null;
let totalClick = null;
let totalEarning = null;

let searchInput = null;
let createForm = null;

let filterButtons = [];

// ======================================================
// INIT DOM
// ======================================================

function initElements() {
    linkList =
        document.getElementById("linkList");

    totalLink =
        document.getElementById("totalLink");

    totalView =
        document.getElementById("totalView");

    totalClick =
        document.getElementById("totalClick");

    totalEarning =
        document.getElementById("totalEarning");

    searchInput =
        document.getElementById("searchInput");

    createForm =
        document.getElementById("createForm");

    filterButtons =
        Array.from(
            document.querySelectorAll(
                ".link-filter button"
            )
        );
}

// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {
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

function safeUrl(value) {
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

    for (let i = 0; i < length; i++) {
        result +=
            chars[array[i] % chars.length];
    }

    return result;
}

// ======================================================
// GET CURRENT USER
// ======================================================

async function getCurrentUser() {
    try {

        if (
            typeof database === "undefined" ||
            !database
        ) {
            throw new Error(
                "Database belum tersedia."
            );
        }

        if (
            typeof database.getCurrentProfile !==
            "function"
        ) {
            throw new Error(
                "database.getCurrentProfile() tidak tersedia."
            );
        }

        const profile =
            await database.getCurrentProfile();

        if (!profile) {

            console.warn(
                "CURRENT USER: PROFILE TIDAK DITEMUKAN"
            );

            currentUser = null;
            currentProfile = null;

            return null;
        }

        currentProfile =
            profile;

        currentUser = {
            id: profile.id,
            username:
                profile.username || ""
        };

        window.currentProfile =
            currentProfile;

        window.currentUser =
            currentUser;

        return currentUser;

    } catch (error) {

        console.error(
            "GET CURRENT USER ERROR:",
            error
        );

        currentUser = null;
        currentProfile = null;

        return null;
    }
}

// ======================================================
// GET LINK TYPE
// ======================================================

function getLinkType(link) {
    return String(
        link?.link_type ??
        link?.type ??
        ""
    )
        .toLowerCase()
        .trim();
}

// ======================================================
// GET SHORT CODE
// ======================================================

function getShortCode(link) {
    return String(
        link?.short_code ??
        link?.shortcode ??
        link?.code ??
        link?.slug ??
        ""
    ).trim();
}

// ======================================================
// GET SHORT URL
// ======================================================

function getShortUrl(link) {

    if (link?.short_url) {
        return String(
            link.short_url
        );
    }

    const code =
        getShortCode(link);

    if (!code) {
        return "";
    }

    return (
        `${location.origin}/s/` +
        encodeURIComponent(code)
    );
}

// ======================================================
// GET DESTINATION
// ======================================================

function getDestination(link) {
    return String(
        link?.destination_url ??
        link?.destination ??
        ""
    ).trim();
}

// ======================================================
// GET NUMBER
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
// GET HOSTNAME
// ======================================================

function getHostname(url) {

    if (!url) {
        return "-";
    }

    try {

        return new URL(url)
            .hostname;

    } catch {
        return "-";
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

    return parsed.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

// ======================================================
// UPDATE STATISTICS
// ======================================================

function updateStats() {

    const total =
        allLinks.length;

    let views = 0;
    let clicks = 0;

    for (const link of allLinks) {

        views +=
            getNumber(
                link.total_views,
                link.views
            );

        clicks +=
            getNumber(
                link.total_clicks,
                link.clicks
            );
    }

    if (totalLink) {
        totalLink.textContent =
            total.toLocaleString("id-ID");
    }

    if (totalView) {
        totalView.textContent =
            views.toLocaleString("id-ID");
    }

    if (totalClick) {
        totalClick.textContent =
            clicks.toLocaleString("id-ID");
    }

    // ------------------------------------------
    // ADS EARNING
    // ------------------------------------------

    const adsIncome =
        getNumber(
            currentProfile?.ads_earning_total,
            currentProfile?.total_ads_earning,
            currentProfile?.ads_earnings
        );

    if (totalEarning) {

        totalEarning.textContent =
            "Rp " +
            adsIncome.toLocaleString(
                "id-ID"
            );
    }
}

// ======================================================
// LOAD LINKS
// ======================================================

async function loadLinks() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            allLinks = [];
            filteredLinks = [];

            updateStats();

            if (linkList) {

                linkList.innerHTML = `
                    <div class="empty">
                        <i class="fa-solid fa-lock"></i>
                        <h3>Belum Login</h3>
                        <p>
                            Silakan login terlebih dahulu.
                        </p>
                    </div>
                `;
            }

            return;
        }

        if (
            typeof database.getLinks !==
            "function"
        ) {
            throw new Error(
                "database.getLinks() tidak tersedia."
            );
        }

        const data =
            await database.getLinks(
                user.id
            );

        allLinks =
            Array.isArray(data)
                ? data
                : [];

        // ------------------------------------------
        // ONLY ADS LINKS
        // ------------------------------------------

        allLinks =
            allLinks.filter(
                link =>
                    getLinkType(link) ===
                    "ads"
            );

        window.allLinks =
            allLinks;

        updateStats();

        applyFilter();

    } catch (error) {

        console.error(
            "LOAD LINKS ERROR:",
            error
        );

        allLinks = [];
        filteredLinks = [];

        if (linkList) {

            linkList.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-circle-xmark"></i>

                    <h3>
                        Gagal Memuat Data
                    </h3>

                    <p>
                        ${escapeHtml(
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
// RENDER LINKS
// ======================================================

function renderLinks() {

    if (!linkList) {
        return;
    }

    if (!filteredLinks.length) {

        linkList.innerHTML = `
            <div class="empty">
                <i class="fa-solid fa-link-slash"></i>

                <h3>
                    Belum Ada Ads Link
                </h3>

                <p>
                    Silakan buat Ads Link pertama Anda.
                </p>
            </div>
        `;

        return;
    }

    linkList.innerHTML =
        filteredLinks
            .map(createLinkCard)
            .join("");
}

// ======================================================
// CREATE LINK CARD
// ======================================================

function createLinkCard(link) {

    const id =
        escapeHtml(link?.id);

    const title =
        escapeHtml(
            link?.title ||
            "Tanpa Judul"
        );

    const destination =
        getDestination(link);

    const safeDestination =
        safeUrl(destination);

    const destinationDisplay =
        escapeHtml(
            destination ||
            "-"
        );

    const hostname =
        escapeHtml(
            getHostname(
                destination
            )
        );

    const shortUrl =
        getShortUrl(link);

    const shortDisplay =
        escapeHtml(
            shortUrl ||
            "-"
        );

    const status =
        String(
            link?.status ||
            ""
        )
            .toLowerCase()
            .trim() === "active";

    const views =
        getNumber(
            link?.total_views,
            link?.views
        );

    const clicks =
        getNumber(
            link?.total_clicks,
            link?.clicks
        );

    const createdDate =
        formatDate(
            link?.created_at
        );

    const statusBadge =
        status
            ? `
                <span class="badge green">
                    Aktif
                </span>
            `
            : `
                <span class="badge pink">
                    Nonaktif
                </span>
            `;

    const actionButton =
        status
            ? `
                <button
                    type="button"
                    class="btn-delete"
                    onclick="hideLink('${id}')"
                >
                    <i class="fa-solid fa-eye-slash"></i>
                    Hide
                </button>
            `
            : `
                <button
                    type="button"
                    class="btn-edit"
                    onclick="activateLink('${id}')"
                >
                    <i class="fa-solid fa-eye"></i>
                    Aktifkan
                </button>
            `;

    const destinationHtml =
        safeDestination
            ? `
                <a
                    href="${escapeHtml(
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
            `;

    return `
        <div
            class="link-card"
            data-link-id="${id}"
        >

            <h3>
                ${title}
            </h3>

            <div class="link-meta">

                <button
                    type="button"
                    onclick="openStatistics('${id}')"
                    class="btn-blue"
                >
                    <i class="fa-solid fa-chart-column"></i>
                    Stats
                </button>

                <span>
                    <i class="fa-regular fa-calendar"></i>
                    ${createdDate}
                </span>

                <span>
                    <i class="fa-solid fa-globe"></i>
                    ${hostname}
                </span>

                <span>
                    <i class="fa-solid fa-eye"></i>
                    ${views.toLocaleString("id-ID")}
                </span>

                <span>
                    <i class="fa-solid fa-computer-mouse"></i>
                    ${clicks.toLocaleString("id-ID")}
                </span>

            </div>

            <div class="created">
                Created on : <b>Website</b>
            </div>

            <div class="destination-link">

                <i class="fa-solid fa-globe"></i>

                ${destinationHtml}

            </div>

            <div class="badge-group">

                <span class="badge pink">
                    Ads Link
                </span>

                ${statusBadge}

            </div>

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
                    <i class="fa-regular fa-copy"></i>
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

                ${actionButton}

            </div>

        </div>
    `;
}

// ======================================================
// APPLY FILTER
// ======================================================

function applyFilter() {

    const keyword =
        String(
            searchInput?.value ||
            ""
        )
            .toLowerCase()
            .trim();

    filteredLinks =
        allLinks.filter(
            link => {

                const title =
                    String(
                        link?.title ||
                        ""
                    ).toLowerCase();

                const destination =
                    getDestination(
                        link
                    ).toLowerCase();

                const shortCode =
                    getShortCode(
                        link
                    ).toLowerCase();

                const hostname =
                    getHostname(
                        getDestination(
                            link
                        )
                    ).toLowerCase();

                const status =
                    String(
                        link?.status ||
                        ""
                    ).toLowerCase();

                const matchesSearch =
                    !keyword ||
                    title.includes(
                        keyword
                    ) ||
                    destination.includes(
                        keyword
                    ) ||
                    shortCode.includes(
                        keyword
                    ) ||
                    hostname.includes(
                        keyword
                    ) ||
                    status.includes(
                        keyword
                    );

                let matchesFilter =
                    true;

                switch (
                    currentFilter
                ) {

                    case "active":

                        matchesFilter =
                            status ===
                            "active";

                        break;

                    case "expired":
                    case "inactive":

                        matchesFilter =
                            status ===
                                "expired" ||
                            status ===
                                "inactive";

                        break;

                    case "all":
                    default:

                        matchesFilter =
                            true;
                }

                return (
                    matchesSearch &&
                    matchesFilter
                );
            }
        );

    renderLinks();
}

// ======================================================
// SEARCH
// ======================================================

function handleSearch() {
    applyFilter();
}

// ======================================================
// FILTER BUTTONS
// ======================================================

function bindFilterEvents() {

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                    button.classList.add(
                        "active"
                    );

                    currentFilter =
                        String(
                            button.dataset.filter ||
                            "all"
                        )
                            .toLowerCase()
                            .trim();

                    applyFilter();
                }
            );
        }
    );
}

// ======================================================
// CREATE ADS LINK
// ======================================================

async function createAdsLink(event) {

    event.preventDefault();

    const title =
        document
            .getElementById(
                "linkName"
            )
            ?.value
            .trim();

    const destination =
        document
            .getElementById(
                "linkUrl"
            )
            ?.value
            .trim();

    if (!title) {

        alert(
            "Judul link wajib diisi."
        );

        return;
    }

    if (!destination) {

        alert(
            "Destination URL wajib diisi."
        );

        return;
    }

    const validUrl =
        safeUrl(
            destination
        );

    if (!validUrl) {

        alert(
            "URL tidak valid. Gunakan http:// atau https://"
        );

        return;
    }

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;
        }

        // ------------------------------------------
        // GENERATE UNIQUE CODE
        // ------------------------------------------

        let shortCode = "";
        let attempts = 0;

        do {

            shortCode =
                generateShortCode(8);

            attempts++;

            if (attempts > 20) {

                throw new Error(
                    "Gagal membuat kode link unik."
                );
            }

            if (
                typeof database.getLinkByCode !==
                "function"
            ) {

                throw new Error(
                    "database.getLinkByCode() tidak tersedia."
                );
            }

        } while (
            await database.getLinkByCode(
                shortCode
            )
        );

        // ------------------------------------------
        // CREATE DATABASE RECORD
        // ------------------------------------------

        if (
            typeof database.createLink !==
            "function"
        ) {

            throw new Error(
                "database.createLink() tidak tersedia."
            );
        }

        const newLink =
            await database.createLink({

                user_id:
                    user.id,

                type:
                    "ads",

                link_type:
                    "ads",

                title:
                    title,

                destination:
                    validUrl,

                destination_url:
                    validUrl,

                short_code:
                    shortCode,

                status:
                    "active",

                total_views:
                    0,

                total_clicks:
                    0,

                total_earnings:
                    0
            });

        if (!newLink) {

            throw new Error(
                "Link gagal dibuat."
            );
        }

        const finalCode =
            newLink.short_code ||
            shortCode;

        const generatedUrl =
            `${location.origin}/s/` +
            encodeURIComponent(
                finalCode
            );

        // ------------------------------------------
        // SAVE LAST LINK
        // ------------------------------------------

        localStorage.setItem(
            "last_short_code",
            finalCode
        );

        if (newLink.id) {

            localStorage.setItem(
                "last_link_id",
                newLink.id
            );
        }

        // ------------------------------------------
        // RESET FORM
        // ------------------------------------------

        if (createForm) {
            createForm.reset();
        }

        // ------------------------------------------
        // SHOW RESULT
        // ------------------------------------------

        const resultBox =
            document.getElementById(
                "createResult"
            );

        if (resultBox) {

            resultBox.innerHTML = `
                <div class="create-success">

                    <div class="link-title">
                        <i class="fa-solid fa-circle-check"></i>
                        Ads Link berhasil dibuat
                    </div>

                    <div class="link-url">
                        ${escapeHtml(
                            generatedUrl
                        )}
                    </div>

                </div>
            `;
        }

        await loadLinks();

        alert(
            "Ads Link berhasil dibuat."
        );

    } catch (error) {

        console.error(
            "CREATE ADS LINK ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal membuat Ads Link."
        );
    }
}

// ======================================================
// COPY LINK
// ======================================================

async function copyLink(url) {

    if (!url) {

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
                .writeText(url);

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
}

// ======================================================
// COPY LINK BY ID
// ======================================================

function copyLinkById(id) {

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

    const url =
        getShortUrl(link);

    copyLink(url);
}

// ======================================================
// HIDE LINK
// ======================================================

async function hideLink(id) {

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
            `Yakin ingin menyembunyikan "${title}"?`
        )
    ) {
        return;
    }

    try {

        if (
            typeof database.updateLink !==
            "function"
        ) {

            throw new Error(
                "database.updateLink() tidak tersedia."
            );
        }

        await database.updateLink(
            id,
            {
                status:
                    "inactive"
            }
        );

        await loadLinks();

    } catch (error) {

        console.error(
            "HIDE LINK ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal menyembunyikan link."
        );
    }
}

// ======================================================
// ACTIVATE LINK
// ======================================================

async function activateLink(id) {

    try {

        if (
            typeof database.updateLink !==
            "function"
        ) {

            throw new Error(
                "database.updateLink() tidak tersedia."
            );
        }

        await database.updateLink(
            id,
            {
                status:
                    "active"
            }
        );

        await loadLinks();

    } catch (error) {

        console.error(
            "ACTIVATE LINK ERROR:",
            error
        );

        alert(
            error?.message ||
            "Gagal mengaktifkan link."
        );
    }
}

// ======================================================
// OPEN STATISTICS
// ======================================================

function openStatistics(id) {

    if (!id) {
        return;
    }

    window.location.href =
        `dashboard.html?tab=statistics&id=${encodeURIComponent(id)}`;
}

// ======================================================
// EDIT LINK
// ======================================================

function editLink(id) {

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

    const modal =
        document.getElementById(
            "editModal"
        );

    if (
        !editId ||
        !editTitle ||
        !editUrl ||
        !modal
    ) {

        console.error(
            "EDIT MODAL ELEMENT TIDAK LENGKAP"
        );

        return;
    }

    editId.value =
        link.id;

    editTitle.value =
        link.title || "";

    editUrl.value =
        getDestination(link);

    modal.classList.add(
        "show"
    );
}

// ======================================================
// CLOSE EDIT
// ======================================================

function closeEdit() {

    const modal =
        document.getElementById(
            "editModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}

// ======================================================
// SAVE EDIT
// ======================================================

async function saveEdit() {

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

    if (!title) {

        alert(
            "Judul link wajib diisi."
        );

        return;
    }

    if (!destination) {

        alert(
            "Destination URL wajib diisi."
        );

        return;
    }

    const validUrl =
        safeUrl(destination);

    if (!validUrl) {

        alert(
            "URL tidak valid. Gunakan http:// atau https://"
        );

        return;
    }

    try {

        if (
            typeof database.updateLink !==
            "function"
        ) {

            throw new Error(
                "database.updateLink() tidak tersedia."
            );
        }

        await database.updateLink(
            id,
            {
                title:
                    title,

                destination:
                    validUrl,

                destination_url:
                    validUrl
            }
        );

        closeEdit();

        await loadLinks();

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
}

// ======================================================
// MODAL CLICK OUTSIDE
// ======================================================

function bindModalEvents() {

    window.addEventListener(
        "click",
        event => {

            const modal =
                document.getElementById(
                    "editModal"
                );

            if (
                modal &&
                event.target === modal
            ) {

                closeEdit();
            }
        }
    );

    window.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeEdit();
            }
        }
    );
}

// ======================================================
// BIND EVENTS
// ======================================================

function bindEvents() {

    // ------------------------------------------
    // SEARCH
    // ------------------------------------------

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            handleSearch
        );
    }

    // ------------------------------------------
    // FILTER
    // ------------------------------------------

    bindFilterEvents();

    // ------------------------------------------
    // CREATE
    // ------------------------------------------

    if (createForm) {

        createForm.addEventListener(
            "submit",
            createAdsLink
        );
    }

    // ------------------------------------------
    // MODAL
    // ------------------------------------------

    bindModalEvents();
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
            async () => {

                if (
                    document.visibilityState ===
                    "hidden"
                ) {
                    return;
                }

                await loadLinks();

            },
            30000
        );
}

// ======================================================
// STOP AUTO REFRESH
// ======================================================

function stopAutoRefresh() {

    if (refreshTimer) {

        clearInterval(
            refreshTimer
        );

        refreshTimer = null;
    }
}

// ======================================================
// PAGE VISIBILITY
// ======================================================

function bindVisibilityEvents() {

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                loadLinks();
            }
        }
    );
}

// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.openStatistics =
    openStatistics;

window.copyLink =
    copyLink;

window.copyLinkById =
    copyLinkById;

window.hideLink =
    hideLink;

window.activateLink =
    activateLink;

window.editLink =
    editLink;

window.closeEdit =
    closeEdit;

window.saveEdit =
    saveEdit;

window.loadAdsLinks =
    loadLinks;

window.applyAdsFilter =
    applyFilter;

// ======================================================
// INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initElements();

        bindEvents();

        bindVisibilityEvents();

        await loadLinks();

        startAutoRefresh();
    }
);

// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "beforeunload",
    stopAutoRefresh
);
