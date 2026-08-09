// ======================================================
// CLICK2PAY ADS LINKS
// DATABASE VERSION
// ======================================================
let allLinks = [];
let filteredLinks = [];
let currentFilter = "all";
let currentUser = null;
let currentProfile = null;
// ======================================================
// SHORT CODE
// ======================================================
function generateShortCode(length = 8) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const array =
        new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result +=
            chars[array[i] % chars.length];
    }
    return result;
}
// ======================================================
// ELEMENTS
// ======================================================
const linkList =
    document.getElementById("linkList");
const totalLink =
    document.getElementById("totalLink");
const totalView =
    document.getElementById("totalView");
const totalClick =
    document.getElementById("totalClick");
const totalEarning =
    document.getElementById("totalEarning");
const searchInput =
    document.getElementById("searchInput");
const filterButtons =
    document.querySelectorAll(
        ".link-filter button"
    );
const createForm =
    document.getElementById("createForm");
// ======================================================
// GET CURRENT USER
// ======================================================
// Menggunakan users + Supabase Auth
// Tidak lagi menggunakan tabel profiles
// ======================================================
async function getCurrentUser() {
    try {
        const profile =
            await database.getCurrentProfile();
        if (!profile) {
            console.warn(
                "CURRENT USER: PROFILE TIDAK DITEMUKAN"
            );
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
            profile;
        window.currentUser =
            currentUser;
        console.log(
            "CURRENT USER:",
            currentUser
        );
        console.log(
            "CURRENT PROFILE:",
            currentProfile
        );
        return currentUser;
    } catch (error) {
        console.error(
            "GET CURRENT USER ERROR:",
            error
        );
        return null;
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
            if (linkList) {
                linkList.innerHTML = `
                    <div class="empty">
                        <i class="fa-solid fa-lock"></i>
                        <h3>Belum Login</h3>
                        <p>Silakan login terlebih dahulu.</p>
                    </div>
                `;
            }
            return;
        }
        allLinks =
            await database.getLinks(
                user.id
            ) || [];
        // Hanya ADS LINK
        allLinks =
            allLinks.filter(link => {
                const type =
                    String(
                        link.type ??
                        link.link_type ??
                        ""
                    ).toLowerCase();
                return type === "ads";
            });
        filteredLinks =
            [...allLinks];
        updateStats();
        applyFilter();
    } catch (error) {
        console.error(
            "LOAD LINKS ERROR:",
            error
        );
        if (linkList) {
            linkList.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <h3>Gagal Memuat Data</h3>
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
// SAFE VALUE
// ======================================================
function getValue(
    link,
    key1,
    key2
) {
    return Number(
        link?.[key1] ??
        link?.[key2] ??
        0
    );
}
// ======================================================
// HTML ESCAPE
// ======================================================
function escapeHtml(value) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
// ======================================================
// SAFE URL
// ======================================================
function getDestination(link) {
    return (
        link?.destination_url ||
        link?.destination ||
        ""
    );
}
function getHostname(url) {
    try {
        return new URL(
            url
        ).hostname;
    } catch {
        return "-";
    }
}
// ======================================================
// UPDATE STATISTICS
// ======================================================
function updateStats() {
    if (totalLink) {
        totalLink.textContent =
            allLinks.length.toLocaleString(
                "id-ID"
            );
    }
    let views = 0;
    let clicks = 0;
    allLinks.forEach(
        link => {
            views +=
                getValue(
                    link,
                    "total_views",
                    "views"
                );
            clicks +=
                getValue(
                    link,
                    "total_clicks",
                    "clicks"
                );
        }
    );
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
    // Pendapatan ADS berasal dari profile
    const adsIncome =
        Number(
            currentProfile
                ?.ads_earning_total ??
            0
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
                <h3>Belum Ada Ads Link</h3>
                <p>
                    Silakan buat Ads Link pertama Anda.
                </p>
            </div>
        `;
        return;
    }
    linkList.innerHTML =
        filteredLinks.map(
            link => {
                const shortCode =
                    link.short_code ||
                    link.shortcode ||
                    link.code ||
                    link.slug ||
                    "";
                const url =
                    `${location.origin}/s/${encodeURIComponent(shortCode)}`;
                const destination =
                    getDestination(
                        link
                    );
                const status =
                    String(
                        link.status ||
                        ""
                    ).toLowerCase() ===
                    "active";
                const title =
                    escapeHtml(
                        link.title ||
                        "Tanpa Judul"
                    );
                const safeDestination =
                    escapeHtml(
                        destination
                    );
                const hostname =
                    escapeHtml(
                        getHostname(
                            destination
                        )
                    );
                const createdDate =
                    link.created_at
                        ? new Date(
                            link.created_at
                        ).toLocaleDateString(
                            "id-ID",
                            {
                                day:
                                    "2-digit",
                                month:
                                    "short",
                                year:
                                    "numeric"
                            }
                        )
                        : "-";
                return `
<div class="link-card">
    <h3>
        ${title}
    </h3>
    <div class="link-meta">
        <button
            type="button"
            onclick="openStatistics('${escapeHtml(link.id)}')"
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
            ${hostname}
        </span>
    </div>
    <div class="created">
        Created on : <b>Website</b>
    </div>
    <div class="destination-link">
        <i class="fa-solid fa-globe"></i>
        <a
            href="${safeDestination}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${safeDestination}
        </a>
    </div>
    <div class="badge-group">
        <span class="badge pink">
            Ads Link
        </span>
        <span
            class="badge ${
                status
                    ? "green"
                    : "pink"
            }"
        >
            ${
                status
                    ? "Aktif"
                    : "Nonaktif"
            }
        </span>
    </div>
    <div class="copy-box">
        <input
            readonly
            value="${escapeHtml(url)}"
        >
        <button
            type="button"
            class="btn-copy"
            onclick="copyLink('${escapeHtml(url)}')"
        >
            <i class="fa-regular fa-copy"></i>
        </button>
    </div>
    <div class="link-actions">
        <button
            type="button"
            class="btn-edit"
            onclick="editLink('${escapeHtml(link.id)}')"
        >
            <i class="fa-solid fa-pen"></i>
            Edit
        </button>
        ${
            status
                ? `
                <button
                    type="button"
                    class="btn-delete"
                    onclick="hideLink('${escapeHtml(link.id)}')"
                >
                    <i class="fa-solid fa-eye-slash"></i>
                    Hide
                </button>
                `
                : `
                <button
                    type="button"
                    class="btn-edit"
                    onclick="activateLink('${escapeHtml(link.id)}')"
                >
                    <i class="fa-solid fa-eye"></i>
                    Aktifkan
                </button>
                `
        }
    </div>
</div>
`;
            }
        ).join("");
}
// ======================================================
// OPEN STATISTICS
// ======================================================
function openStatistics(id) {
    location.href =
        `dashboard.html?tab=statistics&id=${encodeURIComponent(id)}`;
}
// ======================================================
// FILTER
// ======================================================
function applyFilter() {
    const key =
        (
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
                        link.title ||
                        ""
                    ).toLowerCase();
                const destination =
                    String(
                        link.destination ||
                        ""
                    ).toLowerCase();
                const destinationUrl =
                    String(
                        link.destination_url ||
                        ""
                    ).toLowerCase();
                const shortCode =
                    String(
                        link.short_code ||
                        link.shortcode ||
                        link.code ||
                        link.slug ||
                        ""
                    ).toLowerCase();
                const matchSearch =
                    title.includes(key) ||
                    destination.includes(key) ||
                    destinationUrl.includes(key) ||
                    shortCode.includes(key);
                let matchFilter = true;
                switch (
                    currentFilter
                ) {
                    case "active":
                        matchFilter =
                            String(
                                link.status ||
                                ""
                            ).toLowerCase() ===
                            "active";
                        break;
                    case "expired":
                        matchFilter =
                            [
                                "expired",
                                "inactive"
                            ].includes(
                                String(
                                    link.status ||
                                    ""
                                ).toLowerCase()
                            );
                        break;
                    default:
                        matchFilter =
                            true;
                }
                return (
                    matchSearch &&
                    matchFilter
                );
            }
        );
    renderLinks();
}
// ======================================================
// SEARCH
// ======================================================
if (searchInput) {
    searchInput.addEventListener(
        "input",
        applyFilter
    );
}
// ======================================================
// FILTER BUTTONS
// ======================================================
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
                    button.dataset.filter ||
                    "all";
                applyFilter();
            }
        );
    }
);
// ======================================================
// CREATE LINK
// ======================================================
if (createForm) {
    createForm.addEventListener(
        "submit",
        async event => {
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
            if (
                !title ||
                !destination
            ) {
                alert(
                    "Lengkapi data."
                );
                return;
            }
            try {
                const parsedUrl =
                    new URL(
                        destination
                    );
                if (
                    ![
                        "http:",
                        "https:"
                    ].includes(
                        parsedUrl.protocol
                    )
                ) {
                    throw new Error(
                        "URL harus menggunakan HTTP atau HTTPS."
                    );
                }
            } catch {
                alert(
                    "URL tidak valid."
                );
                return;
            }
            try {
                const user =
                    await getCurrentUser();
                if (!user) {
                    return;
                }
                let shortCode;
                let attempts = 0;
                do {
                    shortCode =
                        generateShortCode(
                            8
                        );
                    attempts++;
                    if (
                        attempts > 10
                    ) {
                        throw new Error(
                            "Gagal membuat kode link unik."
                        );
                    }
                } while (
                    await database.getLinkByCode(
                        shortCode
                    )
                );
                const newLink =
                    await database.createLink(
                        {
                            user_id:
                                user.id,
                            type:
                                "ads",
                            link_type:
                                "ads",
                            title:
                                title,
                            destination:
                                destination,
                            destination_url:
                                destination,
                            short_code:
                                shortCode,
                            status:
                                "active"
                        }
                    );
                localStorage.setItem(
                    "last_short_code",
                    newLink.short_code
                );
                localStorage.setItem(
                    "last_link_id",
                    newLink.id
                );
                createForm.reset();
                const resultBox =
                    document.getElementById(
                        "createResult"
                    );
                const generatedUrl =
                    `${location.origin}/s/${encodeURIComponent(
                        newLink.short_code
                    )}`;
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
            } catch (error) {
                console.error(
                    "CREATE LINK ERROR:",
                    error
                );
                alert(
                    error?.message ||
                    "Gagal membuat link."
                );
            }
        }
    );
}
// ======================================================
// COPY LINK
// ======================================================
async function copyLink(url) {
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
                    "input"
                );
            input.value = url;
            document.body.appendChild(
                input
            );
            input.select();
            input.setSelectionRange(
                0,
                99999
            );
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
// HIDE LINK
// ======================================================
// Tidak menghapus link dari database.
// Hanya mengubah status menjadi inactive.
// ======================================================
async function hideLink(id) {
    if (
        !confirm(
            "Yakin ingin menyembunyikan link ini?"
        )
    ) {
        return;
    }
    try {
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
        getDestination(
            link
        );
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
        document.getElementById(
            "editId"
        )?.value;
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
    if (
        !id ||
        !title ||
        !destination
    ) {
        alert(
            "Lengkapi data."
        );
        return;
    }
    try {
        const parsedUrl =
            new URL(
                destination
            );
        if (
            ![
                "http:",
                "https:"
            ].includes(
                parsedUrl.protocol
            )
        ) {
            throw new Error();
        }
    } catch {
        alert(
            "URL tidak valid."
        );
        return;
    }
    try {
        await database.updateLink(
            id,
            {
                title:
                    title,
                destination:
                    destination,
                destination_url:
                    destination
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
// CLOSE MODAL CLICK OUTSIDE
// ======================================================
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
// ======================================================
// ESC CLOSE MODAL
// ======================================================
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
// ======================================================
// EXPORT GLOBAL FUNCTIONS
// ======================================================
window.openStatistics =
    openStatistics;
window.copyLink =
    copyLink;
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
// ======================================================
// INITIAL LOAD
// ======================================================
window.addEventListener(
    "load",
    loadLinks
);
