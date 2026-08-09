/* =====================================================
CLICK2PAY LANGUAGE SYSTEM
===================================================== */

(function(){

"use strict";
/* =================================================
   TRANSLATIONS
================================================= */
const translations = {
    /* =================================================
       INDONESIAN
    ================================================= */
    id: {
        /* =========================
           GLOBAL / NAVBAR
        ========================= */
        language: "Bahasa",
        dashboard: "Dashboard",
        createLink: "Create Link",
        createSellLink: "Create Sell Link",
        myLink: "My Link",
        payment: "Payment",
        balanceHistory: "History Saldo",
        referral: "Referral",
        notification: "Notifikasi",
        account: "Akun",
        profile: "Profil",
        settings: "Pengaturan",
        loginActivity: "Aktivitas Login",
        support: "Support",
        telegram: "Telegram",
        facebook: "Facebook",
        logout: "Logout",
        searchMenu: "Cari menu...",
        withdraw: "Withdraw",
        premium: "Premium",
        sellLink: "Sell Link",
        adsLink: "Ads Link",
        /* =========================
           COMMON
        ========================= */
        common: {
            open: "Buka",
            live: "LIVE",
            loading: "Memuat...",
            views: "Views",
            clicks: "Klik",
            cpm: "CPM",
            date: "Tanggal",
            earnings: "Pendapatan"
        },
        /* =========================
           DASHBOARD
        ========================= */
        dashboard: {
            /* =====================
               TITLE
            ===================== */
            title:
                "Dashboard Click2Pay",
            /* =====================
               NOTICE
            ===================== */
            notice:
                "Jika belum tahu caranya, silakan klik panduan di bawah ini. Jika ingin mengaktifkan fitur Sell Link, Anda dapat upgrade Premium atau menghubungi admin.",
            /* =====================
               GUIDE
            ===================== */
            guide: {
                title:
                    "Panduan Click2Pay",
                description:
                    "Pelajari semua fitur Click2Pay sebelum mulai menghasilkan uang.",
                ads: {
                    title:
                        "Buat Ads Link",
                    description:
                        "Pelajari cara membuat Ads Link pertama dan membagikannya."
                },
                sell: {
                    title:
                        "Buat Sell Link",
                    description:
                        "Cara mengaktifkan Sell Link dan menjual akses premium."
                },
                statistics: {
                    title:
                        "Lihat Statistik",
                    description:
                        "Pelajari arti Views, Click, CPM dan Pendapatan."
                },
                withdraw: {
                    title:
                        "Withdraw",
                    description:
                        "Cara menarik saldo ke rekening atau e-wallet."
                },
                earnings: {
                    title:
                        "Mendapatkan Penghasilan",
                    description:
                        "Tips meningkatkan traffic dan pendapatan harian."
                },
                account: {
                    title:
                        "Pengaturan Akun",
                    description:
                        "Mengubah profil, password, atau pengaturan akun."
                },
                delete: {
                    title:
                        "Hapus Akun",
                    description:
                        "Panduan menonaktifkan atau menghapus akun permanen."
                },
                faq: {
                    title:
                        "Pusat Bantuan",
                    description:
                        "FAQ dan pertanyaan yang sering ditanyakan pengguna."
                }
            },
            /* =====================
               GLOBAL CPM MARKET
            ===================== */
            market: {
                title:
                    "Global CPM Market",
                loading:
                    "Memuat CPM negara..."
            },
            /* =====================
               ADS REPORT
            ===================== */
            adsReport: {
                title:
                    "Report Pendapatan Ads",
                today:
                    "Ads Hari Ini",
                month:
                    "Ads Bulan Ini",
                cpm:
                    "CPM Saat Ini",
                views:
                    "Total Views"
            },
            /* =====================
               SELL REPORT
            ===================== */
            sellReport: {
                title:
                    "Report Pendapatan Sell Link",
                today:
                    "Pendapatan Hari Ini",
                month:
                    "Pendapatan Bulan Ini",
                sold:
                    "Total Terjual",
                links:
                    "Total Sell Link"
            },
            /* =====================
               STATISTICS
            ===================== */
            statistics: {
                ads:
                    "Statistik Ads",
                sell:
                    "Statistik Sell Link",
                timezone:
                    "Report berdasarkan waktu Asia/Jakarta."
            },
            /* =====================
               DAILY ADS REPORT
            ===================== */
            dailyAds: {
                title:
                    "Detail Report Harian Ads Link",
                empty:
                    "Belum ada data report ADS."
            },
            /* =====================
               DAILY SELL REPORT
            ===================== */
            dailySell: {
                title:
                    "Detail Report Harian Sell Link",
                empty:
                    "Belum ada laporan SELL."
            },
            /* =====================
               ANNOUNCEMENT
            ===================== */
            announcement: {
                title:
                    "Pengumuman Admin",
                empty:
                    "Belum ada pengumuman."
            }
        }
    },
    /* =================================================
       ENGLISH
    ================================================= */
    en: {
        /* =========================
           GLOBAL / NAVBAR
        ========================= */
        language: "Language",
        dashboard: "Dashboard",
        createLink: "Create Link",
        createSellLink: "Create Sell Link",
        myLink: "My Link",
        payment: "Payment",
        balanceHistory: "Balance History",
        referral: "Referral",
        notification: "Notifications",
        account: "Account",
        profile: "Profile",
        settings: "Settings",
        loginActivity: "Login Activity",
        support: "Support",
        telegram: "Telegram",
        facebook: "Facebook",
        logout: "Logout",
        searchMenu: "Search menu...",
        withdraw: "Withdraw",
        premium: "Premium",
        sellLink: "Sell Link",
        adsLink: "Ads Link",
        /* =========================
           COMMON
        ========================= */
        common: {
            open: "Open",
            live: "LIVE",
            loading: "Loading...",
            views: "Views",
            clicks: "Clicks",
            cpm: "CPM",
            date: "Date",
            earnings: "Earnings"
        },
        /* =========================
           DASHBOARD
        ========================= */
        dashboard: {
            /* =====================
               TITLE
            ===================== */
            title:
                "Click2Pay Dashboard",
            /* =====================
               NOTICE
            ===================== */
            notice:
                "If you don't know how to use it yet, please click the guide below. To activate Sell Link, you can upgrade to Premium or contact the admin.",
            /* =====================
               GUIDE
            ===================== */
            guide: {
                title:
                    "Click2Pay Guide",
                description:
                    "Learn about all Click2Pay features before you start earning money.",
                ads: {
                    title:
                        "Create Ads Link",
                    description:
                        "Learn how to create your first Ads Link and share it."
                },
                sell: {
                    title:
                        "Create Sell Link",
                    description:
                        "Learn how to activate Sell Link and sell premium access."
                },
                statistics: {
                    title:
                        "View Statistics",
                    description:
                        "Learn what Views, Clicks, CPM and Earnings mean."
                },
                withdraw: {
                    title:
                        "Withdraw",
                    description:
                        "Learn how to withdraw your balance to a bank account or e-wallet."
                },
                earnings: {
                    title:
                        "How to Earn",
                    description:
                        "Tips to increase your traffic and daily earnings."
                },
                account: {
                    title:
                        "Account Settings",
                    description:
                        "Change your profile, password, or account settings."
                },
                delete: {
                    title:
                        "Delete Account",
                    description:
                        "Guide to deactivating or permanently deleting your account."
                },
                faq: {
                    title:
                        "Help Center",
                    description:
                        "FAQ and frequently asked questions."
                }
            },
            /* =====================
               GLOBAL CPM MARKET
            ===================== */
            market: {
                title:
                    "Global CPM Market",
                loading:
                    "Loading country CPM..."
            },
            /* =====================
               ADS REPORT
            ===================== */
            adsReport: {
                title:
                    "Ads Earnings Report",
                today:
                    "Ads Today",
                month:
                    "Ads This Month",
                cpm:
                    "Current CPM",
                views:
                    "Total Views"
            },
            /* =====================
               SELL REPORT
            ===================== */
            sellReport: {
                title:
                    "Sell Link Earnings Report",
                today:
                    "Today's Earnings",
                month:
                    "This Month's Earnings",
                sold:
                    "Total Sold",
                links:
                    "Total Sell Links"
            },
            /* =====================
               STATISTICS
            ===================== */
            statistics: {
                ads:
                    "Ads Statistics",
                sell:
                    "Sell Link Statistics",
                timezone:
                    "Report based on Asia/Jakarta time."
            },
            /* =====================
               DAILY ADS REPORT
            ===================== */
            dailyAds: {
                title:
                    "Daily Ads Link Report",
                empty:
                    "No ADS report data yet."
            },
            /* =====================
               DAILY SELL REPORT
            ===================== */
            dailySell: {
                title:
                    "Daily Sell Link Report",
                empty:
                    "No SELL report available yet."
            },
            /* =====================
               ANNOUNCEMENT
            ===================== */
            announcement: {
                title:
                    "Admin Announcement",
                empty:
                    "No announcements yet."
            }
        }
    }
};
/* =================================================
   GET NESTED TRANSLATION
   
   Example:
   
   getTranslation(data, "dashboard.title")
   
   => "Click2Pay Dashboard"
================================================= */
function getTranslation(
    data,
    key
){
    if(
        !data ||
        !key
    ){
        return undefined;
    }
    const parts =
        key.split(".");
    let value =
        data;
    for(
        let i = 0;
        i < parts.length;
        i++
    ){
        if(
            value === null ||
            value === undefined
        ){
            return undefined;
        }
        if(
            typeof value !== "object" ||
            !(parts[i] in value)
        ){
            return undefined;
        }
        value =
            value[parts[i]];
    }
    return value;
}
/* =================================================
   GET CURRENT LANGUAGE
================================================= */
function getLanguage(){
    const saved =
        localStorage.getItem(
            "language"
        );
    if(
        saved &&
        translations[saved]
    ){
        return saved;
    }
    return "id";
}
/* =================================================
   APPLY LANGUAGE
================================================= */
function applyLanguage(
    language = getLanguage()
){
    /* =============================================
       VALIDATE LANGUAGE
    ============================================= */
    if(
        !translations[language]
    ){
        language = "id";
    }
    const data =
        translations[language];
    /* =============================================
       TEXT TRANSLATION
    ============================================= */
    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(function(element){
            const key =
                element.dataset.i18n;
            const translation =
                getTranslation(
                    data,
                    key
                );
            if(
                translation !== undefined
            ){
                element.textContent =
                    translation;
            }
        });
    /* =============================================
       PLACEHOLDER TRANSLATION
    ============================================= */
    document
        .querySelectorAll(
            "[data-i18n-placeholder]"
        )
        .forEach(function(element){
            const key =
                element.dataset
                    .i18nPlaceholder;
            const translation =
                getTranslation(
                    data,
                    key
                );
            if(
                translation !== undefined
            ){
                element.placeholder =
                    translation;
            }
        });
    /* =============================================
       TITLE TRANSLATION
    ============================================= */
    document
        .querySelectorAll(
            "[data-i18n-title]"
        )
        .forEach(function(element){
            const key =
                element.dataset
                    .i18nTitle;
            const translation =
                getTranslation(
                    data,
                    key
                );
            if(
                translation !== undefined
            ){
                element.title =
                    translation;
            }
        });
    /* =============================================
       LANGUAGE SELECTOR
    ============================================= */
    const selector =
        document.getElementById(
            "languageSelect"
        );
    if(selector){
        selector.value =
            language;
    }
    /* =============================================
       SAVE LANGUAGE
    ============================================= */
    localStorage.setItem(
        "language",
        language
    );
    /* =============================================
       HTML LANG
    ============================================= */
    document.documentElement
        .setAttribute(
            "lang",
            language
        );
    /* =============================================
       LANGUAGE CHANGE EVENT
    ============================================= */
    document.dispatchEvent(
        new CustomEvent(
            "languageChanged",
            {
                detail:{
                    language: language
                }
            }
        )
    );
}
/* =================================================
   CHANGE LANGUAGE
================================================= */
function setLanguage(
    language
){
    if(
        !translations[language]
    ){
        language = "id";
    }
    applyLanguage(
        language
    );
}
/* =================================================
   INITIALIZE LANGUAGE SELECTOR
================================================= */
function initLanguageSelector(){
    const selector =
        document.getElementById(
            "languageSelect"
        );
    /*
     * Navbar belum dimuat.
     *
     * Tidak dianggap error.
     */
    if(!selector){
        return false;
    }
    /* =============================================
       SET CURRENT LANGUAGE
    ============================================= */
    selector.value =
        getLanguage();
    /* =============================================
       PREVENT DUPLICATE EVENT
    ============================================= */
    if(
        selector.dataset
            .languageReady ===
        "true"
    ){
        return true;
    }
    selector.dataset
        .languageReady =
        "true";
    /* =============================================
       CHANGE EVENT
    ============================================= */
    selector.addEventListener(
        "change",
        function(){
            setLanguage(
                this.value
            );
        }
    );
    return true;
}
/* =================================================
   INITIALIZE LANGUAGE
================================================= */
function initLanguage(){
    /*
     * Coba cari selector.
     *
     * Navbar mungkin belum tersedia.
     */
    initLanguageSelector();
    /*
     * Terapkan bahasa ke seluruh
     * elemen yang sudah tersedia.
     */
    applyLanguage();
}
/* =================================================
   REFRESH LANGUAGE
   
   Digunakan setelah komponen dinamis
   seperti navbar/footer selesai dimuat.
================================================= */
function refreshLanguage(){
    /*
     * Cari kembali language selector.
     */
    initLanguageSelector();
    /*
     * Terapkan kembali bahasa
     * ke seluruh halaman.
     */
    applyLanguage();
}
/* =================================================
   DOM READY
================================================= */
if(
    document.readyState ===
    "loading"
){
    document.addEventListener(
        "DOMContentLoaded",
        initLanguage
    );
}else{
    initLanguage();
}
/* =================================================
   GLOBAL API
================================================= */
window.c2pLanguage = {
    getLanguage,
    setLanguage,
    applyLanguage,
    initLanguage,
    refreshLanguage,
    initLanguageSelector,
    getTranslation,
    translations
};
/* =================================================
   COMPATIBILITY
   
   Mempertahankan fungsi lama
   jika ada file lain yang memanggil:
   
   applyLanguage()
================================================= */
window.applyLanguage =
    applyLanguage;

})();
