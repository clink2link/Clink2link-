document.addEventListener("DOMContentLoaded", async () => {
    const buyBox = document.getElementById("buyBox");
    if (!buyBox) return;
    const DEBUG = false;
    let debugBox = null;
    // =========================================================
    // DEBUG
    // =========================================================
    if (DEBUG) {
        debugBox = document.createElement("div");
        debugBox.id = "buyDebug";
        debugBox.style = `
            position:fixed;
            left:10px;
            right:10px;
            bottom:10px;
            max-height:45vh;
            overflow:auto;
            background:#000;
            color:#00ff00;
            font-size:12px;
            font-family:monospace;
            padding:10px;
            z-index:999999;
            border-radius:10px;
            white-space:pre-wrap;
        `;
        document.body.appendChild(debugBox);
    }
    function log(title, data = null) {
        console.log(title, data);
        if (!debugBox) return;
        let text = title;
        if (data !== null) {
            try {
                text += "\n" +
                    JSON.stringify(
                        data,
                        null,
                        2
                    );
            } catch {
                text += "\n" +
                    String(data);
            }
        }
        debugBox.innerHTML +=
            text + "\n\n";
        debugBox.scrollTop =
            debugBox.scrollHeight;
    }
    window.onerror = function (
        msg,
        url,
        line,
        col,
        error
    ) {
        log("JS ERROR", {
            msg,
            url,
            line,
            col,
            stack: error?.stack
        });
    };
    window.onunhandledrejection =
        function (event) {
            log(
                "PROMISE ERROR",
                event.reason
            );
        };
    // =========================================================
    // GET CODE
    // =========================================================
    const code =
        window.BUY_CODE ||
        location.pathname
            .split("/")
            .filter(Boolean)
            .pop();
    log("BUY CODE", code);
    if (
        !code ||
        code === "b" ||
        code === "buy"
    ) {
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <h3>Link tidak valid</h3>
            </div>
        `;
        return;
    }
    try {
        // =====================================================
        // GET LINK
        // =====================================================
        log("GET LINK");
        const link =
            await database.getLinkByCode(code);
        log(
            "LINK RESULT",
            link
        );
        if (!link) {
            buyBox.innerHTML = `
                <div class="buy-product-card">
                    <h3>Link tidak ditemukan</h3>
                </div>
            `;
            return;
        }
        if (
            link.link_type !== "sell" &&
            link.type !== "sell"
        ) {
            buyBox.innerHTML = `
                <div class="buy-product-card">
                    <h3>Bukan Sell Link</h3>
                </div>
            `;
            return;
        }
        const title =
            escapeHtml(
                link.title ||
                "Sell Link"
            );
        const price =
            Number(
                link.price || 0
            );
        const sellerId =
            link.user_id ||
            link.seller_id ||
            link.owner_id;
        if (!sellerId) {
            throw new Error(
                "Seller tidak ditemukan"
            );
        }
        if (
            !Number.isFinite(price) ||
            price < 1000
        ) {
            throw new Error(
                "Harga link tidak valid"
            );
        }
        // =====================================================
        // PRODUCT UI
        // =====================================================
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <div class="buy-product-title">
                    <i class="fa-solid fa-link"></i>
                    ${title}
                </div>
                <div class="buy-price">
                    Rp ${price.toLocaleString("id-ID")}
                </div>
                <div class="buy-info-row">
                    <span class="buy-badge">
                        <i class="fa-solid fa-cart-shopping"></i>
                        Terjual ${Number(link.sold || 0)}x
                    </span>
                    <span class="buy-badge">
                        <i class="fa-solid fa-eye"></i>
                        ${Number(link.views || 0)} View
                    </span>
                </div>
                <button
                    class="buy-btn"
                    id="payBtn"
                >
                    <i class="fa-solid fa-bolt"></i>
                    Bayar Sekarang
                </button>
            </div>
        `;
        const payBtn =
            document.getElementById(
                "payBtn"
            );
        // =====================================================
        // PAYMENT
        // =====================================================
        payBtn.onclick = async () => {
            payBtn.disabled = true;
            payBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Membuat Pembayaran...
            `;
            try {
                // =================================================
                // CREATE SELL ORDER
                // =================================================
                log(
                    "CREATE SELL ORDER",
                    {
                        link_id: link.id,
                        seller_id: sellerId
                    }
                );
                const orderResponse =
                    await fetch(
                        "/api/create-sell-order",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                link_id: link.id,
                                seller_id: sellerId,
                                buyer_id: null
                            })
                        }
                    );
                const orderText =
                    await orderResponse.text();
                let order;
                try {
                    order =
                        JSON.parse(
                            orderText
                        );
                } catch {
                    throw new Error(
                        "Response create order bukan JSON: " +
                        orderText
                    );
                }
                log(
                    "CREATE ORDER RESPONSE",
                    order
                );
                if (
                    !orderResponse.ok ||
                    !order.success
                ) {
                    throw new Error(
                        order.error ||
                        "Gagal membuat order"
                    );
                }
                const orderData =
                    order.data ||
                    order;
                const orderId =
                    orderData.id ||
                    orderData.order_id;
                if (!orderId) {
                    throw new Error(
                        "Order ID tidak ditemukan"
                    );
                }
                // =================================================
                // CREATE DOMPETX PAYMENT
                // =================================================
                log(
                    "CREATE DOMPETX PAYMENT",
                    {
                        order_id: orderId
                    }
                );
                const paymentResponse =
                    await fetch(
                        "/api/create-payment",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                order_id: orderId
                            })
                        }
                    );
                const paymentText =
                    await paymentResponse.text();
                let payment;
                try {
                    payment =
                        JSON.parse(
                            paymentText
                        );
                } catch {
                    throw new Error(
                        "Response payment bukan JSON: " +
                        paymentText
                    );
                }
                log(
                    "CREATE PAYMENT RESPONSE",
                    payment
                );
                if (
                    !paymentResponse.ok ||
                    !payment.success
                ) {
                    throw new Error(
                        payment.error ||
                        "Gagal membuat pembayaran"
                    );
                }
                const paymentData =
                    payment.data ||
                    payment;
                // =================================================
                // DOMPETX DATA
                // =================================================
                const paymentId =
                    paymentData.payment_id ||
                    paymentData.id ||
                    null;
                const invoiceId =
                    paymentData.invoice_id ||
                    paymentData.reference ||
                    null;
                const paymentUrl =
                    paymentData.payment_url ||
                    null;
                let qrImageUrl =
                    paymentData.qris_image_url ||
                    paymentData.qr_image_url ||
                    paymentData.qris_url ||
                    null;
                const expires =
                    paymentData.expires_at ||
                    paymentData.expiresAt ||
                    null;
                // =================================================
                // FALLBACK QR
                // =================================================
                if (
                    !qrImageUrl &&
                    paymentId
                ) {
                    const baseUrl =
                        paymentData.base_url ||
                        null;
                    if (baseUrl) {
                        qrImageUrl =
                            `${baseUrl.replace(/\/+$/, "")}/v1/qr/${encodeURIComponent(paymentId)}`;
                    }
                }
                log(
                    "DOMPETX PAYMENT DATA",
                    {
                        paymentId,
                        invoiceId,
                        paymentUrl,
                        qrImageUrl,
                        expires
                    }
                );
                if (!paymentId) {
                    throw new Error(
                        "Payment ID tidak ditemukan"
                    );
                }
                if (!invoiceId) {
                    throw new Error(
                        "Reference pembayaran tidak ditemukan"
                    );
                }
                if (!qrImageUrl) {
                    throw new Error(
                        "QRIS URL tidak ditemukan"
                    );
                }
                if (!expires) {
                    throw new Error(
                        "Waktu expired pembayaran tidak ditemukan"
                    );
                }
                // =================================================
                // PAYMENT UI
                // =================================================
                buyBox.innerHTML = `
                    <div class="buy-product-card">
                        <div class="buy-product-title">
                            <i class="fa-solid fa-qrcode"></i>
                            Pembayaran
                        </div>
                        <div class="buy-price">
                            Rp ${price.toLocaleString("id-ID")}
                        </div>
                        <div
                            class="buy-countdown"
                            id="countdown"
                        >
                            Memuat waktu...
                        </div>
                        <div
                            class="buy-qr-box"
                            style="
                                width:100%;
                                display:flex;
                                justify-content:center;
                                align-items:center;
                                margin:20px 0;
                            "
                        >
                            <img
                                id="qrisImage"
                                src="${escapeHtml(qrImageUrl)}"
                                alt="QRIS Payment"
                                style="
                                    width:250px;
                                    height:250px;
                                    object-fit:contain;
                                    border-radius:12px;
                                    background:#fff;
                                    padding:10px;
                                    display:block;
                                "
                            >
                        </div>
                        <div
                            class="buy-status buy-pending"
                            id="paymentStatus"
                        >
                            <i class="fa-solid fa-clock"></i>
                            Menunggu Pembayaran
                        </div>
                        ${
                            paymentUrl
                                ? `
                                <a
                                    href="${escapeHtml(paymentUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="buy-btn"
                                    style="
                                        display:block;
                                        text-align:center;
                                        text-decoration:none;
                                        margin-top:15px;
                                    "
                                >
                                    <i class="fa-solid fa-up-right-from-square"></i>
                                    Buka Halaman Pembayaran
                                </a>
                                `
                                : ""
                        }
                        <button
                            class="buy-btn"
                            id="checkPayment"
                            style="
                                background:#10b981;
                                margin-top:15px;
                            "
                        >
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        </button>
                        <button
                            class="buy-btn"
                            id="cancelPayment"
                            style="
                                background:#ef4444;
                                margin-top:15px;
                            "
                        >
                            <i class="fa-solid fa-xmark"></i>
                            Batalkan Pembayaran
                        </button>
                    </div>
                `;
                // =================================================
                // QR ERROR
                // =================================================
                const qrisImage =
                    document.getElementById(
                        "qrisImage"
                    );
                qrisImage.onerror = () => {
                    log(
                        "QR IMAGE ERROR",
                        qrImageUrl
                    );
                    qrisImage.outerHTML = `
                        <div
                            style="
                                text-align:center;
                                padding:30px;
                            "
                        >
                            <i
                                class="fa-solid fa-triangle-exclamation"
                                style="font-size:35px;"
                            ></i>
                            <p>
                                QRIS gagal dimuat.
                            </p>
                            <a
                                href="${escapeHtml(qrImageUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="buy-btn"
                            >
                                Buka QRIS
                            </a>
                        </div>
                    `;
                };
                // =================================================
                // COUNTDOWN
                // =================================================
                const countdown =
                    document.getElementById(
                        "countdown"
                    );
                const paymentStatus =
                    document.getElementById(
                        "paymentStatus"
                    );
                const expireTime =
                    new Date(
                        expires
                    ).getTime();
                if (
                    !Number.isFinite(
                        expireTime
                    )
                ) {
                    throw new Error(
                        "Format expired tidak valid"
                    );
                }
                let timer;
                const updateCountdown = () => {
                    const diff =
                        expireTime -
                        Date.now();
                    if (diff <= 0) {
                        clearInterval(timer);
                        countdown.innerHTML = `
                            <i class="fa-solid fa-hourglass-end"></i>
                            00:00
                        `;
                        paymentStatus.className =
                            "buy-status buy-failed";
                        paymentStatus.innerHTML = `
                            <i class="fa-solid fa-circle-xmark"></i>
                            Pembayaran Expired
                        `;
                        return;
                    }
                    const minutes =
                        Math.floor(
                            diff / 60000
                        );
                    const seconds =
                        Math.floor(
                            (diff % 60000) /
                            1000
                        );
                    countdown.innerHTML = `
                        <i class="fa-solid fa-stopwatch"></i>
                        ${minutes}:${String(seconds).padStart(2, "0")}
                    `;
                };
                updateCountdown();
                timer =
                    setInterval(
                        updateCountdown,
                        1000
                    );
                // =================================================
                // CHECK PAYMENT
                // =================================================
                const checkBtn =
                    document.getElementById(
                        "checkPayment"
                    );
                checkBtn.onclick =
                    async () => {
                    checkBtn.disabled =
                        true;
                    checkBtn.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Mengecek...
                    `;
                    try {
                        log(
                            "CHECK DOMPETX PAYMENT",
                            {
                                payment_id:
                                    paymentId,
                                invoice_id:
                                    invoiceId,
                                order_id:
                                    orderId
                            }
                        );
                        /*
                         * KIRIM PAYMENT ID + INVOICE
                         *
                         * Backend harus menggunakan
                         * payment_id untuk mencari
                         * pembayaran DompetX.
                         */
                        const query =
                            new URLSearchParams({
                                payment_id:
                                    paymentId,
                                invoice_id:
                                    invoiceId,
                                order_id:
                                    orderId
                            });
                        const response =
                            await fetch(
                                `/api/check-payment?${query.toString()}`,
                                {
                                    method:
                                        "GET",
                                    cache:
                                        "no-store"
                                }
                            );
                        const text =
                            await response.text();
                        let data;
                        try {
                            data =
                                JSON.parse(
                                    text
                                );
                            } catch {
                            throw new Error(
                                "Response check payment bukan JSON: " +
                                text
                            );
                        }
                        log(
                            "CHECK PAYMENT RESPONSE",
                            data
                        );
                        if (
                            !response.ok ||
                            !data.success
                        ) {
                            throw new Error(
                                data.error ||
                                "Gagal mengecek pembayaran"
                            );
                        }
                        const result =
                            data.data ||
                            data;
                        const status =
                            String(
                                result.status ||
                                ""
                            )
                                .trim()
                                .toLowerCase();
                        // =================================================
                        // PAID
                        // =================================================
                        if (
                            status === "paid" ||
                            status === "success" ||
                            status === "completed" ||
                            status === "settlement" ||
                            status === "berhasil"
                        ) {
                            clearInterval(
                                timer
                            );
                            paymentStatus.className =
                                "buy-status buy-success";
                            paymentStatus.innerHTML = `
                                <i class="fa-solid fa-circle-check"></i>
                                Pembayaran Berhasil
                            `;
                            checkBtn.style.display =
                                "none";
                            const cancelBtn =
                                document.getElementById(
                                    "cancelPayment"
                                );
                            if (cancelBtn) {
                                cancelBtn.style.display =
                                    "none";
                            }
                            log(
                                "PAYMENT SUCCESS",
                                result
                            );
                            // =================================================
                            // REDIRECT
                            // =================================================
                            const destination =
                                result.destination_url ||
                                result.destination ||
                                null;
                            setTimeout(() => {
                                if (destination) {
                                    location.href =
                                        destination;
                                } else {
                                    alert(
                                        "Pembayaran berhasil, tetapi link tujuan tidak ditemukan."
                                    );
                                }
                            }, 800);
                            return;
                        }
                        // =================================================
                        // EXPIRED
                        // =================================================
                        if (
                            status === "expired" ||
                            status === "cancelled" ||
                            status === "canceled"
                        ) {
                            clearInterval(
                                timer
                            );
                            paymentStatus.className =
                                "buy-status buy-failed";
                            paymentStatus.innerHTML = `
                                <i class="fa-solid fa-circle-xmark"></i>
                                Pembayaran Expired
                            `;
                            checkBtn.style.display =
                                "none";
                            return;
                        }
                        // =================================================
                        // PENDING
                        // =================================================
                        paymentStatus.className =
                            "buy-status buy-pending";
                        paymentStatus.innerHTML = `
                            <i class="fa-solid fa-clock"></i>
                            Belum Dibayar
                        `;
                        checkBtn.disabled =
                            false;
                        checkBtn.innerHTML = `
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        `;
                    } catch (error) {
                        log(
                            "CHECK PAYMENT ERROR",
                            {
                                message:
                                    error.message,
                                stack:
                                    error.stack
                            }
                        );
                        alert(
                            error.message
                        );
                        checkBtn.disabled =
                            false;
                        checkBtn.innerHTML = `
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        `;
                    }
                };
                // =================================================
                // CANCEL
                // =================================================
                const cancelBtn =
                    document.getElementById(
                        "cancelPayment"
                    );
                cancelBtn.onclick = () => {
                    clearInterval(
                        timer
                    );
                    buyBox.innerHTML = `
                        <div class="buy-product-card">
                            <h3>
                                <i class="fa-solid fa-ban"></i>
                                Pembayaran Dibatalkan
                            </h3>
                            <p>
                                Silakan buat pembayaran baru.
                            </p>
                            <button
                                class="buy-btn"
                                onclick="location.reload()"
                            >
                                Buat Pembayaran Baru
                            </button>
                        </div>
                    `;
                };
            } catch (error) {
                log(
                    "PAYMENT FLOW ERROR",
                    {
                        message:
                            error.message,
                        stack:
                            error.stack
                    }
                );
                buyBox.innerHTML = `
                    <div class="buy-product-card">
                        <h3>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Pembayaran Gagal
                        </h3>
                        <p>
                            ${escapeHtml(
                                error.message
                            )}
                        </p>
                        <button
                            class="buy-btn"
                            onclick="location.reload()"
                        >
                            Coba Lagi
                        </button>
                    </div>
                `;
            }
        };
    } catch (error) {
        log(
            "BUY PAGE ERROR",
            {
                message:
                    error.message,
                stack:
                    error.stack
            }
        );
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <h3>
                    Terjadi Kesalahan
                </h3>
                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>
            </div>
        `;
    }
});
// =========================================================
// ESCAPE HTML
// =========================================================
function escapeHtml(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}
