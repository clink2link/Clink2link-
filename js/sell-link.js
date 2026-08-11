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
                throw new Error("Database belum siap.");
            }
            if (currentUser) {
                return currentUser;
            }
            const user = await database.getUser();
            if (!user) {
                currentUser = null;
                currentProfile = null;
                sellActive = false;
                checkAccess();
                return null;
            }
            currentUser = user;
            currentProfile =
                await database.getProfile(user.id);
            const sellUnlocked =
                user.sell_unlocked === true;
            const withdrawCount =
                Number(user.withdraw_count || 0);
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
                            link.link_type ||
                            link.type ||
                            ""
                        ).toLowerCase();
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
            const box =
                document.getElementById(
                    "sellList"
                );
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
        const number =
            Number(
                String(value)
                    .replace(/,/g, "")
                    .replace(/[^\d.-]/g, "")
            );
        return Number.isFinite(number)
            ? number
            : 0;
    }
    /* =========================
       ORDER HELPERS
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
    /*
     * Semua status yang dianggap
     * sebagai pembayaran berhasil.
     */
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
                order?.status || ""
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
       STATS
    ========================= */
    function renderSellStats() {
        const totalLink =
            document.getElementById(
                "sellTotalLink"
            );
        const totalPrice =
            document.getElementById(
                "sellTotalPrice"
            );
        const totalView =
            document.getElementById(
                "sellTotalView"
            );
        const totalSold =
            document.getElementById(
                "sellTotalSold"
            );
        const totalRevenue =
            document.getElementById(
                "sellTotalRevenue"
            );
        let totalSellPrice = 0;
        let totalRevenueValue = 0;
        let totalSoldValue = 0;
        let totalViewsValue = 0;
        for (const link of sellLinks) {
            totalSellPrice +=
                numberValue(
                    link.price
                );
            totalViewsValue +=
                numberValue(
                    link.total_views ??
                    link.views
                );
            const paidOrders =
                getPaidOrders(
                    link.id
                );
            /*
             * Jika sudah ada order berhasil,
             * jumlah terjual wajib berdasarkan
             * order tersebut.
             *
             * Fallback ke kolom sales/sold
             * hanya jika belum ada order.
             */
            const sold =
                paidOrders.length > 0
                    ? paidOrders.length
                    : numberValue(
                        link.sales ??
                        link.sold
                    );
            totalSoldValue += sold;
            for (
                const order of paidOrders
            ) {
                totalRevenueValue +=
                    numberValue(
                        order.seller_receive ??
                        order.price
                    );
            }
        }
        if (totalLink) {
            totalLink.textContent =
                sellLinks.length
                    .toLocaleString("id-ID");
        }
        if (totalPrice) {
            totalPrice.textContent =
                "Rp " +
                totalSellPrice
                    .toLocaleString("id-ID");
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
                "Rp " +
                totalRevenueValue
                    .toLocaleString("id-ID");
        }
    }
    /* =========================
       SEARCH & FILTER
    ========================= */
    const searchInput =
        document.getElementById(
            "searchInput"
        );
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
                        link.title || ""
                    ).toLowerCase();
                const destination =
                    String(
                        link.destination_url ||
                        link.destination ||
                        ""
                    ).toLowerCase();
                const shortCode =
                    String(
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
                        matchFilter =
                            String(
                                link.status ||
                                ""
                            ).toLowerCase() ===
                            "active";
                        break;
                    case "inactive":
                        matchFilter =
                            String(
                                link.status ||
                                ""
                            ).toLowerCase() !==
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
    filterButtons.forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                filterButtons.forEach(
                    button =>
                        button.classList.remove(
                            "active"
                        )
                );
                btn.classList.add(
                    "active"
                );
                currentFilter =
                    btn.dataset.filter ||
                    "all";
                applyFilter();
            }
        );
    });
    /* =========================
       GENERATE SHORT CODE
    ========================= */
    function generateCode(
        length = 8
    ) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let code = "";
        if (
            window.crypto?.getRandomValues
        ) {
            const bytes =
                new Uint8Array(
                    length
                );
            crypto.getRandomValues(
                bytes
            );
            bytes.forEach(byte => {
                code +=
                    chars[
                        byte %
                        chars.length
                    ];
            });
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
       CREATE SELL LINK
    ========================= */
    const createBtn =
        document.getElementById(
            "createSellBtn"
        );
    if (createBtn) {
        createBtn.onclick =
            async () => {
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
                const title =
                    document
                        .getElementById(
                            "sellTitle"
                        )
                        ?.value
                        .trim();
                const destination =
                    document
                        .getElementById(
                            "sellUrl"
                        )
                        ?.value
                        .trim();
                const price =
                    Math.floor(
                        numberValue(
                            document
                                .getElementById(
                                    "sellPrice"
                                )
                                ?.value
                        )
                    );
                if (
                    !title ||
                    !destination ||
                    price < 10000
                ) {
                    alert(
                        "Lengkapi data.\nHarga minimal Rp10.000."
                    );
                    return;
                }
                try {
                    const url =
                        new URL(
                            destination
                        );
                    if (
                        ![
                            "http:",
                            "https:"
                        ].includes(
                            url.protocol
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
                createBtn.disabled =
                    true;
                createBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Membuat Sell Link...
                `;
                try {
                    let short_code;
                    do {
                        short_code =
                            generateCode();
                    } while (
                        await database.getLinkByCode(
                            short_code
                        )
                    );
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
                    document
                        .getElementById(
                            "sellTitle"
                        )
                        .value = "";
                    document
                        .getElementById(
                            "sellUrl"
                        )
                        .value = "";
                    document
                        .getElementById(
                            "sellPrice"
                        )
                        .value = "";
                    await loadSellOrders();
                    await loadSellLinks();
                    if (newLink?.id) {
                        generateLink(
                            newLink.id
                        );
                    }
                    applyFilter();
                    const result =
                        document.getElementById(
                            "createResult"
                        );
                    if (result) {
                        result.innerHTML = `
                            <div class="success-box">
                                <i class="fa-solid fa-circle-check"></i>
                                Sell Link berhasil dibuat.
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error(
                        "CREATE SELL ERROR:",
                        err
                    );
                    alert(
                        err.message ||
                        "Gagal membuat Sell Link."
                    );
                } finally {
                    createBtn.disabled =
                        false;
                    checkAccess();
                }
            };
    }
    /* =========================
       RENDER SELL LINKS
    ========================= */
    function renderLinks() {
        const box =
            document.getElementById(
                "sellList"
            );
        if (!box) return;
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
                        link.short_code ||
                        link.shortcode ||
                        link.code ||
                        "";
                    const sellUrl =
                        `${location.origin}/b/${shortCode}`;
                    const status =
                        String(
                            link.status ||
                            ""
                        ).toLowerCase() ===
                        "active";
                    const paidOrders =
                        getPaidOrders(
                            link.id
                        );
                    /*
                     * INI BAGIAN PENTING:
                     * Terjual dihitung dari order
                     * yang benar-benar berhasil.
                     */
                    const sold =
                        paidOrders.length > 0
                            ? paidOrders.length
                            : numberValue(
                                link.sales ??
                                link.sold
                            );
                    /*
                     * Pendapatan seller.
                     */
                    const revenue =
                        paidOrders.reduce(
                            (
                                total,
                                order
                            ) => {
                                return (
                                    total +
                                    numberValue(
                                        order.seller_receive ??
                                        order.price
                                    )
                                );
                            },
                            0
                        );
                    const views =
                        numberValue(
                            link.total_views ??
                            link.views
                        );
                    const price =
                        numberValue(
                            link.price
                        );
                    const destination =
                        link.destination_url ||
                        link.destination ||
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
                                        ${date}
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
                                    Rp
                                    ${price.toLocaleString(
                                        "id-ID"
                                    )}
                                </span>
                                <span class="badge">
                                    <i class="fa-solid fa-cart-shopping"></i>
                                    ${sold}
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
                                    onclick="copySell('${escapeHtml(
                                        sellUrl
                                    )}')"
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
                                        Rp
                                        ${revenue.toLocaleString(
                                            "id-ID"
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
                                    onclick="generateLink('${escapeHtml(
                                        link.id
                                    )}')"
                                >
                                    <i class="fa-solid fa-link"></i>
                                    Link
                                </button>
                                <button
                                    type="button"
                                    onclick="editSell('${escapeHtml(
                                        link.id
                                    )}')"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onclick="toggleSellStatus('${escapeHtml(
                                        link.id
                                    )}')"
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
                                    onclick="deleteSell('${escapeHtml(
                                        link.id
                                    )}')"
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
       ESCAPE HTML
    ========================= */
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
    /* =========================
       GENERATE SELL LINK
    ========================= */
    window.generateLink =
        function(id) {
            const link =
                sellLinks.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(id)
                );
            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );
                return;
            }
            const box =
                document.getElementById(
                    "generatedBox"
                );
            if (!box) return;
            const shortCode =
                link.short_code ||
                link.shortcode ||
                link.code ||
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
                numberValue(
                    link.price
                );
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
                        <span class="badge green">
                            <i class="fa-solid fa-circle-check"></i>
                            Link Aktif
                        </span>
                        <span class="badge blue">
                            <i class="fa-solid fa-money-bill"></i>
                            Rp
                            ${price.toLocaleString(
                                "id-ID"
                            )}
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
                            onclick="copySell('${escapeHtml(
                                buyLink
                            )}')"
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
    window.copySell =
        async function(text) {
            try {
                if (
                    navigator.clipboard
                ) {
                    await navigator
                        .clipboard
                        .writeText(
                            text
                        );
                } else {
                    const input =
                        document.createElement(
                            "input"
                        );
                    input.value = text;
                    document.body.appendChild(
                        input
                    );
                    input.select();
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
            document.getElementById(
                "createSellBtn"
            );
        const status =
            document.getElementById(
                "sellStatus"
            );
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
            const link =
                sellLinks.find(
                    item =>
                        String(
                            item.id
                        ) ===
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
                    "Judul",
                    link.title || ""
                );
            if (title === null) {
                return;
            }
            const destination =
                prompt(
                    "Destination URL",
                    link.destination_url ||
                    link.destination ||
                    ""
                );
            if (
                destination === null
            ) {
                return;
            }
            try {
                const url =
                    new URL(
                        destination
                    );
                if (
                    ![
                        "http:",
                        "https:"
                    ].includes(
                        url.protocol
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
            const priceText =
                prompt(
                    "Harga",
                    link.price || 10000
                );
            if (
                priceText === null
            ) {
                return;
            }
            const price =
                numberValue(
                    priceText
                );
            if (
                price < 10000
            ) {
                alert(
                    "Minimal Rp10.000"
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
                            title,
                            destination,
                            destination_url:
                                destination,
                            price
                        })
                        .eq(
                            "id",
                            id
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
                    err.message ||
                    "Gagal memperbarui Sell Link."
                );
            }
        };
    /* =========================
       DELETE / HIDE
    ========================= */
    window.deleteSell =
        async function(id) {
            const link =
                sellLinks.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(id)
                );
            if (!link) {
                alert(
                    "Sell Link tidak ditemukan."
                );
                return;
            }
            if (
                !confirm(
                    `Sembunyikan Sell Link "${link.title}"?`
                )
            ) {
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
                        );
                if (error) {
                    throw error;
                }
                sellLinks =
                    sellLinks.filter(
                        item =>
                            String(
                                item.id
                            ) !==
                            String(id)
                    );
                filteredLinks =
                    filteredLinks.filter(
                        item =>
                            String(
                                item.id
                            ) !==
                            String(id)
                    );
                renderSellStats();
                renderLinks();
                alert(
                    "Sell Link berhasil disembunyikan."
                );
            } catch (err) {
                console.error(
                    "DELETE SELL ERROR:",
                    err
                );
                alert(
                    err.message ||
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
                        String(
                            item.id
                        ) ===
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
                    link.status ||
                    ""
                ).toLowerCase();
            const newStatus =
                currentStatus ===
                "active"
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
            const user =
                await loadUser();
            if (!user) {
                return;
            }
            /*
             * PENTING:
             * Order dimuat terlebih dahulu
             * sebelum render sell link.
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
