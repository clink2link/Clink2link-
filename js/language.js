/* =====================================================
   CLICK2PAY LANGUAGE SYSTEM
===================================================== */
(function(){
    "use strict";
    /* =================================================
       TRANSLATIONS
    ================================================= */
    const translations = {
        /* =============================================
           INDONESIAN
        ============================================= */
        id: {
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
            adsLink: "Ads Link"
        },
        /* =============================================
           ENGLISH
        ============================================= */
        en: {
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
            adsLink: "Ads Link"
        }
    };
    /* =================================================
       GET CURRENT LANGUAGE
    ================================================= */
    function getLanguage(){
        const saved =
            localStorage.getItem("language");
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
        /*
         * Validasi bahasa
         */
        if(
            !translations[language]
        ){
            language = "id";
        }
        const data =
            translations[language];
        /* =================================================
           TEXT
        ================================================= */
        document
            .querySelectorAll("[data-i18n]")
            .forEach(function(element){
                const key =
                    element.dataset.i18n;
                if(
                    data[key] !== undefined
                ){
                    element.textContent =
                        data[key];
                }
            });
        /* =================================================
           PLACEHOLDER
        ================================================= */
        document
            .querySelectorAll(
                "[data-i18n-placeholder]"
            )
            .forEach(function(element){
                const key =
                    element.dataset
                        .i18nPlaceholder;
                if(
                    data[key] !== undefined
                ){
                    element.placeholder =
                        data[key];
                }
            });
        /* =================================================
           LANGUAGE SELECTOR
        ================================================= */
        const selector =
            document.getElementById(
                "languageSelect"
            );
        if(selector){
            selector.value =
                language;
        }
        /* =================================================
           SAVE LANGUAGE
        ================================================= */
        localStorage.setItem(
            "language",
            language
        );
        /* =================================================
           HTML LANG
        ================================================= */
        document.documentElement
            .setAttribute(
                "lang",
                language
            );
        /* =================================================
           EVENT
        ================================================= */
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
    function setLanguage(language){
        if(
            !translations[language]
        ){
            language = "id";
        }
        applyLanguage(language);
    }
    /* =================================================
       LANGUAGE SELECTOR
    ================================================= */
    function initLanguageSelector(){
        const selector =
            document.getElementById(
                "languageSelect"
            );
        /*
         * Navbar belum masuk.
         *
         * Jangan error.
         * Nanti bisa dipanggil lagi
         * setelah navbar selesai load.
         */
        if(!selector){
            return false;
        }
        /*
         * Set bahasa yang tersimpan
         */
        selector.value =
            getLanguage();
        /*
         * Hindari event listener
         * dipasang dua kali.
         */
        if(
            selector.dataset
                .languageReady === "true"
        ){
            return true;
        }
        selector.dataset
            .languageReady = "true";
        /* =================================================
           CHANGE EVENT
        ================================================= */
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
         * Coba pasang selector.
         */
        initLanguageSelector();
        /*
         * Terapkan bahasa ke elemen
         * yang sudah tersedia.
         */
        applyLanguage();
    }
    /* =================================================
       RE-INITIALIZE
       Dipanggil setelah navbar.html
       selesai dimuat.
    ================================================= */
    function refreshLanguage(){
        initLanguageSelector();
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
        translations
    };
    /*
     * Compatibility:
     *
     * navbar.js sebelumnya memanggil
     * applyLanguage() secara langsung.
     */
    window.applyLanguage =
        applyLanguage;
})();
