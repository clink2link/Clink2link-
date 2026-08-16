document.addEventListener("DOMContentLoaded", async () => {
    const buyBox = document.getElementById("buyBox");
    if (!buyBox) return;
    let countdownTimer = null;
    // =========================================================
    // GET SELL CODE
    // =========================================================
    const code =
        window.BUY_CODE ||
        location.pathname
            .split("/")
            .filter(Boolean)
            .pop();
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
    // =========================================================
    // MAIN
    // =========================================================
    try {
        // =====================================================
        // GET LINK
        // =====================================================
        if (
            !window.database ||
            typeof database.getLinkByCode !== "function"
        ) {
            throw new Error(
                "Database belum siap atau getLinkByCode tidak tersedia"
            );
        }
        const link =
            await database.getLinkByCode(code);
        if (!link) {
            buyBox.innerHTML = `
                <div class="buy-product-card">
                    <h3>Link tidak ditemukan</h3>
                </div>
            `;
            return;
        }
        // =====================================================
        // CHECK SELL LINK
        // =====================================================
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
        // =====================================================
        // PRODUCT DATA
        // =====================================================
        const title =
            escapeHtml(
                link.title || "Sell Link"
            );
        const price =
            Number(
                link.price || 0
            );
        let displayPrice = price;
        let premiumBuyer = false;
        try {
            const current = await window.database.getUser();
            premiumBuyer = !!current?.is_premium &&
                (!current.premium_expires_at || new Date(current.premium_expires_at).getTime() > Date.now());
            if (premiumBuyer) displayPrice = Math.max(1000, Math.floor(price * 0.5));
        } catch (_) {}
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
                    ${premiumBuyer ? `<del style="opacity:.5;font-size:14px">Rp ${price.toLocaleString("id-ID")}</del><br>` : ""}
                    Rp ${displayPrice.toLocaleString("id-ID")}
                </div>
                ${premiumBuyer ? `<div class="buy-badge">Premium · 50% discount</div>` : ""}
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
                    type="button"
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
        if (!payBtn) {
            throw new Error(
                "Tombol pembayaran tidak ditemukan"
            );
        }
        // =====================================================
        // CREATE PAYMENT
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
                const buyer = await window.database.getUser().catch(() => null);
                const sessionResult = await window.database.supabase.auth.getSession();
                const accessToken = sessionResult?.data?.session?.access_token || "";
                const orderHeaders = {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                };
                if (accessToken) orderHeaders.Authorization = `Bearer ${accessToken}`;
                const orderResponse =
                    await fetch(
                        "/api/create-sell-order",
                        {
                            method: "POST",
                            headers: orderHeaders,
                            body: JSON.stringify({
                                link_id: link.id,
                                seller_id: sellerId,
                                buyer_id: buyer?.id || null
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
                        orderText.substring(
                            0,
                            500
                        )
                    );
                }
                if (
                    !orderResponse.ok ||
                    !order?.success
                ) {
                    throw new Error(
                        order?.error ||
                        order?.message ||
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
                const paymentResponse =
                    await fetch(
                        "/api/payment/create",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "Accept":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                order_id:
                                    orderId
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
                        "Response DompetX bukan JSON: " +
                        paymentText.substring(
                            0,
                            500
                        )
                    );
                }
                if (
                    !paymentResponse.ok ||
                    !payment?.success
                ) {
                    throw new Error(
                        payment?.error ||
                        payment?.message ||
                        "Gagal membuat pembayaran DompetX"
                    );
                }
                // =================================================
                // NORMALIZE PAYMENT
                // =================================================
                const paymentData =
                    payment.data ||
                    payment;
                const paymentId =
                    paymentData.payment_id ||
                    paymentData.paymentId ||
                    paymentData.id ||
                    null;
                const reference =
                    paymentData.reference ||
                    paymentData.invoice_id ||
                    paymentData.invoiceId ||
                    payment?.reference ||
                    null;
                let qrImageUrl =
                    paymentData.qrImage ||
                    paymentData.qr_image_url ||
                    paymentData.qr_image ||
                    paymentData.qris_image ||
                    paymentData.qrisImage ||
                    paymentData?.qrData?.qrImage ||
                    paymentData?.qr_data?.qrImage ||
                    paymentData?.qr_data?.qr_image ||
                    null;
                // =================================================
                // FALLBACK QR
                // =================================================
                if (
                    !qrImageUrl &&
                    paymentId
                ) {
                    qrImageUrl =
                        `https://api.dompetx.com/v1/qr/${encodeURIComponent(
                            paymentId
                        )}`;
                }
                // =================================================
                // EXPIRED
                // =================================================
                let expires =
                    paymentData.expiresAt ||
                    paymentData.expires_at ||
                    paymentData.expiredAt ||
                    paymentData.expired_at ||
                    null;
                if (!expires) {
                    expires =
                        new Date(
                            Date.now() +
                            15 * 60 * 1000
                        ).toISOString();
                }
                if (!paymentId) {
                    throw new Error(
                        "Payment ID DompetX tidak ditemukan"
                    );
                }
                if (!qrImageUrl) {
                    throw new Error(
                        "QRIS image tidak ditemukan"
                    );
                }
                // =================================================
                // PAYMENT UI
                // =================================================
                buyBox.innerHTML = `
                    <div class="buy-product-card">
                        <div class="buy-product-title">
                            <i class="fa-solid fa-qrcode"></i>
                            Pembayaran QRIS
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
                        <button
                            class="buy-btn"
                            id="checkPayment"
                            type="button"
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
                            type="button"
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
                // QR IMAGE ERROR
                // =================================================
                const qrisImage =
                    document.getElementById(
                        "qrisImage"
                    );
                if (qrisImage) {
                    qrisImage.onerror = () => {
                        qrisImage.outerHTML = `
                            <div
                                style="
                                    text-align:center;
                                    padding:30px;
                                "
                            >
                                <i
                                    class="fa-solid fa-triangle-exclamation"
                                    style="
                                        font-size:35px;
                                    "
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
                }
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
                        "Format expired pembayaran tidak valid"
                    );
                }
                const updateCountdown = () => {
                    const diff =
                        expireTime -
                        Date.now();
                    if (diff <= 0) {
                        clearInterval(
                            countdownTimer
                        );
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
                        const checkBtn =
                            document.getElementById(
                                "checkPayment"
                            );
                        if (checkBtn) {
                            checkBtn.style.display =
                                "none";
                        }
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
                        ${minutes}:${String(
                            seconds
                        ).padStart(
                            2,
                            "0"
                        )}
                    `;
                };
                updateCountdown();
                countdownTimer =
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
                checkBtn.onclick = async () => {
                    checkBtn.disabled =
                        true;
                    checkBtn.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Mengecek Pembayaran...
                    `;
                    try {
                        const query =
                            new URLSearchParams({
                                order_id:
                                    String(
                                        orderId
                                    )
                            });
                        const response =
                            await fetch(
                                `/api/payment/status?${query.toString()}`,
                                {
                                    method:
                                        "GET",
                                    cache:
                                        "no-store",
                                    headers: {
                                        "Accept":
                                            "application/json"
                                    }
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
                                "Response /api/payment/status bukan JSON: " +
                                text.substring(
                                    0,
                                    1000
                                )
                            );
                        }
                        if (!response.ok) {
                            throw new Error(
                                data?.error ||
                                data?.message ||
                                `HTTP ${response.status}`
                            );
                        }
                        if (
                            data?.success === false
                        ) {
                            throw new Error(
                                data?.error ||
                                data?.message ||
                                "Gagal mengecek pembayaran"
                            );
                        }
                        // =================================================
                        // NORMALIZE RESULT
                        // =================================================
                        const result =
                            data?.data ||
                            data?.payment ||
                            data?.result ||
                            data;
                        // =================================================
                        // NORMALIZE STATUS
                        // =================================================
                        let status =
                            result?.status ||
                            result?.payment_status ||
                            result?.paymentStatus ||
                            result?.transaction_status ||
                            result?.transactionStatus ||
                            result?.state ||
                            data?.status ||
                            data?.payment_status ||
                            "";
                        status =
                            String(
                                status
                            )
                                .trim()
                                .toLowerCase();
                        // =================================================
                        // SUCCESS
                        // =================================================
                        const successStatuses = [
                            "paid",
                            "success",
                            "successful",
                            "completed",
                            "complete",
                            "settlement",
                            "settled",
                            "berhasil"
                        ];
                        if (
                            successStatuses.includes(
                                status
                            )
                        ) {
                            clearInterval(
                                countdownTimer
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
                            // =================================================
                            // DESTINATION
                            // =================================================
                            const destination =
                                result?.redirect_url ||
                                result?.destination_url ||
                                result?.destination ||
                                data?.redirect_url ||
                                data?.destination_url ||
                                data?.destination ||
                                null;
                            setTimeout(() => {
                                if (destination) {
                                    location.href =
                                        destination;
                                    return;
                                }
                                buyBox.innerHTML = `
                                    <div class="buy-product-card">
                                        <h3>
                                            <i class="fa-solid fa-circle-check"></i>
                                            Pembayaran Berhasil
                                        </h3>
                                        <p>
                                            Pembayaran kamu sudah berhasil diproses.
                                        </p>
                                    </div>
                                `;
                            }, 800);
                            return;
                        }
                        // =================================================
                        // EXPIRED / FAILED
                        // =================================================
                        const expiredStatuses = [
                            "expired",
                            "expire",
                            "cancelled",
                            "canceled",
                            "failed",
                            "failure",
                            "void"
                        ];
                        if (
                            expiredStatuses.includes(
                                status
                            )
                        ) {
                            clearInterval(
                                countdownTimer
                            );
                            paymentStatus.className =
                                "buy-status buy-failed";
                            paymentStatus.innerHTML = `
                                <i class="fa-solid fa-circle-xmark"></i>
                                Pembayaran ${escapeHtml(
                                    status
                                )}
                            `;
                            checkBtn.style.display =
                                "none";
                            return;
                        }
                        // =================================================
                        // UNKNOWN STATUS
                        // =================================================
                        if (!status) {
                            throw new Error(
                                "Status pembayaran tidak ditemukan dari /api/payment/status"
                            );
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
                        alert(
                            error?.message ||
                            "Gagal mengecek pembayaran"
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
                // CANCEL PAYMENT
                // =================================================
                const cancelBtn =
                    document.getElementById(
                        "cancelPayment"
                    );
                cancelBtn.onclick = async () => {
                    clearInterval(
                        countdownTimer
                    );
                    cancelBtn.disabled =
                        true;
                    cancelBtn.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Membatalkan...
                    `;
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
                                type="button"
                                onclick="location.reload()"
                            >
                                Buat Pembayaran Baru
                            </button>
                        </div>
                    `;
                };
            } catch (error) {
                buyBox.innerHTML = `
                    <div class="buy-product-card">
                        <h3>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Pembayaran Gagal
                        </h3>
                        <p>
                            ${escapeHtml(
                                error?.message ||
                                "Terjadi kesalahan"
                            )}
                        </p>
                        <button
                            class="buy-btn"
                            type="button"
                            onclick="location.reload()"
                        >
                            Coba Lagi
                        </button>
                    </div>
                `;
            }
        };
    } catch (error) {
        buyBox.innerHTML = `
            <div class="buy-product-card">
                <h3>
                    Terjadi Kesalahan
                </h3>
                <p>
                    ${escapeHtml(
                        error?.message ||
                        "Terjadi kesalahan"
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
