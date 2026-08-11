/* =================================
   CLICK2PAY SELL LINK SYSTEM
================================= */
document.addEventListener("DOMContentLoaded", () => {
    /* =========================
       STATE
    ========================= */
    let sellActive = false;
    let sellLinks = [];
    let filteredLinks = [];
    let sellOrders = [];
    let currentUser = null;
    let currentProfile = null;
    let currentFilter = "all";
    const MIN_SELL_PRICE = 10000;
    /* =========================
       DOM HELPER
    ========================= */
    const $ = (id) => document.getElementById(id);
    /* =========================
       NUMBER HELPER
    ========================= */
    function numberValue(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return 0;
        }
        if (typeof value === "number") {
            return Number.isFinite(value)
                ? value
                : 0;
        }
        let text = String(value).trim();
        if (!text) {
            return 0;
        }
        /*
         * Support:
         * 10000
         * 10.000
         * 10,000
         * Rp 10.000
         * Rp10.000
         */
        text = text.replace(/Rp/gi, "").trim();
        /*
         * Jika terdapat titik dan tidak ada koma,
         * anggap titik sebagai pemisah ribuan.
         */
        if (
            text.includes(".") &&
            !text.includes(",")
        ) {
            text = text.replace(/\./g, "");
        }
        /*
         * Jika terdapat koma dan titik,
         * coba normalisasi format.
         */
        if (
            text.includes(".") &&
            text.includes(",")
        ) {
            const lastDot = text.lastIndexOf(".");
            const lastComma = text.lastIndexOf(",");
            if (lastComma > lastDot) {
                text = text
                    .replace(/\./g, "")
                    .replace(",", ".");
            } else {
                text = text.replace(/,/g, "");
            }
        } else {
            text = text.replace(/,/g, "");
        }
        text = text.replace(/[^\d.-]/g, "");
        const number = Number(text);
        return Number.isFinite(number)
            ? number
            : 0;
    }
    function formatRupiah(value) {
        return (
            "Rp " +
            numberValue(value).toLocaleString("id-ID")
        );
    }
    /* =========================
       ESCAPE HTML
    ========================= */
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    /* =========================
       SAFE ID
    ========================= */
    function safeId(value) {
        return String(value ?? "")
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
    }
    /* =========================
       LOAD USER
    ========================= */
    async function loadUser() {
        try {
            if (!window.database) {
                throw new Error(
                    "Database belum siap."
                );
            }
            if (currentUser) {
                return currentUser;
            }
            const user =
                await database.getUser();
            if (!user) {
                currentUser = null;
                currentProfile = null;
                sellActive = false;
                checkAccess();
                return null;
            }
            currentUser = user;
            try {
                currentProfile =
                    await database.getProfile(user.id);
            } catch (profileError) {
                console.warn(
                    "PROFILE LOAD WARNING:",
                    profileError
                );
                currentProfile = null;
            }
            const sellUnlocked =
                user.sell_unlocked === true;
            const withdrawCount =
                numberValue(
                    user.withdraw_count
                );
            const withdrawUnlocked =
                withdrawCount >= 3;
            const premiumActive =
                user.is_premium === true &&
                user.premium_expires_at &&
                new Date(
                    user.premium_expires_at
                ).getTime() > Date.now();
            sellActive =
                sellUnlocked ||
                withdrawUnlocked ||
                premiumActive;
            checkAccess();
            return currentUser;
        } catch (err) {
            console.error(
                "LOAD USER ERROR:",
                err
            );
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
            const {
                data,
                error
            } = await database.supabase
                .from("sell_orders")
                .select(`
                    link_id,
                    seller_id,
                    price,
                    seller_receive,
                    status,
                    paid_at
                `)
                .eq(
                    "seller_id",
                    currentUser.id
                );
            if (error) {
                throw error;
            }
            sellOrders =
                Array.isArray(data)
                    ? data
                    : [];
        } catch (err) {
            console.error(
                "LOAD SELL ORDER ERROR:",
                err
            );
            sellOrders = [];
        }
    }
    /* =========================
       LOAD SELL LINKS
    ========================= */
    async function loadSellLinks() {
        try {
            if (!currentUser) {
                sellLinks = [];
                filteredLinks = [];
                renderSellStats();
                renderLinks();
                return;
            }
            const data =
                await database.getLinks(
                    currentUser.id
                );
            if (!Array.isArray(data)) {
                sellLinks = [];
                filteredLinks = [];
                renderSellStats();
                renderLinks();
                return;
            }
            sellLinks =
                data.filter(link => {
                    const type =
                        String(
                            link.link_type ??
                            link.type ??
                            ""
                        )
                        .trim()
                        .toLowerCase();
                    return type === "sell";
                });
            filteredLinks =
                [...sellLinks];
            renderSellStats();
            applyFilter();
        } catch (err) {
            console.error(
                "LOAD SELL LINK ERROR:",
                err
            );
            sellLinks = [];
            filteredLinks = [];
            renderSellStats();
            const box = $("sellList");
            if (box) {
                box.innerHTML = `
                    <div class="empty">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h3>Gagal Memuat Sell Link</h3>
                        <p>
                            ${escapeHtml(
                                err.message ||
                                "Unknown Error"
                            )}
                        </p>
                    </div>
                `;
            }
        }
    }
    /* =========================
       GET LINK ORDERS
    ========================= */
    function getLinkOrders(linkId) {
        if (
            !linkId ||
            !Array.isArray(sellOrders)
        ) {
            return [];
        }
        return sellOrders.filter(order =>
            String(order.link_id) ===
            String(linkId)
        );
    }
    /* =========================
       SUCCESS STATUS
    ========================= */
    const SUCCESS_STATUSES = new Set([
        "paid",
        "success",
        "successful",
        "completed",
        "complete",
        "settlement",
        "settled",
        "berhasil"
    ]);
    function isPaidOrder(order) {
        const status =
            String(
                order?.status ?? ""
            )
            .trim()
            .toLowerCase();
        return SUCCESS_STATUSES.has(status);
    }
    function getPaidOrders(linkId) {
        return getLinkOrders(linkId)
            .filter(isPaidOrder);
    }
    /* =========================
       GET SOLD COUNT
    ========================= */
    function getSoldCount(link) {
        const paidOrders =
            getPaidOrders(link.id);
        /*
         * Order paid adalah sumber utama.
         */
        if (paidOrders.length > 0) {
            return paidOrders.length;
        }
        /*
         * Fallback jika belum ada order
         * yang berhasil.
         */
        return numberValue(
            link.sales ??
            link.sold ??
            0
        );
    }
    /* =========================
       GET REVENUE
    ========================= */
    function getLinkRevenue(linkId) {
        const paidOrders =
            getPaidOrders(linkId);
        return paidOrders.reduce(
            (total, order) => {
                const receive =
                    numberValue(
                        order.seller_receive
                    );
                /*
                 * seller_receive lebih diprioritaskan.
                 *
                 * Jika kosong, fallback ke price.
                 */
                return (
                    total +
                    (
                        receive > 0
                            ? receive
                            : numberValue(
                                order.price
                            )
                    )
                );
            },
            0
        );
    }
    /* =========================
       STATS
    ========================= */
    function renderSellStats() {
        const totalLink =
            $("sellTotalLink");
        const totalPrice =
            $("sellTotalPrice");
        const totalView =
            $("sellTotalView");
        const totalSold =
            $("sellTotalSold");
        const totalRevenue =
            $("sellTotalRevenue");
        let totalSellPrice = 0;
        let totalRevenueValue = 0;
        let totalSoldValue = 0;
        let totalViewsValue = 0;
        for (const link of sellLinks) {
            totalSellPrice +=
                numberValue(link.price);
            totalViewsValue +=
                numberValue(
                    link.total_views ??
                    link.views ??
                    0
                );
            totalSoldValue +=
                getSoldCount(link);
            totalRevenueValue +=
                getLinkRevenue(link.id);
        }
        if (totalLink) {
            totalLink.textContent =
                sellLinks.length
                    .toLocaleString("id-ID");
        }
        if (totalPrice) {
            totalPrice.textContent =
                formatRupiah(
                    totalSellPrice
                );
        }
        if (totalView) {
            totalView.textContent =
                totalViewsValue
                    .toLocaleString("id-ID");
        }
        if (totalSold) {
            totalSold.textContent =
                totalSoldValue
                    .toLocaleString("id-ID");
        }
        if (totalRevenue) {
            totalRevenue.textContent =
                formatRupiah(
                    totalRevenueValue
                );
        }
    }
    /* =========================
       SEARCH & FILTER
    ========================= */
    const searchInput =
        $("searchInput");
    const filterButtons =
        document.querySelectorAll(
            ".link-filter button"
        );
    function applyFilter() {
        const keyword =
            (
                searchInput?.value ||
                ""
            )
            .trim()
            .toLowerCase();
        filteredLinks =
            sellLinks.filter(link => {
                const title =
                    String(
                        link.title ?? ""
                    )
                    .toLowerCase();
                const destination =
                    String(
                        link.destination_url ??
                        link.destination ??
                        ""
                    )
                    .toLowerCase();
                const shortCode =
                    String(
                        link.short_code ??
                        link.shortcode ??
                        link.code ??
                        ""
                    )
                    .toLowerCase();
                const matchSearch =
                    title.includes(keyword) ||
                    destination.includes(keyword) ||
                    shortCode.includes(keyword);
                let matchFilter = true;
                switch (currentFilter) {
                    case "active":
                        matchFilter =
                            String(
                                link.status ?? ""
                            )
                            .toLowerCase() ===
                            "active";
                        break;
                    case "inactive":
                        matchFilter =
                            String(
                                link.status ?? ""
                            )
                            .toLowerCase() !==
                            "active";
                        break;
                    default:
                        matchFilter = true;
                }
                return (
                    matchSearch &&
                    matchFilter
                );
            });
        renderLinks();
    }
    searchInput?.addEventListener(
        "input",
        applyFilter
    );
    filterButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                filterButtons.forEach(btn =>
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
    });
    /* =========================
       GENERATE SHORT CODE
    ========================= */
    function generateCode(length = 8) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let code = "";
        if (
            window.crypto &&
            typeof window.crypto.getRandomValues ===
            "function"
        ) {
            const bytes =
                new Uint8Array(length);
            window.crypto.getRandomValues(bytes);
            for (const byte of bytes) {
                code +=
                    chars[
                        byte % chars.length
                    ];
            }
        } else {
            for (
                let i = 0;
                i < length;
                i++
            ) {
                code +=
                    chars[
                        Math.floor(
                            Math.random() *
                            chars.length
                        )
                    ];
            }
        }
        return code;
    }
    /* =========================
       VALIDATE URL
    ========================= */
    function isValidHttpUrl(value) {
        try {
            const url =
                new URL(value);
            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );
        } catch {
            return false;
        }
    }
    /* =========================
       CREATE SELL LINK
    ========================= */
    const createBtn =
        $("createSellBtn");
    if (createBtn) {
        createBtn.addEventListener(
            "click",
            async () => {
                if (createBtn.disabled) {
                    return;
                }
                if (!sellActive) {
                    alert(
                        "Sell Link belum aktif."
                    );
                    return;
                }
                if (!currentUser) {
                    alert(
                        "User belum login."
                    );
                    return;
                }
                const titleInput =
                    $("sellTitle");
                const urlInput =
                    $("sellUrl");
                const priceInput =
                    $("sellPrice");
                const title =
                    titleInput?.value
                        ?.trim() || "";
                const destination =
                    urlInput?.value
                        ?.trim() || "";
                const price =
                    Math.floor(
                        numberValue(
                            priceInput?.value
                        )
                    );
                if (!title) {
                    alert(
                        "Judul Sell Link wajib diisi."
                    );
                    titleInput?.focus();
                    return;
                }
                if (!destination) {
                    alert(
                        "Destination URL wajib diisi."
                    );
                    urlInput?.focus();
                    return;
                }
                if (price < MIN_SELL_PRICE) {
                    alert(
                        "Harga minimal Rp10.000."
                    );
                    priceInput?.focus();
                    return;
                }
                if (!isValidHttpUrl(destination)) {
                    alert(
                        "URL tidak valid. Gunakan http:// atau https://"
                    );
                    urlInput?.focus();
                    return;
                }
                createBtn.disabled = true;
                createBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Membuat Sell Link...
                `;
                try {
                    /*
                     * Generate short code.
                     */
                    let short_code = null;
                    for (
                        let attempt = 0;
                        attempt < 20;
                        attempt++
                    ) {
                        const candidate =
                            generateCode(8);
                        const existing =
                            await database.getLinkByCode(
                                candidate
                            );
                        if (!existing) {
                            short_code =
                                candidate;
                            break;
                        }
                    }
                    if (!short_code) {
                        throw new Error(
                            "Gagal membuat short code. Silakan coba lagi."
                        );
                    }
                    /*
                     * Create link.
                     */
                    const newLink =
                        await database.createLink({
                            user_id:
                                currentUser.id,
                            type:
                                "sell",
                            link_type:
                                "sell",
                            title,
                            destination,
                            destination_url:
                                destination,
                            short_code,
                            price,
                            status:
                                "active",
                            sold: 0,
                            sales: 0,
                            views: 0,
                            total_views: 0
                        });
                    if (!newLink) {
                        throw new Error(
                            "Sell Link tidak berhasil dibuat."
                        );
                    }
                    /*
                     * Reset form.
                     */
                    if (titleInput) {
                        titleInput.value = "";
                    }
                    if (urlInput) {
                        urlInput.value = "";
                    }
                    if (priceInput) {
                        priceInput.value = "";
                    }
                    /*
                     * Reload data.
                     */
                    await loadSellOrders();
                    await loadSellLinks();
                    renderSellStats();
                    applyFilter();
                    /*
                     * Tampilkan generated link.
                     */
                    const createdId =
                        newLink.id;
                    if (createdId) {
                        generateLink(
                            createdId
                        );
                    } else {
                        /*
                         * Fallback berdasarkan
                         * short_code.
                         */
                        const createdLink =
                            sellLinks.find(
                                link =>
                                    String(
                                        link.short_code ??
                                        ""
                                    ) ===
                                    String(
                                        short_code
                                    )
                            );
                        if (createdLink?.id) {
                            generateLink(
                                createdLink.id
                            );
                        }
                    }
                    const result =
                        $("createResult");
                    if (result) {
                        const buyLink =
                            `${location.origin}/b/${short_code}`;
                        result.innerHTML = `
                            <div class="success-box">
                                <i class="fa-solid fa-circle-check"></i>
                                Sell Link berhasil dibuat.
                                <div style="margin-top:8px;">
                                    <small>
                                        ${escapeHtml(
                                            buyLink
                                        )}
                                    </small>
                                </div>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error(
                        "CREATE SELL ERROR:",
                        err
                    );
                    alert(
                        err?.message ||
                        "Gagal membuat Sell Link."
                    );
                } finally {
                    createBtn.disabled = false;
                    checkAccess();
                }
            }
        );
    }
    /* =========================
       RENDER SELL LINKS
    ========================= */
    function renderLinks() {
        const box =
            $("sellList");
        if (!box) {
            return;
        }
        if (!filteredLinks.length) {
            box.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-box-open"></i>
                    <h3>Belum Ada Sell Link</h3>
                    <p>
                        Silakan buat Sell Link pertama Anda.
                    </p>
                </div>
            `;
            return;
        }
        box.innerHTML =
            filteredLinks
                .map(link => {
                    const shortCode =
                        link.short_code ??
                        link.shortcode ??
                        link.code ??
                        "";
                    const sellUrl =
                        `${location.origin}/b/${shortCode}`;
                    const status =
                        String(
                            link.status ?? ""
                        )
                        .toLowerCase() ===
                        "active";
                    const sold =
                        getSoldCount(link);
                    const revenue =
                        getLinkRevenue(
                            link.id
                        );
                    const views =
                        numberValue(
                            link.total_views ??
                            link.views ??
                            0
                        );
                    const price =
                        numberValue(
                            link.price
                        );
                    const destination =
                        link.destination_url ??
                        link.destination ??
                        "-";
                    const date =
                        link.created_at
                            ? new Date(
                                link.created_at
                            ).toLocaleDateString(
                                "id-ID"
                            )
                            : "-";
                    const linkId =
                        safeId(link.id);
                    const copyUrl =
                        safeId(sellUrl);
                    return `
                        <div class="link-card">
                            <div class="link-top">
                                <div>
                                    <h3>
                                        ${escapeHtml(
                                            link.title ||
                                            "Sell Link"
                                        )}
                                    </h3>
                                    <small>
                                        Dibuat:
                                        ${escapeHtml(date)}
                                    </small>
                                </div>
                                <span class="badge ${
                                    status
                                        ? "green"
                                        : "red"
                                }">
                                    <i class="fa-solid ${
                                        status
                                            ? "fa-circle-check"
                                            : "fa-circle-xmark"
                                    }"></i>
                                    ${
                                        status
                                            ? "Aktif"
                                            : "Nonaktif"
                                    }
                                </span>
                            </div>
                            <div class="badge-group">
                                <span class="badge blue">
                                    <i class="fa-solid fa-money-bill"></i>
                                    ${formatRupiah(price)}
                                </span>
                                <span class="badge">
                                    <i class="fa-solid fa-cart-shopping"></i>
                                    ${sold.toLocaleString("id-ID")}
                                    Terjual
                                </span>
                            </div>
                            <div class="link-info">
                                <small>
                                    <i class="fa-solid fa-link"></i>
                                    ${escapeHtml(
                                        destination
                                    )}
                                </small>
                            </div>
                            <label>
                                Link Buy
                            </label>
                            <div class="copy-box">
                                <input
                                    type="text"
                                    readonly
                                    value="${escapeHtml(
                                        sellUrl
                                    )}"
                                >
                                <button
                                    class="btn-copy"
                                    type="button"
                                    onclick="copySell('${copyUrl}')"
                                >
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                            <div class="link-stats">
                                <div>
                                    <i class="fa-solid fa-eye"></i>
                                    <span>
                                        ${views.toLocaleString(
                                            "id-ID"
                                        )}
                                    </span>
                                    <small>
                                        Views
                                    </small>
                                </div>
                                <div>
                                    <i class="fa-solid fa-cart-shopping"></i>
                                    <span>
                                        ${sold.toLocaleString(
                                            "id-ID"
                                        )}
                                    </span>
                                    <small>
                                        Terjual
                                    </small>
                                </div>
                                <div>
                                    <i class="fa-solid fa-money-bill-trend-up"></i>
                                    <span>
                                        ${formatRupiah(
                                            revenue
                                        )}
                                    </span>
                                    <small>
                                        Pendapatan
                                    </small>
                                </div>
                            </div>
                            <div class="link-actions">
                                <button
                                    type="button"
                                    onclick="generateLink('${linkId}')"
                                >
                                    <i class="fa-solid fa-link"></i>
                                    Link
                                </button>
                                <button
                                    type="button"
                                    onclick="editSell('${linkId}')"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onclick="toggleSellStatus('${linkId}')"
                                >
                                    <i class="fa-solid ${
                                        status
                                            ? "fa-toggle-off"
                                            : "fa-toggle-on"
                                    }"></i>
                                    ${
                                        status
                                            ? "Nonaktifkan"
                                            : "Aktifkan"
                                    }
                                </button>
                                <button
                                    type="button"
                                    onclick="deleteSell('${linkId}')"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                    Hapus
                                </button>
                            </div>
                        </div>
                    `;
                })
                .join("");
    }
    /* =========================
       GENERATE SELL LINK
    ========================= */
    window.generateLink = function(id) {
        const link =
            sellLinks.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!link) {
            alert(
                "Sell Link tidak ditemukan."
            );
            return;
        }
        const box =
            $("generatedBox");
        if (!box) {
            return;
        }
        const shortCode =
            link.short_code ??
            link.shortcode ??
            link.code ??
            "";
        if (!shortCode) {
            alert(
                "Short code tidak ditemukan."
            );
            return;
        }
        const buyLink =
            `${location.origin}/b/${shortCode}`;
        const price =
            numberValue(link.price);
        const status =
            String(
                link.status ?? ""
            ).toLowerCase() ===
            "active";
        const safeBuyLink =
            safeId(buyLink);
        box.innerHTML = `
            <div class="link-card">
                <div class="link-top">
                    <h3>
                        ${escapeHtml(
                            link.title ||
                            "Sell Link"
                        )}
                    </h3>
                </div>
                <div class="badge-group">
                    <span class="badge ${
                        status
                            ? "green"
                            : "red"
                    }">
                        <i class="fa-solid ${
                            status
                                ? "fa-circle-check"
                                : "fa-circle-xmark"
                        }"></i>
                        ${
                            status
                                ? "Link Aktif"
                                : "Link Nonaktif"
                        }
                    </span>
                    <span class="badge blue">
                        <i class="fa-solid fa-money-bill"></i>
                        ${formatRupiah(price)}
                    </span>
                </div>
                <label>
                    Buy Link
                </label>
                <div class="copy-box">
                    <input
                        readonly
                        value="${escapeHtml(
                            buyLink
                        )}"
                    >
                    <button
                        class="btn-copy"
                        type="button"
                        onclick="copySell('${safeBuyLink}')"
                    >
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
                <div class="link-info">
                    <small>
                        Short Code:
                        <b>
                            ${escapeHtml(
                                shortCode
                            )}
                        </b>
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
    window.copySell = async function(text) {
        try {
            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                await navigator.clipboard.writeText(
                    text
                );
            } else {
                const input =
                    document.createElement(
                        "input"
                    );
                input.value = text;
                input.style.position =
                    "fixed";
                input.style.opacity = "0";
                document.body.appendChild(
                    input
                );
                input.select();
                input.setSelectionRange(
                    0,
                    input.value.length
                );
                document.execCommand(
                    "copy"
                );
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
    /* =========================
       ACCESS
    ========================= */
    function checkAccess() {
        const btn =
            $("createSellBtn");
        const status =
            $("sellStatus");
        if (!btn || !status) {
            return;
        }
        status.classList.remove(
            "active",
            "inactive"
        );
        if (sellActive) {
            status.classList.add(
                "active"
            );
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
            status.classList.add(
                "inactive"
            );
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
    window.editSell = async function(id) {
        const link =
            sellLinks.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!link) {
            alert(
                "Sell Link tidak ditemukan."
            );
            return;
        }
        const title =
            prompt(
                "Judul Sell Link",
                link.title || ""
            );
        if (title === null) {
            return;
        }
        const cleanTitle =
            title.trim();
        if (!cleanTitle) {
            alert(
                "Judul tidak boleh kosong."
            );
            return;
        }
        const destination =
            prompt(
                "Destination URL",
                link.destination_url ??
                link.destination ??
                ""
            );
        if (destination === null) {
            return;
        }
        const cleanDestination =
            destination.trim();
        if (
            !isValidHttpUrl(
                cleanDestination
            )
        ) {
            alert(
                "URL tidak valid."
            );
            return;
        }
        const priceText =
            prompt(
                "Harga",
                numberValue(
                    link.price
                ).toString()
            );
        if (priceText === null) {
            return;
        }
        const price =
            Math.floor(
                numberValue(priceText)
            );
        if (
            price < MIN_SELL_PRICE
        ) {
            alert(
                "Minimal Rp10.000."
            );
            return;
        }
        try {
            const {
                error
            } =
                await database.supabase
                    .from("links")
                    .update({
                        title:
                            cleanTitle,
                        destination:
                            cleanDestination,
                        destination_url:
                            cleanDestination,
                        price
                    })
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );
            if (error) {
                throw error;
            }
            await loadSellLinks();
            alert(
                "Sell Link berhasil diperbarui."
            );
        } catch (err) {
            console.error(
                "EDIT SELL ERROR:",
                err
            );
            alert(
                err?.message ||
                "Gagal memperbarui Sell Link."
            );
        }
    };
    /* =========================
       DELETE / HIDE SELL LINK
    ========================= */
    window.deleteSell = async function(id) {
        const link =
            sellLinks.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!link) {
            alert(
                "Sell Link tidak ditemukan."
            );
            return;
        }
        const confirmed =
            confirm(
                `Sembunyikan Sell Link "${link.title || "Sell Link"}"?`
            );
        if (!confirmed) {
            return;
        }
        try {
            const {
                error
            } =
                await database.supabase
                    .from("links")
                    .update({
                        status: "inactive"
                    })
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );
            if (error) {
                throw error;
            }
            /*
             * Jangan menghapus dari sellLinks.
             *
             * Karena link sebenarnya hanya
             * berubah menjadi inactive.
             *
             * Ini penting supaya filter
             * "inactive" tetap bisa melihatnya.
             */
            const localLink =
                sellLinks.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );
            if (localLink) {
                localLink.status =
                    "inactive";
            }
            renderSellStats();
            applyFilter();
            alert(
                "Sell Link berhasil disembunyikan."
            );
        } catch (err) {
            console.error(
                "DELETE SELL ERROR:",
                err
            );
            alert(
                err?.message ||
                "Gagal menyembunyikan Sell Link."
            );
        }
    };
    /* =========================
       TOGGLE STATUS
    ========================= */
    window.toggleSellStatus =
        async function(id) {
            const link =
                sellLinks.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );
            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );
                return;
            }
            const currentStatus =
                String(
                    link.status ?? ""
                )
                .toLowerCase();
            const newStatus =
                currentStatus === "active"
                    ? "inactive"
                    : "active";
            try {
                const {
                    error
                } =
                    await database.supabase
                        .from("links")
                        .update({
                            status:
                                newStatus
                        })
                        .eq(
                            "id",
                            id
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );
                if (error) {
                    throw error;
                }
                link.status =
                    newStatus;
                renderSellStats();
                applyFilter();
                alert(
                    newStatus === "active"
                        ? "Sell Link berhasil diaktifkan."
                        : "Sell Link berhasil dinonaktifkan."
                );
            } catch (err) {
                console.error(
                    "TOGGLE SELL ERROR:",
                    err
                );
                alert(
                    err?.message ||
                    "Gagal mengubah status Sell Link."
                );
            }
        };
    /* =========================
       INIT
    ========================= */
    (async function initSellLink() {
        try {
            const user =
                await loadUser();
            if (!user) {
                return;
            }
            /*
             * Order harus dimuat terlebih dahulu
             * sebelum link dirender.
             */
            await loadSellOrders();
            await loadSellLinks();
            renderSellStats();
            applyFilter();
        } catch (err) {
            console.error(
                "SELL LINK INIT ERROR:",
                err
            );
        }
    })();
});
