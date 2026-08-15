/* =================================
   CLICK2PAY SELL LINK SYSTEM
   CLEAN / STABLE VERSION
================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================
       CONFIG
    ========================= */

    const MIN_SELL_PRICE = 10000;
    const SELL_LINK_PREFIX = "/b/";

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

    /* =========================
       DOM
    ========================= */

    const $ = (id) => document.getElementById(id);

    const sellList = $("sellList");
    const generatedBox = $("generatedBox");
    const createBtn = $("createSellBtn");
    const searchInput = $("searchInput");

    const filterButtons =
        document.querySelectorAll(".link-filter button");

    /* =========================
       NUMBER
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

        let text = String(value)
            .trim()
            .replace(/Rp/gi, "")
            .replace(/\s/g, "");

        if (!text) {
            return 0;
        }

        /*
         * Indonesia:
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
            const dot = text.lastIndexOf(".");
            const comma = text.lastIndexOf(",");

            if (comma > dot) {
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
       BOOLEAN
    ========================= */

    function isTrue(value) {
        return (
            value === true ||
            value === 1 ||
            value === "1" ||
            String(value).toLowerCase() === "true"
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

    function safeAttribute(value) {
        return escapeHtml(String(value ?? ""));
    }

    /* =========================
       LINK HELPERS
    ========================= */

    function getLinkType(link) {
        return String(
            link?.link_type ??
            link?.type ??
            ""
        )
            .trim()
            .toLowerCase();
    }

    function getShortCode(link) {
        return String(
            link?.short_code ??
            link?.shortcode ??
            link?.code ??
            ""
        ).trim();
    }

    function getDestination(link) {
        return String(
            link?.destination_url ??
            link?.destination ??
            ""
        ).trim();
    }

    function isLinkActive(link) {
        return (
            String(link?.status ?? "")
                .trim()
                .toLowerCase() === "active"
        );
    }

    function getBuyUrl(shortCode) {
        if (!shortCode) {
            return "";
        }

        return (
            location.origin +
            SELL_LINK_PREFIX +
            encodeURIComponent(shortCode)
        );
    }

    /* =========================
       URL VALIDATION
    ========================= */

    function isValidHttpUrl(value) {
        try {
            const url = new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );
        } catch {
            return false;
        }
    }

    /* =========================
       DATABASE
    ========================= */

    function ensureDatabase() {
        if (!window.database) {
            throw new Error(
                "Database belum siap."
            );
        }

        return window.database;
    }

    function ensureSupabase() {
        const db = ensureDatabase();

        if (!db.supabase) {
            throw new Error(
                "Supabase database belum tersedia."
            );
        }

        return db.supabase;
    }

    /* =========================
       LOAD USER
    ========================= */

    async function loadUser() {
        try {
            const db = ensureDatabase();

            if (currentUser) {
                return currentUser;
            }

            if (
                typeof db.getUser !==
                "function"
            ) {
                throw new Error(
                    "database.getUser() tidak tersedia."
                );
            }

            const user = await db.getUser();

            if (!user) {
                currentUser = null;
                currentProfile = null;
                sellActive = false;

                checkAccess();

                return null;
            }

            currentUser = user;

            /* =========================
               PROFILE
            ========================= */

            currentProfile = null;

            if (
                typeof db.getProfile ===
                "function"
            ) {
                try {
                    currentProfile =
                        await db.getProfile(
                            user.id
                        );
                } catch (error) {
                    console.warn(
                        "PROFILE LOAD WARNING:",
                        error
                    );
                }
            }

            /* =========================
               SELL ACCESS
            ========================= */

            const sellUnlocked =
                isTrue(user.sell_unlocked);

            const withdrawCount =
                numberValue(
                    user.withdraw_count
                );

            const withdrawUnlocked =
                withdrawCount >= 3;

            const premiumExpires =
                user.premium_expires_at
                    ? new Date(
                          user.premium_expires_at
                      ).getTime()
                    : 0;

            const premiumActive =
                isTrue(user.is_premium) &&
                premiumExpires > Date.now();

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
        if (!currentUser) {
            sellOrders = [];
            return [];
        }

        try {
            const supabase =
                ensureSupabase();

            const {
                data,
                error
            } = await supabase
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

            return sellOrders;

        } catch (error) {
            console.error(
                "LOAD SELL ORDER ERROR:",
                error
            );

            sellOrders = [];

            return [];
        }
    }

    /* =========================
       LOAD SELL LINKS
    ========================= */

    async function loadSellLinks() {
        if (!currentUser) {
            sellLinks = [];
            filteredLinks = [];

            renderSellStats();
            renderLinks();

            return [];
        }

        try {
            const db =
                ensureDatabase();

            if (
                typeof db.getLinks !==
                "function"
            ) {
                throw new Error(
                    "database.getLinks() tidak tersedia."
                );
            }

            const data =
                await db.getLinks(
                    currentUser.id
                );

            const loadedLinks =
                Array.isArray(data)
                    ? data.filter(
                          (link) =>
                              getLinkType(
                                  link
                              ) === "sell"
                      )
                    : [];

            sellLinks = loadedLinks;

            filteredLinks = [
                ...sellLinks
            ];

            renderSellStats();
            applyFilter();

            return sellLinks;

        } catch (error) {
            console.error(
                "LOAD SELL LINK ERROR:",
                error
            );

            sellLinks = [];
            filteredLinks = [];

            renderSellStats();

            if (sellList) {
                sellList.innerHTML = `
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

            return [];
        }
    }

    /* =========================
       ORDER HELPERS
    ========================= */

    function getLinkOrders(linkId) {
        if (!linkId) {
            return [];
        }

        return sellOrders.filter(
            (order) =>
                String(order?.link_id) ===
                String(linkId)
        );
    }

    function isPaidOrder(order) {
        const status =
            String(
                order?.status ?? ""
            )
                .trim()
                .toLowerCase();

        return SUCCESS_STATUSES.has(
            status
        );
    }

    function getPaidOrders(linkId) {
        return getLinkOrders(
            linkId
        ).filter(isPaidOrder);
    }

    /* =========================
       SOLD
    ========================= */

    function getSoldCount(link) {
        if (!link) {
            return 0;
        }

        const paidOrders =
            getPaidOrders(link.id);

        /*
         * Order sukses menjadi
         * sumber utama.
         */
        if (paidOrders.length > 0) {
            return paidOrders.length;
        }

        /*
         * Fallback ke kolom links.
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
                const sellerReceive =
                    numberValue(
                        order?.seller_receive
                    );

                const price =
                    numberValue(
                        order?.price
                    );

                /*
                 * Utamakan seller_receive.
                 */
                return (
                    total +
                    (
                        sellerReceive > 0
                            ? sellerReceive
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
                numberValue(
                    link?.price
                );

            totalViews +=
                numberValue(
                    link?.total_views ??
                    link?.views ??
                    0
                );

            totalSold +=
                getSoldCount(link);

            totalRevenue +=
                getLinkRevenue(
                    link?.id
                );
        }

        const totalLink =
            $("sellTotalLink");

        const totalPriceEl =
            $("sellTotalPrice");

        const totalView =
            $("sellTotalView");

        const totalSoldEl =
            $("sellTotalSold");

        const totalRevenueEl =
            $("sellTotalRevenue");

        if (totalLink) {
            totalLink.textContent =
                sellLinks.length.toLocaleString(
                    "id-ID"
                );
        }

        if (totalPriceEl) {
            totalPriceEl.textContent =
                formatRupiah(
                    totalPrice
                );
        }

        if (totalView) {
            totalView.textContent =
                totalViews.toLocaleString(
                    "id-ID"
                );
        }

        if (totalSoldEl) {
            totalSoldEl.textContent =
                totalSold.toLocaleString(
                    "id-ID"
                );
        }

        if (totalRevenueEl) {
            totalRevenueEl.textContent =
                formatRupiah(
                    totalRevenue
                );
        }
    }

    /* =========================
       FILTER
    ========================= */

    function applyFilter() {
        const keyword =
            String(
                searchInput?.value || ""
            )
                .trim()
                .toLowerCase();

        filteredLinks =
            sellLinks.filter(
                (link) => {
                    const title =
                        String(
                            link?.title ??
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

                    const matchSearch =
                        !keyword ||
                        title.includes(
                            keyword
                        ) ||
                        destination.includes(
                            keyword
                        ) ||
                        shortCode.includes(
                            keyword
                        );

                    const active =
                        isLinkActive(link);

                    let matchFilter = true;

                    if (
                        currentFilter ===
                        "active"
                    ) {
                        matchFilter =
                            active;
                    }

                    if (
                        currentFilter ===
                        "inactive"
                    ) {
                        matchFilter =
                            !active;
                    }

                    return (
                        matchSearch &&
                        matchFilter
                    );
                }
            );

        renderLinks();
    }

    searchInput?.addEventListener(
        "input",
        applyFilter
    );

    filterButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    filterButtons.forEach(
                        (btn) =>
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

    /* =========================
       GENERATE CODE
    ========================= */

    function generateCode(length = 8) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        let code = "";

        if (
            window.crypto &&
            typeof window.crypto
                .getRandomValues ===
                "function"
        ) {
            const bytes =
                new Uint8Array(length);

            window.crypto.getRandomValues(
                bytes
            );

            for (
                let i = 0;
                i < length;
                i++
            ) {
                code +=
                    chars[
                        bytes[i] %
                            chars.length
                    ];
            }

            return code;
        }

        for (
            let i = 0;
            i < length;
            i++
        ) {
            code +=
                chars[(crypto.getRandomValues(new Uint32Array(1))[0] % chars.length)];
        }

        return code;
    }

    /* =========================
       UNIQUE CODE
    ========================= */

    async function createUniqueShortCode() {
        const db =
            ensureDatabase();

        for (
            let attempt = 0;
            attempt < 20;
            attempt++
        ) {
            const candidate =
                generateCode(8);

            let existing = null;

            /*
             * Check melalui helper
             * database bila tersedia.
             */
            if (
                typeof db.getLinkByCode ===
                "function"
            ) {
                try {
                    existing =
                        await db.getLinkByCode(
                            candidate
                        );
                } catch (error) {
                    console.warn(
                        "SHORT CODE CHECK WARNING:",
                        error
                    );
                }
            }

            /*
             * Fallback check local state.
             */
            if (!existing) {
                existing =
                    sellLinks.find(
                        (link) =>
                            getShortCode(
                                link
                            ) === candidate
                    );
            }

            if (!existing) {
                return candidate;
            }
        }

        throw new Error(
            "Gagal membuat short code unik. Silakan coba lagi."
        );
    }

    /* =========================
       CREATE SELL LINK
    ========================= */

    createBtn?.addEventListener(
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

            if (
                !isValidHttpUrl(
                    destination
                )
            ) {
                alert(
                    "URL tidak valid. Gunakan http:// atau https://"
                );

                urlInput?.focus();

                return;
            }

            if (
                price < MIN_SELL_PRICE
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
                   SHORT CODE
                ========================= */

                const shortCode =
                    await createUniqueShortCode();

                /* =========================
                   DATABASE
                ========================= */

                const db =
                    ensureDatabase();

                if (
                    typeof db.createLink !==
                    "function"
                ) {
                    throw new Error(
                        "database.createLink() tidak tersedia."
                    );
                }

                const payload = {
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
                };

                const response =
                    await db.createLink(
                        payload
                    );

                if (
                    response?.error
                ) {
                    throw response.error;
                }

                /* =========================
                   NORMALIZE RESPONSE
                ========================= */

                let createdData =
                    response?.data ??
                    response;

                if (
                    Array.isArray(
                        createdData
                    )
                ) {
                    createdData =
                        createdData[0] ||
                        null;
                }

                if (
                    createdData &&
                    typeof createdData !==
                        "object"
                ) {
                    createdData = null;
                }

                /*
                 * Object final.
                 */
                const createdLink = {
                    ...(createdData || {}),

                    id:
                        createdData?.id ??
                        null,

                    user_id:
                        currentUser.id,

                    type:
                        "sell",

                    link_type:
                        "sell",

                    title:
                        createdData?.title ??
                        title,

                    destination:
                        createdData?.destination ??
                        destination,

                    destination_url:
                        createdData?.destination_url ??
                        destination,

                    short_code:
                        createdData?.short_code ??
                        shortCode,

                    price:
                        numberValue(
                            createdData?.price ??
                            price
                        ),

                    status:
                        createdData?.status ??
                        "active",

                    sales:
                        numberValue(
                            createdData?.sales ??
                            0
                        ),

                    sold:
                        numberValue(
                            createdData?.sold ??
                            0
                        ),

                    views:
                        numberValue(
                            createdData?.views ??
                            0
                        ),

                    total_views:
                        numberValue(
                            createdData?.total_views ??
                            0
                        )
                };

                /* =========================
                   LOCAL STATE
                ========================= */

                const duplicateIndex =
                    sellLinks.findIndex(
                        (link) =>
                            (
                                createdLink.id &&
                                link?.id &&
                                String(
                                    link.id
                                ) ===
                                String(
                                    createdLink.id
                                )
                            ) ||
                            (
                                getShortCode(
                                    link
                                ) ===
                                shortCode
                            )
                    );

                if (
                    duplicateIndex === -1
                ) {
                    sellLinks.unshift(
                        createdLink
                    );
                } else {
                    sellLinks[
                        duplicateIndex
                    ] = {
                        ...sellLinks[
                            duplicateIndex
                        ],
                        ...createdLink
                    };
                }

                /* =========================
                   RENDER IMMEDIATELY
                ========================= */

                renderSellStats();
                applyFilter();

                showGeneratedLinkDirect(
                    title,
                    shortCode,
                    price,
                    true
                );

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
                   SYNC DATABASE
                ========================= */

                await Promise.all([
                    loadSellOrders(),
                    loadSellLinks()
                ]);

                /*
                 * Setelah reload dari database,
                 * pastikan UI kembali ter-update.
                 */
                renderSellStats();
                applyFilter();

                /*
                 * Generated link tetap
                 * ditampilkan.
                 */
                showGeneratedLinkDirect(
                    title,
                    shortCode,
                    price,
                    true
                );

                /* =========================
                   RESULT MESSAGE
                ========================= */

                const result =
                    $("createResult");

                if (result) {
                    const buyLink =
                        getBuyUrl(
                            shortCode
                        );

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

    /* =========================
       RENDER LINKS
    ========================= */

    function renderLinks() {
        if (!sellList) {
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
            }

            if (
                currentFilter ===
                "inactive"
            ) {
                message =
                    "Tidak ada Sell Link nonaktif.";
            }

            sellList.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-box-open"></i>

                    <h3>
                        ${escapeHtml(
                            message
                        )}
                    </h3>

                    <p>
                        Silakan buat Sell Link pertama Anda.
                    </p>
                </div>
            `;

            return;
        }

        sellList.innerHTML =
            filteredLinks
                .map(
                    (link) =>
                        renderLinkCard(
                            link
                        )
                )
                .join("");
    }

    /* =========================
       LINK CARD
    ========================= */

    function renderLinkCard(link) {
        const id =
            link?.id ?? "";

        const shortCode =
            getShortCode(link);

        const sellUrl =
            getBuyUrl(shortCode);

        const status =
            isLinkActive(link);

        const sold =
            getSoldCount(link);

        const revenue =
            getLinkRevenue(id);

        const views =
            numberValue(
                link?.total_views ??
                link?.views ??
                0
            );

        const price =
            numberValue(
                link?.price
            );

        const destination =
            getDestination(link);

        const date =
            link?.created_at
                ? new Date(
                      link.created_at
                  ).toLocaleDateString(
                      "id-ID"
                  )
                : "-";

        const destinationHtml =
            destination
                ? `
                    <a
                        href="${safeAttribute(
                            destination
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="${safeAttribute(
                            destination
                        )}"
                        class="destination-link"
                    >
                        ${escapeHtml(
                            destination
                        )}
                    </a>
                `
                : `
                    <span class="destination-empty">
                        -
                    </span>
                `;

        return `
            <div
                class="link-card"
                data-link-id="${safeAttribute(
                    id
                )}"
            >

                <div class="link-top">

                    <div class="link-title-wrap">

                        <h3>
                            ${escapeHtml(
                                link?.title ||
                                "Sell Link"
                            )}
                        </h3>

                        <small>
                            Dibuat:
                            ${escapeHtml(
                                date
                            )}
                        </small>

                    </div>

                    <span
                        class="badge ${
                            status
                                ? "green"
                                : "red"
                        }"
                    >
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

                        ${formatRupiah(
                            price
                        )}

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

                    <small class="destination-wrapper">

                        <i class="fa-solid fa-link"></i>

                        ${destinationHtml}

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
                        title="Salin Link"
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
                            id
                        )}"
                    >
                        <i class="fa-solid fa-link"></i>
                        Link
                    </button>

                    <button
                        type="button"
                        data-action="edit"
                        data-id="${safeAttribute(
                            id
                        )}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>

                    <button
                        type="button"
                        data-action="toggle"
                        data-id="${safeAttribute(
                            id
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
                            id
                        )}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Hapus
                    </button>

                </div>

            </div>
        `;
    }

    /* =========================
       LIST EVENTS
    ========================= */

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

            try {
                switch (action) {
                    case "copy":
                        await copySell(
                            button.dataset.value
                        );
                        break;

                    case "generate":
                        generateLink(id);
                        break;

                    case "edit":
                        await editSell(id);
                        break;

                    case "toggle":
                        await toggleSellStatus(
                            id
                        );
                        break;

                    case "delete":
                        await deleteSell(id);
                        break;

                    default:
                        break;
                }

            } catch (error) {
                console.error(
                    "SELL ACTION ERROR:",
                    error
                );

                alert(
                    error?.message ||
                    "Terjadi kesalahan."
                );
            }
        }
    );

    /* =========================
       GENERATED LINK
    ========================= */

    function showGeneratedLinkDirect(
        title,
        shortCode,
        price,
        status = true
    ) {
        if (!generatedBox) {
            return;
        }

        const buyLink =
            getBuyUrl(shortCode);

        if (!buyLink) {
            return;
        }

        generatedBox.innerHTML = `
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

                    <span
                        class="badge ${
                            status
                                ? "green"
                                : "red"
                        }"
                    >

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

                        ${formatRupiah(
                            price
                        )}

                    </span>

                </div>

                <label>
                    Buy Link
                </label>

                <div class="copy-box">

                    <input
                        type="text"
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

        generatedBox.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* =========================
       GENERATE LINK
    ========================= */

    window.generateLink =
        function (id) {
            const link =
                findUserSellLink(id);

            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );

                return;
            }

            const shortCode =
                getShortCode(link);

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

                isLinkActive(link)
            );
        };

    /* =========================
       GENERATED COPY
    ========================= */

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
       COPY
    ========================= */

    async function copySell(text) {
        if (!text) {
            alert(
                "Link tidak tersedia."
            );

            return false;
        }

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

                input.style.left =
                    "-9999px";

                input.style.opacity =
                    "0";

                document.body.appendChild(
                    input
                );

                input.focus();
                input.select();

                const success =
                    document.execCommand(
                        "copy"
                    );

                input.remove();

                if (!success) {
                    throw new Error(
                        "Browser menolak proses copy."
                    );
                }
            }

            alert(
                "Link berhasil disalin."
            );

            return true;

        } catch (error) {
            console.error(
                "COPY ERROR:",
                error
            );

            alert(
                "Gagal menyalin link."
            );

            return false;
        }
    }

    window.copySell = copySell;

    /* =========================
       ACCESS
    ========================= */

    function checkAccess() {
        const button =
            $("createSellBtn");

        const status =
            $("sellStatus");

        if (!button || !status) {
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

            button.disabled = false;

            button.innerHTML = `
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

            button.disabled = true;

            button.innerHTML = `
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
       FIND LINK
    ========================= */

    function findUserSellLink(id) {
        if (!currentUser || !id) {
            return null;
        }

        return (
            sellLinks.find(
                (link) =>
                    String(
                        link?.id
                    ) ===
                    String(id)
            ) || null
        );
    }

    /* =========================
       EDIT
    ========================= */

    window.editSell =
        async function (id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );

                return;
            }

            const link =
                findUserSellLink(id);

            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );

                return;
            }

            /* =========================
               TITLE
            ========================= */

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

            /* =========================
               DESTINATION
            ========================= */

            const destination =
                prompt(
                    "Destination URL",
                    getDestination(link)
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
                    "URL tidak valid. Gunakan http:// atau https://"
                );

                return;
            }

            /* =========================
               PRICE
            ========================= */

            const priceText =
                prompt(
                    "Harga Sell Link",
                    String(
                        numberValue(
                            link.price
                        )
                    )
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
                const supabase =
                    ensureSupabase();

                const {
                    data,
                    error
                } = await supabase
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
                    )
                    .select()
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                /* =========================
                   LOCAL UPDATE
                ========================= */

                const index =
                    sellLinks.findIndex(
                        (item) =>
                            String(
                                item?.id
                            ) ===
                            String(id)
                    );

                if (index !== -1) {
                    sellLinks[index] = {
                        ...sellLinks[index],

                        ...(data || {}),

                        title:
                            cleanTitle,

                        destination:
                            cleanDestination,

                        destination_url:
                            cleanDestination,

                        price:
                            price
                    };
                }

                renderSellStats();
                applyFilter();

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
        async function (id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );

                return;
            }

            const link =
                findUserSellLink(id);

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
                const supabase =
                    ensureSupabase();

                const {
                    error
                } = await supabase
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

                link.status =
                    "inactive";

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
        async function (id) {
            if (!currentUser) {
                alert(
                    "User belum login."
                );

                return;
            }

            const link =
                findUserSellLink(id);

            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );

                return;
            }

            const currentStatus =
                isLinkActive(link);

            const newStatus =
                currentStatus
                    ? "inactive"
                    : "active";

            try {
                const supabase =
                    ensureSupabase();

                const {
                    error
                } = await supabase
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

    async function initSellLink() {
        try {
            const user =
                await loadUser();

            if (!user) {
                return;
            }

            /*
             * Load orders dan links
             * secara paralel.
             */
            await Promise.all([
                loadSellOrders(),
                loadSellLinks()
            ]);

            renderSellStats();
            applyFilter();

        } catch (error) {
            console.error(
                "SELL LINK INIT ERROR:",
                error
            );
        }
    }

    /* =========================
       START
    ========================= */

    initSellLink();
});
