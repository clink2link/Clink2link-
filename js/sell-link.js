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
            return Number.isFinite(value) ? value : 0;
        }
        let text = String(value).trim();
        if (!text) {
            return 0;
        }
        text = text
            .replace(/Rp/gi, "")
            .replace(/\s/g, "");
        /*
         * 10.000
         */
        if (
            text.includes(".") &&
            !text.includes(",")
        ) {
            text = text.replace(/\./g, "");
        }
        /*
         * 10.000,50
         */
        else if (
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
        }
        /*
         * 10,000
         */
        else {
            text = text.replace(/,/g, "");
        }
        text = text.replace(/[^\d.-]/g, "");
        const result = Number(text);
        return Number.isFinite(result) ? result : 0;
    }
    function formatRupiah(value) {
        return (
            "Rp " +
            numberValue(value).toLocaleString("id-ID")
        );
    }
    /* =========================
       HTML ESCAPE
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
       SAFE ATTRIBUTE
    ========================= */
    function safeAttribute(value) {
        return escapeHtml(String(value ?? ""));
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
            /*
             * Profile hanya tambahan.
             * Jika gagal tidak mengganggu
             * sistem Sell Link.
             */
            try {
                if (
                    typeof database.getProfile ===
                    "function"
                ) {
                    currentProfile =
                        await database.getProfile(
                            user.id
                        );
                }
            } catch (error) {
                console.warn(
                    "PROFILE LOAD WARNING:",
                    error
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
        } catch (error) {
            console.error(
                "LOAD USER ERROR:",
                error
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
        } catch (error) {
            console.error(
                "LOAD SELL ORDER ERROR:",
                error
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
        } catch (error) {
            console.error(
                "LOAD SELL LINK ERROR:",
                error
            );
            sellLinks = [];
            filteredLinks = [];
            renderSellStats();
            const box =
                $("sellList");
            if (box) {
                box.innerHTML = `
                    <div class="empty">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h3>
                            Gagal Memuat Sell Link
                        </h3>
                        <p>
                            ${escapeHtml(
                                error?.message ||
                                "Unknown Error"
                            )}
                        </p>
                    </div>
                `;
            }
        }
    }
    /* =========================
       ORDER HELPER
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
       PAYMENT STATUS
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
       SOLD COUNT
    ========================= */
    function getSoldCount(link) {
        const paidOrders =
            getPaidOrders(link.id);
        /*
         * Jika ada data order berhasil,
         * order menjadi sumber utama.
         */
        if (paidOrders.length > 0) {
            return paidOrders.length;
        }
        /*
         * Fallback ke data links.
         */
        return numberValue(
            link.sales ??
            link.sold ??
            0
        );
    }
    /* =========================
       REVENUE
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
                const price =
                    numberValue(
                        order.price
                    );
                return (
                    total +
                    (
                        receive > 0
                            ? receive
                            : price
                    )
                );
            },
            0
        );
    }
    /* =========================
       STATISTICS
    ========================= */
    function renderSellStats() {
        let totalPrice = 0;
        let totalViews = 0;
        let totalSold = 0;
        let totalRevenue = 0;
        for (const link of sellLinks) {
            totalPrice +=
                numberValue(link.price);
            totalViews +=
                numberValue(
                    link.total_views ??
                    link.views ??
                    0
                );
            totalSold +=
                getSoldCount(link);
            totalRevenue +=
                getLinkRevenue(link.id);
        }
        const totalLink =
            $("sellTotalLink");
        const totalPriceElement =
            $("sellTotalPrice");
        const totalView =
            $("sellTotalView");
        const totalSoldElement =
            $("sellTotalSold");
        const totalRevenueElement =
            $("sellTotalRevenue");
        if (totalLink) {
            totalLink.textContent =
                sellLinks.length.toLocaleString(
                    "id-ID"
                );
        }
        if (totalPriceElement) {
            totalPriceElement.textContent =
                formatRupiah(totalPrice);
        }
        if (totalView) {
            totalView.textContent =
                totalViews.toLocaleString(
                    "id-ID"
                );
        }
        if (totalSoldElement) {
            totalSoldElement.textContent =
                totalSold.toLocaleString(
                    "id-ID"
                );
        }
        if (totalRevenueElement) {
            totalRevenueElement.textContent =
                formatRupiah(totalRevenue);
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
            String(
                searchInput?.value || ""
            )
                .trim()
                .toLowerCase();
        filteredLinks =
            sellLinks.filter(link => {
                const title =
                    String(
                        link.title ?? ""
                    ).toLowerCase();
                const destination =
                    String(
                        link.destination_url ??
                        link.destination ??
                        ""
                    ).toLowerCase();
                const shortCode =
                    String(
                        link.short_code ??
                        link.shortcode ??
                        link.code ??
                        ""
                    ).toLowerCase();
                const matchSearch =
                    !keyword ||
                    title.includes(keyword) ||
                    destination.includes(keyword) ||
                    shortCode.includes(keyword);
                let matchFilter = true;
                const status =
                    String(
                        link.status ?? ""
                    ).toLowerCase();
                if (
                    currentFilter ===
                    "active"
                ) {
                    matchFilter =
                        status === "active";
                } else if (
                    currentFilter ===
                    "inactive"
                ) {
                    matchFilter =
                        status !== "active";
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
                filterButtons.forEach(btn => {
                    btn.classList.remove(
                        "active"
                    );
                });
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
       URL VALIDATION
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
                /* =========================
                   VALIDATION
                ========================= */
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
                if (!isValidHttpUrl(destination)) {
                    alert(
                        "URL tidak valid. Gunakan http:// atau https://"
                    );
                    urlInput?.focus();
                    return;
                }
                if (
                    price <
                    MIN_SELL_PRICE
                ) {
                    alert(
                        "Harga minimal Rp10.000."
                    );
                    priceInput?.focus();
                    return;
                }
                /* =========================
                   LOADING
                ========================= */
                createBtn.disabled = true;
                createBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Membuat Sell Link...
                `;
                try {
                    /* =========================
                       GENERATE UNIQUE CODE
                    ========================= */
                    let shortCode = null;
                    for (
                        let attempt = 0;
                        attempt < 20;
                        attempt++
                    ) {
                        const candidate =
                            generateCode(8);
                        let existing = null;
                        try {
                            if (
                                typeof database.getLinkByCode ===
                                "function"
                            ) {
                                existing =
                                    await database.getLinkByCode(
                                        candidate
                                    );
                            }
                        } catch (error) {
                            console.warn(
                                "CHECK SHORT CODE WARNING:",
                                error
                            );
                            existing = null;
                        }
                        if (!existing) {
                            shortCode =
                                candidate;
                            break;
                        }
                    }
                    if (!shortCode) {
                        throw new Error(
                            "Gagal membuat short code. Silakan coba lagi."
                        );
                    }
                    /* =========================
                       CREATE DATABASE LINK
                    ========================= */
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
                                currentUser.id,
                            type:
                                "sell",
                            link_type:
                                "sell",
                            title:
                                title,
                            destination:
                                destination,
                            destination_url:
                                destination,
                            short_code:
                                shortCode,
                            price:
                                price,
                            status:
                                "active",
                            sold:
                                0,
                            sales:
                                0,
                            views:
                                0,
                            total_views:
                                0
                        });
                    if (!newLink) {
                        throw new Error(
                            "Sell Link tidak berhasil dibuat."
                        );
                    }
                    /* =========================
                       GET CREATED ID
                    ========================= */
                    let createdId =
                        newLink.id ??
                        newLink?.data?.id ??
                        null;
                    /*
                     * Jika createLink() tidak
                     * mengembalikan ID, ambil
                     * ulang dari database.
                     */
                    if (!createdId) {
                        try {
                            const created =
                                await database.getLinkByCode(
                                    shortCode
                                );
                            if (created) {
                                createdId =
                                    created.id;
                            }
                        } catch (error) {
                            console.warn(
                                "GET CREATED LINK WARNING:",
                                error
                            );
                        }
                    }
                    /* =========================
                       RESET FORM
                    ========================= */
                    if (titleInput) {
                        titleInput.value = "";
                    }
                    if (urlInput) {
                        urlInput.value = "";
                    }
                    if (priceInput) {
                        priceInput.value = "";
                    }
                    /* =========================
                       RELOAD DATA
                    ========================= */
                    await loadSellOrders();
                    await loadSellLinks();
                    renderSellStats();
                    applyFilter();
                    /* =========================
                       GENERATED LINK
                    ========================= */
                    const createdLink =
                        createdId
                            ? sellLinks.find(
                                link =>
                                    String(link.id) ===
                                    String(createdId)
                            )
                            : sellLinks.find(
                                link =>
                                    String(
                                        link.short_code ??
                                        ""
                                    ) ===
                                    String(shortCode)
                            );
                    if (createdLink?.id) {
                        generateLink(
                            createdLink.id
                        );
                    } else {
                        /*
                         * Tetap tampilkan link
                         * walaupun database.getLinks
                         * belum langsung mengembalikan
                         * record baru.
                         */
                        showGeneratedLinkDirect(
                            title,
                            shortCode,
                            price,
                            true
                        );
                    }
                    /* =========================
                       SUCCESS MESSAGE
                    ========================= */
                    const result =
                        $("createResult");
                    if (result) {
                        const buyLink =
                            `${location.origin}/b/${shortCode}`;
                        result.innerHTML = `
                            <div class="success-box">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>
                                    Sell Link berhasil dibuat.
                                </span>
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
                } catch (error) {
                    console.error(
                        "CREATE SELL ERROR:",
                        error
                    );
                    alert(
                        error?.message ||
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
            let message =
                "Belum ada Sell Link.";
            if (
                currentFilter ===
                "active"
            ) {
                message =
                    "Tidak ada Sell Link aktif.";
            } else if (
                currentFilter ===
                "inactive"
            ) {
                message =
                    "Tidak ada Sell Link nonaktif.";
            }
            box.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-box-open"></i>
                    <h3>
                        ${escapeHtml(message)}
                    </h3>
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
                        ).toLowerCase() ===
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
                    return `
                        <div
                            class="link-card"
                            data-link-id="${safeAttribute(
                                link.id
                            )}"
                        >
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
                                    ${sold.toLocaleString(
                                        "id-ID"
                                    )}
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
                                    value="${safeAttribute(
                                        sellUrl
                                    )}"
                                >
                                <button
                                    class="btn-copy"
                                    type="button"
                                    data-action="copy"
                                    data-value="${safeAttribute(
                                        sellUrl
                                    )}"
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
                                    data-action="generate"
                                    data-id="${safeAttribute(
                                        link.id
                                    )}"
                                >
                                    <i class="fa-solid fa-link"></i>
                                    Link
                                </button>
                                <button
                                    type="button"
                                    data-action="edit"
                                    data-id="${safeAttribute(
                                        link.id
                                    )}"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    data-action="toggle"
                                    data-id="${safeAttribute(
                                        link.id
                                    )}"
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
                                    data-action="delete"
                                    data-id="${safeAttribute(
                                        link.id
                                    )}"
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
       SELL LIST EVENTS
       EVENT DELEGATION
    ========================= */
    const sellList =
        $("sellList");
    sellList?.addEventListener(
        "click",
        async (event) => {
            const button =
                event.target.closest(
                    "button[data-action]"
                );
            if (!button) {
                return;
            }
            const action =
                button.dataset.action;
            const id =
                button.dataset.id;
            if (action === "copy") {
                await copySell(
                    button.dataset.value
                );
                return;
            }
            if (action === "generate") {
                generateLink(id);
                return;
            }
            if (action === "edit") {
                await editSell(id);
                return;
            }
            if (action === "toggle") {
                await toggleSellStatus(id);
                return;
            }
            if (action === "delete") {
                await deleteSell(id);
            }
        }
    );
    /* =========================
       SHOW GENERATED LINK
       DIRECT
    ========================= */
    function showGeneratedLinkDirect(
        title,
        shortCode,
        price,
        status = true
    ) {
        const box =
            $("generatedBox");
        if (!box) {
            return;
        }
        const buyLink =
            `${location.origin}/b/${shortCode}`;
        box.innerHTML = `
            <div class="link-card">
                <div class="link-top">
                    <h3>
                        ${escapeHtml(
                            title ||
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
                        value="${safeAttribute(
                            buyLink
                        )}"
                    >
                    <button
                        class="btn-copy"
                        type="button"
                        data-action="copy-generated"
                        data-value="${safeAttribute(
                            buyLink
                        )}"
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
    }
    /* =========================
       GENERATE SELL LINK
    ========================= */
    window.generateLink =
        function(id) {
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
            showGeneratedLinkDirect(
                link.title ||
                "Sell Link",
                shortCode,
                numberValue(
                    link.price
                ),
                String(
                    link.status ?? ""
                ).toLowerCase() ===
                "active"
            );
        };
    /* =========================
       GENERATED BOX COPY
    ========================= */
    const generatedBox =
        $("generatedBox");
    generatedBox?.addEventListener(
        "click",
        async (event) => {
            const button =
                event.target.closest(
                    "button[data-action='copy-generated']"
                );
            if (!button) {
                return;
            }
            await copySell(
                button.dataset.value
            );
        }
    );
    /* =========================
       COPY SELL LINK
    ========================= */
    async function copySell(text) {
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
                input.style.opacity =
                    "0";
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
    window.copySell =
        copySell;
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
    window.editSell =
        async function(id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );
                return;
            }
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
                    "Harga Sell Link",
                    numberValue(
                        link.price
                    ).toString()
                );
            if (priceText === null) {
                return;
            }
            const price =
                Math.floor(
                    numberValue(
                        priceText
                    )
                );
            if (
                price <
                MIN_SELL_PRICE
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
                            price:
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
            } catch (error) {
                console.error(
                    "EDIT SELL ERROR:",
                    error
                );
                alert(
                    error?.message ||
                    "Gagal memperbarui Sell Link."
                );
            }
        };
    /* =========================
       DELETE / HIDE
    ========================= */
    window.deleteSell =
        async function(id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );
                return;
            }
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
                            status:
                                "inactive"
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
                    "Sell Link berhasil dinonaktifkan."
                );
            } catch (error) {
                console.error(
                    "DELETE SELL ERROR:",
                    error
                );
                alert(
                    error?.message ||
                    "Gagal menyembunyikan Sell Link."
                );
            }
        };
    /* =========================
       TOGGLE STATUS
    ========================= */
    window.toggleSellStatus =
        async function(id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );
                return;
            }
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
                ).toLowerCase();
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
            } catch (error) {
                console.error(
                    "TOGGLE SELL ERROR:",
                    error
                );
                alert(
                    error?.message ||
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
             * Order harus selesai dimuat
             * sebelum statistik dan link
             * dirender.
             */
            await loadSellOrders();
            await loadSellLinks();
            renderSellStats();
            applyFilter();
        } catch (error) {
            console.error(
                "SELL LINK INIT ERROR:",
                error
            );
        }
    })();
});
