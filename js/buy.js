document.addEventListener("DOMContentLoaded", async () => {
    const buyBox = document.getElementById("buyBox");
    if (!buyBox) return;
    const DEBUG = false;
    let debugBox = null;
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
                text += "\n" + JSON.stringify(data, null, 2);
            } catch {
                text += "\n" + String(data);
            }
        }
        debugBox.innerHTML += text + "\n\n";
        debugBox.scrollTop = debugBox.scrollHeight;
    }
    window.onerror = function (msg, url, line, col, error) {
        log("JS ERROR", {
            msg,
            url,
            line,
            col,
            stack: error?.stack
        });
    };
    window.onunhandledrejection = function (e) {
        log("PROMISE ERROR", e.reason);
    };
    log("BUY PAGE LOADED");
    const code =
        window.BUY_CODE ||
        location.pathname.split("/").filter(Boolean).pop();
    log("BUY CODE", code);
    if (!code || code === "b" || code === "buy") {
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <h3>Link tidak valid</h3>
            </div>
        `;
        return;
    }
    try {
        // =========================
        // GET LINK
        // =========================
        log("GET LINK...");
        const link = await database.getLinkByCode(code);
        log("LINK RESULT", link);
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
        const title = escapeHtml(
            link.title || "Sell Link"
        );
        const price = Number(link.price || 0);
        const sellerId =
            link.user_id ||
            link.seller_id ||
            link.owner_id;
        log("LINK INFO", {
            id: link.id,
            title,
            price,
            seller_id: sellerId
        });
        if (!sellerId) {
            throw new Error("Seller tidak ditemukan");
        }
        if (price < 1000) {
            throw new Error("Harga link tidak valid");
        }
        // =========================
        // PRODUCT
        // =========================
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
                <button class="buy-btn" id="payBtn">
                    <i class="fa-solid fa-bolt"></i>
                    Bayar Sekarang
                </button>
            </div>
        `;
        const payBtn =
            document.getElementById("payBtn");
        // =========================
        // CREATE PAYMENT
        // =========================
        payBtn.onclick = async () => {
            log("BUTTON BAYAR DIKLIK");
            payBtn.disabled = true;
            payBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Membuat Pembayaran...
            `;
            try {
                // =========================
                // CREATE SELL ORDER
                // VIA CLOUDFLARE FUNCTION
                // =========================
                log("CREATE SELL ORDER", {
                    link_id: link.id,
                    seller_id: sellerId
                });
                const orderResponse = await fetch(
                    "/api/create-sell-order",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
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
                    order = JSON.parse(orderText);
                } catch {
                    throw new Error(
                        "Response create order bukan JSON: " +
                        orderText
                    );
                }
                log("CREATE ORDER RESPONSE", order);
                if (!orderResponse.ok || !order.success) {
                    throw new Error(
                        order.error ||
                        "Gagal membuat order"
                    );
                }
                const orderData =
                    order.data || order;
                if (!orderData.id) {
                    throw new Error(
                        "Order ID tidak ditemukan"
                    );
                }
                const orderId =
                    orderData.id;
                log("ORDER ID", orderId);
                // =========================
                // CREATE DOMPETX PAYMENT
                // =========================
                log("CREATE PAYMENT", {
                    order_id: orderId
                });
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
                        JSON.parse(paymentText);
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
                    payment.data || payment;
                const paymentId =
                    paymentData.payment_id ||
                    paymentData.id;
                const invoiceId =
                    paymentData.invoice_id ||
                    paymentData.reference;
                const paymentUrl =
                    paymentData.payment_url;
                const expires =
                    paymentData.expires_at ||
                    paymentData.expiresAt;
                log("PAYMENT DATA", {
                    paymentId,
                    invoiceId,
                    paymentUrl,
                    expires
                });
                if (!invoiceId) {
                    throw new Error(
                        "Reference pembayaran tidak ditemukan"
                    );
                }
                if (!paymentUrl) {
                    throw new Error(
                        "Payment URL tidak ditemukan"
                    );
                }
                if (!expires) {
                    throw new Error(
                        "Waktu pembayaran tidak ditemukan"
                    );
                }
                // =========================
                // SHOW CHECKOUT
                // =========================
                buyBox.innerHTML = `
                    <div class="buy-product-card">
                        <div class="buy-product-title">
                            <i class="fa-solid fa-credit-card"></i>
                            Pembayaran
                        </div>
                        <div class="buy-price">
                            Rp ${price.toLocaleString("id-ID")}
                        </div>
                        <div class="buy-countdown" id="countdown">
                            Memuat waktu...
                        </div>
                        <div class="buy-status buy-pending">
                            <i class="fa-solid fa-clock"></i>
                            Menunggu Pembayaran
                        </div>
                        <a
                            href="${escapeHtml(paymentUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="buy-btn"
                            style="display:block;text-align:center;text-decoration:none;"
                        >
                            <i class="fa-solid fa-qrcode"></i>
                            Buka Pembayaran
                        </a>
                        <button
                            class="buy-btn"
                            id="checkPayment"
                            style="background:#10b981;margin-top:15px;"
                        >
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        </button>
                        <button
                            class="buy-btn"
                            id="cancelPayment"
                            style="background:#ef4444;margin-top:15px;"
                        >
                            <i class="fa-solid fa-xmark"></i>
                            Batalkan Pembayaran
                        </button>
                    </div>
                `;
                const countdown =
                    document.getElementById(
                        "countdown"
                    );
                const paymentStatus =
                    buyBox.querySelector(
                        ".buy-status"
                    );
                const expireTime =
                    new Date(expires).getTime();
                let timer;
                // =========================
                // COUNTDOWN
                // =========================
                const updateCountdown = () => {
                    const diff =
                        expireTime - Date.now();
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
                            (diff % 60000) / 1000
                        );
                    countdown.innerHTML = `
                        <i class="fa-solid fa-stopwatch"></i>
                        ${minutes}:${String(seconds).padStart(2, "0")}
                    `;
                };
                updateCountdown();
                timer = setInterval(
                    updateCountdown,
                    1000
                );
                // =========================
                // CHECK PAYMENT
                // =========================
                document
                    .getElementById("checkPayment")
                    .onclick = async () => {
                    const btn =
                        document.getElementById(
                            "checkPayment"
                        );
                    btn.disabled = true;
                    btn.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Mengecek...
                    `;
                    try {
                        log(
                            "CHECK PAYMENT",
                            {
                                invoice_id:
                                    invoiceId
                            }
                        );
                        const response =
                            await fetch(
                                `/api/check-payment?invoice_id=${encodeURIComponent(invoiceId)}`
                            );
                        const text =
                            await response.text();
                        let data;
                        try {
                            data =
                                JSON.parse(text);
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
                            data.data || data;
                        if (
                            String(
                                result.status
                            ).toLowerCase() ===
                            "paid"
                        ) {
                            clearInterval(timer);
                            paymentStatus.className =
                                "buy-status buy-success";
                            paymentStatus.innerHTML = `
                                <i class="fa-solid fa-circle-check"></i>
                                Pembayaran Berhasil
                            `;
                            btn.style.display =
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
                            setTimeout(() => {
                                if (
                                    result.destination_url
                                ) {
                                    location.href =
                                        result.destination_url;
                                } else {
                                    alert(
                                        "Link tujuan tidak ditemukan"
                                    );
                                }
                            }, 1000);
                            return;
                        }
                        if (
                            String(
                                result.status
                            ).toLowerCase() ===
                            "expired"
                        ) {
                            clearInterval(timer);
                            paymentStatus.className =
                                "buy-status buy-failed";
                            paymentStatus.innerHTML = `
                                <i class="fa-solid fa-circle-xmark"></i>
                                Pembayaran Expired
                            `;
                            btn.style.display =
                                "none";
                            return;
                        }
                        paymentStatus.className =
                            "buy-status buy-pending";
                        paymentStatus.innerHTML = `
                            <i class="fa-solid fa-clock"></i>
                            Belum Dibayar
                        `;
                        btn.disabled = false;
                        btn.innerHTML = `
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        `;
                    } catch (err) {
                        log(
                            "CHECK PAYMENT ERROR",
                            err
                        );
                        alert(err.message);
                        btn.disabled = false;
                        btn.innerHTML = `
                            <i class="fa-solid fa-rotate"></i>
                            Cek Pembayaran
                        `;
                    }
                };
                // =========================
                // CANCEL
                // =========================
                document
                    .getElementById("cancelPayment")
                    .onclick = () => {
                    clearInterval(timer);
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
            } catch (err) {
                log(
                    "PAYMENT FLOW ERROR",
                    {
                        message: err.message,
                        stack: err.stack
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
                                err.message
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
    } catch (err) {
        log(
            "BUY PAGE ERROR",
            {
                message: err.message,
                stack: err.stack
            }
        );
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <h3>
                    Terjadi Kesalahan
                </h3>
                <p>
                    ${escapeHtml(
                        err.message
                    )}
                </p>
            </div>
        `;
    }
});
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
