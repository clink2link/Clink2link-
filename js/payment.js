// ======================================================
// CLICK2PAY PAYMENT SYSTEM
// PAYMENT JS - CLEAN VERSION
// ======================================================
"use strict";
console.log("PAYMENT JS AKTIF");
// ======================================================
// GLOBAL
// ======================================================
let db = null;
let user = null;
let manualWithdrawOpen = false;
const instantWithdrawOpen = true;
let instantSelected = 0;
const INSTANT_LIMIT = 500000;
const INSTANT_FEE = 15000;
const MANUAL_MINIMUM = 100000;
// ======================================================
// HELPER
// ======================================================
const $ = id => document.getElementById(id);
// ======================================================
// GLOBAL ERROR DEBUG
// ======================================================
window.onerror = function (
    message,
    source,
    lineno,
    colno
) {
    console.error(
        "[GLOBAL ERROR]",
        {
            message,
            source,
            lineno,
            colno
        }
    );
};
// ======================================================
// WAIT DATABASE
// ======================================================
async function waitDatabase() {
    for (let retry = 0; retry < 30; retry++) {
        if (
            window.database &&
            window.database.supabase
        ) {
            return true;
        }
        console.log(
            "MENUNGGU DATABASE..."
        );
        await new Promise(
            resolve => setTimeout(resolve, 100)
        );
    }
    alert(
        "Database gagal dimuat."
    );
    return false;
}
// ======================================================
// INIT
// ======================================================
document.addEventListener(
    "DOMContentLoaded",
    async function () {
        console.log(
            "PAYMENT INIT START"
        );
        const ready =
            await waitDatabase();
        if (!ready) return;
        db =
            window.database.supabase;
        try {
            user =
                await window.database.getCurrentProfile();
            console.log(
                "USER:",
                user
            );
            if (!user?.id) {
                alert(
                    "User tidak valid / belum login."
                );
                location.replace(
                    "login.html"
                );
                return;
            }
            checkWithdrawService();
            await loadBalance();
            await checkPayment();
            await loadWithdrawStats();
            await loadInstantUsage();
            bindEvent();
        } catch (err) {
            console.error(
                "[PAYMENT INIT ERROR]",
                err
            );
            alert(
                err.message ||
                "Gagal memuat halaman pembayaran."
            );
        }
    }
);
// ======================================================
// WITHDRAW SERVICE
// WIB MONDAY - FRIDAY
// 08:00 - 18:00
// ======================================================
function getWIBDate() {
    return new Date(
        new Date().toLocaleString(
            "en-US",
            {
                timeZone:
                    "Asia/Jakarta"
            }
        )
    );
}
function checkWithdrawService() {
    const box =
        $("withdrawService");
    const btn =
        $("manualScrollBtn");
    if (!box) {
        console.log(
            "[ERROR] withdrawService tidak ditemukan"
        );
        return;
    }
    const now =
        getWIBDate();
    const day =
        now.getDay();
    const hour =
        now.getHours();
    manualWithdrawOpen =
        day >= 1 &&
        day <= 5 &&
        hour >= 8 &&
        hour < 18;
    if (manualWithdrawOpen) {
        box.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Withdraw buka<br>
            Senin - Jumat<br>
            08:00 - 18:00 WIB
        `;
        box.style.color =
            "#16a34a";
        if (btn) {
            btn.disabled = false;
            btn.style.opacity =
                "1";
        }
    } else {
        box.innerHTML = `
            <i class="fa-solid fa-circle-xmark"></i>
            Withdraw sedang tutup<br>
            Buka Senin - Jumat<br>
            08:00 - 18:00 WIB
        `;
        box.style.color =
            "#dc2626";
        if (btn) {
            btn.disabled = true;
            btn.style.opacity =
                "0.5";
        }
    }
    console.log(
        "[WITHDRAW STATUS]",
        {
            day,
            hour,
            manualWithdrawOpen,
            instantWithdrawOpen
        }
    );
}
// ======================================================
// RUPIAH
// ======================================================
const rupiahFormatter =
    new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    );
function rupiah(value) {
    const number =
        Number(value) || 0;
    try {
        return rupiahFormatter.format(
            number
        );
    } catch {
        return (
            "Rp " +
            number.toLocaleString(
                "id-ID"
            )
        );
    }
}
// ======================================================
// UPDATE BALANCE UI
// ======================================================
function updateBalanceUI(
    balance,
    ads,
    sell
) {
    const balanceEl =
        $("balance");
    const adsEl =
        $("adsBalance");
    const sellEl =
        $("sellBalance");
    if (balanceEl) {
        balanceEl.innerText =
            rupiah(balance);
    }
    if (adsEl) {
        adsEl.innerText =
            rupiah(ads);
    }
    if (sellEl) {
        sellEl.innerText =
            rupiah(sell);
    }
}
// ======================================================
// LOAD BALANCE
// ======================================================
async function loadBalance() {
    if (!user?.id) {
        console.error(
            "[BALANCE] User tidak valid"
        );
        return;
    }
    try {
        const profile =
            await window.database
                .getCurrentProfile();
        if (!profile) {
            console.error(
                "[BALANCE] Profile tidak ditemukan"
            );
            return;
        }
        user = profile;
        const balance =
            Number(profile.balance) || 0;
        const ads =
            Number(
                profile.ads_earning_total
            ) || 0;
        const sell =
            Number(
                profile.sell_earning_total
            ) || 0;
        updateBalanceUI(
            balance,
            ads,
            sell
        );
        console.log(
            "[BALANCE]",
            {
                balance,
                ads,
                sell
            }
        );
    } catch (err) {
        console.error(
            "[LOAD BALANCE ERROR]",
            err
        );
    }
}
// ======================================================
// CHECK PAYMENT METHOD
// ======================================================
async function checkPayment() {
    const warning =
        $("paymentWarning");
    if (!warning) return;
    try {
        const {
            data,
            error
        } = await db
            .from("payment_methods")
            .select("id")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();
        if (error) throw error;
        warning.style.display =
            data
                ? "none"
                : "flex";
    } catch (err) {
        console.error(
            "[CHECK PAYMENT ERROR]",
            err
        );
    }
}
// ======================================================
// LOAD WITHDRAW STATS
// ======================================================
async function loadWithdrawStats() {
    if (!user?.id) return;
    try {
        const {
            data,
            error
        } = await db
            .from("withdraws")
            .select(
                "amount,status"
            )
            .eq(
                "user_id",
                user.id
            );
        if (error) throw error;
        let success = 0;
        let pending = 0;
        let failed = 0;
        (data || []).forEach(
            item => {
                const amount =
                    Number(
                        item.amount
                    ) || 0;
                switch (item.status) {
                    case "success":
                        success += amount;
                        break;
                    case "pending":
                        pending += amount;
                        break;
                    case "failed":
                        failed += amount;
                        break;
                }
            }
        );
        if ($("successWD")) {
            $("successWD").innerText =
                rupiah(success);
        }
        if ($("pendingWD")) {
            $("pendingWD").innerText =
                rupiah(pending);
        }
        if ($("failedWD")) {
            $("failedWD").innerText =
                rupiah(failed);
        }
    } catch (err) {
        console.error(
            "[LOAD WD ERROR]",
            err
        );
    }
}
// ======================================================
// LOAD INSTANT USAGE
// ======================================================
async function loadInstantUsage() {
    if (!user?.id) return;
    try {
        const now =
            getWIBDate();
        const start =
            new Date(now);
        start.setHours(
            0,
            0,
            0,
            0
        );
        const end =
            new Date(start);
        end.setDate(
            end.getDate() + 1
        );
        const {
            data,
            error
        } = await db
            .from("withdraws")
            .select("amount")
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "type",
                "instant"
            )
            .gte(
                "created_at",
                start.toISOString()
            )
            .lt(
                "created_at",
                end.toISOString()
            );
        if (error) throw error;
        const used =
            (data || []).reduce(
                (total, item) =>
                    total +
                    (
                        Number(
                            item.amount
                        ) || 0
                    ),
                0
            );
        updateInstantLimit(
            used
        );
        return used;
    } catch (err) {
        console.error(
            "[INSTANT USAGE ERROR]",
            err
        );
        updateInstantLimit(
            0
        );
        return 0;
    }
}
// ======================================================
// EVENTS
// ======================================================
function bindEvent() {
    console.log(
        "[BIND EVENT]"
    );
    const manualScrollBtn =
        $("manualScrollBtn");
    const manualWithdrawBtn =
        $("manualWithdrawBtn");
    const instantWithdrawBtn =
        $("instantWithdrawBtn");
    const instantAmount =
        $("instantAmount");
    const instantButtons =
        document.querySelectorAll(
            ".instant-options button"
        );
    // ============================================
    // MANUAL SCROLL
    // ============================================
    manualScrollBtn?.addEventListener(
        "click",
        () => {
            if (!manualWithdrawOpen) {
                alert(
                    "Withdraw sedang tutup.\n\n" +
                    "Jam Operasional:\n" +
                    "Senin - Jumat\n" +
                    "08:00 - 18:00 WIB"
                );
                return;
            }
            $("manualWithdrawBox")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        }
    );
    // ============================================
    // MANUAL WITHDRAW
    // ============================================
    manualWithdrawBtn?.addEventListener(
        "click",
        manualWithdraw
    );
    // ============================================
    // INSTANT NOMINAL BUTTON
    // ============================================
    instantButtons.forEach(
        button => {
            button.addEventListener(
                "click",
                () => {
                    instantButtons.forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );
                    button.classList.add(
                        "active"
                    );
                    instantSelected =
                        Number(
                            button.dataset.value
                        ) || 0;
                    if (instantAmount) {
                        instantAmount.value =
                            instantSelected;
                    }
                }
            );
        }
    );
    // ============================================
    // INSTANT INPUT
    // ============================================
    instantAmount?.addEventListener(
        "input",
        e => {
            instantSelected =
                Number(
                    e.target.value
                ) || 0;
            instantButtons.forEach(
                btn => {
                    btn.classList.toggle(
                        "active",
                        Number(
                            btn.dataset.value
                        ) === instantSelected
                    );
                }
            );
        }
    );
    // ============================================
    // INSTANT WITHDRAW
    // ============================================
    instantWithdrawBtn?.addEventListener(
        "click",
        instantWithdraw
    );
}
// ======================================================
// PAYMENT METHOD
// ======================================================
async function getPaymentMethod() {
    const {
        data,
        error
    } = await db
        .from("payment_methods")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();
    if (error) throw error;
    return data;
}
// ======================================================
// MANUAL WITHDRAW
// ======================================================
async function manualWithdraw() {
    console.log(
        "[MANUAL WITHDRAW]"
    );
    if (!manualWithdrawOpen) {
        alert(
            "Withdraw sedang tutup."
        );
        return;
    }
    const button =
        $("manualWithdrawBtn");
    if (button?.disabled) return;
    const amount =
        Number(
            $("manualAmount")?.value
        ) || 0;
    if (amount <= 0) {
        alert(
            "Masukkan nominal withdraw."
        );
        return;
    }
    if (amount < MANUAL_MINIMUM) {
        alert(
            "Minimal withdraw Rp100.000."
        );
        return;
    }
    setButtonLoading(
        button,
        true,
        "Memproses..."
    );
    try {
        // =========================================
        // PAYMENT METHOD
        // =========================================
        const payment =
            await getPaymentMethod();
        if (!payment) {
            alert(
                "Silakan simpan rekening terlebih dahulu."
            );
            location.href =
                "paymentsetting.html";
            return;
        }
        // =========================================
        // PROFILE TERBARU
        // =========================================
        const profile =
            await window.database
                .getCurrentProfile();
        if (!profile) {
            throw new Error(
                "Gagal mengambil data user."
            );
        }
        const balance =
            Number(
                profile.balance
            ) || 0;
        if (balance < amount) {
            alert(
                "Saldo tidak cukup."
            );
            return;
        }
        // =========================================
        // INSERT WITHDRAW
        // =========================================
        const {
            error: withdrawError
        } = await db
            .from("withdraws")
            .insert({
                user_id:
                    user.id,
                method:
                    payment.method,
                account_number:
                    payment.account_number,
                amount:
                    amount,
                fee:
                    0,
                type:
                    "manual",
                status:
                    "pending"
            });
        if (withdrawError)
            throw withdrawError;
        // =========================================
        // UPDATE BALANCE
        // =========================================
        const newBalance =
            balance - amount;
        const {
            error: updateError
        } = await db
            .from("users")
            .update({
                balance:
                    newBalance
            })
            .eq(
                "id",
                user.id
            );
        if (updateError)
            throw updateError;
        alert(
            "Withdraw manual berhasil dibuat."
        );
        await loadBalance();
        await loadWithdrawStats();
        if ($("manualAmount")) {
            $("manualAmount").value =
                "";
        }
    } catch (err) {
        console.error(
            "[MANUAL WITHDRAW ERROR]",
            err
        );
        alert(
            err.message ||
            "Terjadi kesalahan saat membuat withdraw."
        );
    } finally {
        setButtonLoading(
            button,
            false
        );
    }
}
// ======================================================
// INSTANT WITHDRAW
// ======================================================
async function instantWithdraw() {
    console.log(
        "[INSTANT WITHDRAW]"
    );
    if (!instantWithdrawOpen) {
        alert(
            "Withdraw instant sedang tidak tersedia."
        );
        return;
    }
    const amount =
        Number(
            instantSelected
        ) || 0;
    if (amount <= 0) {
        alert(
            "Pilih nominal withdraw."
        );
        return;
    }
    const button =
        $("instantWithdrawBtn");
    if (button?.disabled) return;
    const total =
        amount + INSTANT_FEE;
    setButtonLoading(
        button,
        true,
        "Memproses..."
    );
    try {
        // =========================================
        // PROFILE TERBARU
        // =========================================
        const profile =
            await window.database
                .getCurrentProfile();
        if (!profile) {
            throw new Error(
                "Gagal mengambil data user."
            );
        }
        const balance =
            Number(
                profile.balance
            ) || 0;
        if (balance < total) {
            alert(
                "Saldo tidak cukup.\n\n" +
                "Withdraw : " +
                rupiah(amount) +
                "\n" +
                "Fee : " +
                rupiah(INSTANT_FEE) +
                "\n" +
                "Total Potongan : " +
                rupiah(total)
            );
            return;
        }
        // =========================================
        // PAYMENT METHOD
        // =========================================
        const payment =
            await getPaymentMethod();
        if (!payment) {
            alert(
                "Silakan simpan rekening terlebih dahulu."
            );
            location.href =
                "paymentsetting.html";
            return;
        }
        // =========================================
        // DAILY LIMIT
        // =========================================
        const usedToday =
            await getInstantUsage();
        if (
            usedToday + amount >
            INSTANT_LIMIT
        ) {
            const remaining =
                Math.max(
                    INSTANT_LIMIT -
                    usedToday,
                    0
                );
            alert(
                "Limit withdraw instant hari ini tidak cukup.\n\n" +
                "Sisa limit: " +
                rupiah(remaining)
            );
            return;
        }
        // =========================================
        // INSERT WITHDRAW
        // =========================================
        const {
            error: withdrawError
        } = await db
            .from("withdraws")
            .insert({
                user_id:
                    user.id,
                method:
                    payment.method,
                account_number:
                    payment.account_number,
                amount:
                    amount,
                fee:
                    INSTANT_FEE,
                type:
                    "instant",
                status:
                    "success"
            });
        if (withdrawError)
            throw withdrawError;
        // =========================================
        // UPDATE BALANCE
        // =========================================
        const newBalance =
            balance - total;
        const {
            error: updateError
        } = await db
            .from("users")
            .update({
                balance:
                    newBalance
            })
            .eq(
                "id",
                user.id
            );
        if (updateError)
            throw updateError;
        instantSelected =
            0;
        if ($("instantAmount")) {
            $("instantAmount").value =
                "";
        }
        document
            .querySelectorAll(
                ".instant-options button"
            )
            .forEach(
                btn =>
                    btn.classList.remove(
                        "active"
                    )
            );
        alert(
            "Withdraw instant berhasil."
        );
        await loadBalance();
        await loadWithdrawStats();
        await loadInstantUsage();
    } catch (err) {
        console.error(
            "[INSTANT WITHDRAW ERROR]",
            err
        );
        alert(
            err.message ||
            "Terjadi kesalahan saat melakukan withdraw."
        );
    } finally {
        setButtonLoading(
            button,
            false
        );
    }
}
// ======================================================
// GET INSTANT USAGE
// ======================================================
async function getInstantUsage() {
    if (!user?.id)
        return 0;
    const now =
        getWIBDate();
    const start =
        new Date(now);
    start.setHours(
        0,
        0,
        0,
        0
    );
    const end =
        new Date(start);
    end.setDate(
        end.getDate() + 1
    );
    const {
        data,
        error
    } = await db
        .from("withdraws")
        .select("amount")
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "type",
            "instant"
        )
        .gte(
            "created_at",
            start.toISOString()
        )
        .lt(
            "created_at",
            end.toISOString()
        );
    if (error)
        throw error;
    return (
        data || []
    ).reduce(
        (total, item) =>
            total +
            (
                Number(
                    item.amount
                ) || 0
            ),
        0
    );
}
// ======================================================
// UPDATE INSTANT LIMIT
// ======================================================
function updateInstantLimit(
    used = 0
) {
    const remain =
        Math.max(
            INSTANT_LIMIT -
            used,
            0
        );
    const percent =
        Math.min(
            (used /
                INSTANT_LIMIT) *
                100,
            100
        );
    if ($("instantLimit")) {
        $("instantLimit")
            .textContent =
            rupiah(remain);
    }
    if ($("instantProgress")) {
        $("instantProgress")
            .style.width =
            percent + "%";
    }
}
// =================================================
