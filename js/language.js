/* =====================================================
CLICK2PAY LANGUAGE SYSTEM
===================================================== */
(function(){
"use strict";

/* =====================================================
TRANSLATIONS
===================================================== */

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
        earnings: "Pendapatan",
        save: "Simpan",
        cancel: "Batal",
        reset: "Reset",
        edit: "Edit",
        delete: "Hapus",
        close: "Tutup",
        back: "Kembali",
        copy: "Copy",
        search: "Cari",
        submit: "Kirim",
        confirm: "Konfirmasi",
        yes: "Ya",
        no: "Tidak",
        active: "Aktif",
        expired: "Expired",
        all: "Semua",
        success: "Berhasil",
        failed: "Gagal",
        pending: "Pending",
        never: "Tidak Pernah"
    },
   /* ID */
list: {
    title: "Daftar Sell Link",
    description: "Kelola seluruh Sell Link yang telah Anda buat.",
    emptyTitle: "Belum Ada Sell Link",
    emptyDescription: "Silakan buat Sell Link pertama Anda.",
    loadingDescription: "Mohon tunggu sebentar."
},
    /* =========================
       LOGIN ACTIVITY
    ========================= */
    loginActivityDescription:
        "Riwayat perangkat dan waktu login akun kamu.",
    totalDevice:
        "Total Device",
    lastLogin:
        "Login Terakhir",
    currentDevice:
        "Device Sekarang",
    loginDevices:
        "Perangkat Login",
    loadingData:
        "Memuat data...",
    /* =========================
       DASHBOARD
    ========================= */
    dashboard: {
        title:
            "Dashboard Click2Pay",
        notice:
            "Jika belum tahu caranya, silakan klik panduan di bawah ini. Jika ingin mengaktifkan fitur Sell Link, Anda dapat upgrade Premium atau menghubungi admin.",
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
        market: {
            title:
                "Global CPM Market",
            loading:
                "Memuat CPM negara..."
        },
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
        statistics: {
            ads:
                "Statistik Ads",
            sell:
                "Statistik Sell Link",
            timezone:
                "Report berdasarkan waktu Asia/Jakarta."
        },
        dailyAds: {
            title:
                "Detail Report Harian Ads Link",
            empty:
                "Belum ada data report ADS."
        },
        dailySell: {
            title:
                "Detail Report Harian Sell Link",
            empty:
                "Belum ada laporan SELL."
        },
        announcement: {
            title:
                "Pengumuman Admin",
            empty:
                "Belum ada pengumuman."
        }
    },
    /* =================================================
       CREATE LINK ADS
    ================================================= */
    createAds: {
        title:
            "Create Link Ads",
        description:
            "Buat shortlink iklan dan dapatkan penghasilan dari traffic valid.",
        information: {
            title:
                "Informasi Ads Link",
            validUrl:
                "Gunakan URL tujuan yang valid.",
            automatic:
                "Shortlink dibuat otomatis oleh sistem.",
            manage:
                "Link dapat dicopy, edit, dan hapus kapan saja.",
            statistics:
                "Statistik View, Click dan Earnings diperbarui otomatis."
        },
        form: {
            title:
                "Buat Ads Link Baru",
            description:
                "Masukkan tujuan link that you want dimonetisasi.",
            linkName:
                "Nama Link",
            linkNamePlaceholder:
                "Contoh : Promo Produk",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            create:
                "Buat Ads Link",
            reset:
                "Reset",
            note:
                "Pastikan URL tujuan aman dan benar."
        },
        stats: {
            totalLink:
                "Total Ads Link",
            totalView:
                "Total View",
            totalClick:
                "Total Click",
            totalEarning:
                "Total Earnings"
        },
        search:
            "Cari nama link atau URL...",
        filters: {
            all:
                "Semua",
            active:
                "Aktif",
            expired:
                "Expired"
        },
        tips: {
            title:
                "Tips",
            description:
                "Bagikan Ads Link melalui media sosial, website, atau komunitas. Gunakan traffic berkualitas agar CPM tetap optimal."
        },
        list: {
            title:
                "Daftar Ads Link",
            description:
                "Kelola semua shortlink iklan Anda.",
            dashboard:
                "Dashboard"
        },
        edit: {
            title:
                "Edit Ads Link",
            description:
                "Perbarui nama dan tujuan link.",
            linkName:
                "Nama Link",
            linkNamePlaceholder:
                "Contoh: Promo Produk",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            save:
                "Simpan Perubahan",
            cancel:
                "Batal"
        }
    },
    /* =================================================
       EDIT PROFILE
    ================================================= */
    editProfile: {
        title:
            "Edit Profile",
        description:
            "Ubah informasi akun Click2Pay kamu.",
        editUsername: {
            title:
                "Edit Username",
            description:
                "Perbarui nama pengguna akun Click2Pay kamu.",
            label:
                "Username Baru",
            placeholder:
                "Masukkan username baru",
            save:
                "Simpan Perubahan"
        },
        information: {
            title:
                "Informasi Username",
            description:
                "Username digunakan sebagai identitas akun Click2Pay. Gunakan username yang unik dan mudah diingat. Perubahan username akan tersimpan otomatis pada akun kamu."
        }
    },
    /* =================================================
       MY LINK
    ================================================= */
    myLinkPage: {
        title:
            "My Link",
        description:
            "Kelola seluruh Smart Link, Ads Link, dan Sell Link.",
        information: {
            title:
                "Smart Link Management",
            smart:
                "Buat link pendek dengan sistem Ads Link.",
            statistics:
                "Pantau view, click, dan pendapatan secara real-time.",
            advanced:
                "Gunakan Advanced Settings untuk Custom Alias.",
            quality:
                "Link berkualitas mendapatkan performa lebih baik.",
            sell:
                "Sell Link tersedia setelah memenuhi syarat akun."
        },
        create: {
            title:
                "Buat Smart Link Baru",
            description:
                "Ubah URL biasa menjadi link pintar Click2Pay.",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://website-kamu.com",
            linkType:
                "Link Type",
            ads:
                "Ads Link",
            sell:
                "Sell Link 🔒",
            sellLocked:
                "Sell Link belum aktif.",
            preview:
                "Preview Smart Link",
            previewEmpty:
                "Link akan dibuat otomatis",
            create:
                "Create Smart Link",
            advanced:
                "Advanced"
        },
        stats: {
            total:
                "Total Link",
            views:
                "Total View",
            clicks:
                "Total Click",
            earnings:
                "Total Earnings",
            adsLink:
                "Ads Link",
            adsViews:
                "Ads Views",
            sellLink:
                "Sell Link",
            sellRevenue:
                "Sell Revenue"
        },
        filters: {
            all:
                "Semua",
            ads:
                "Ads Link",
            sell:
                "Sell Link"
        },
        search:
            "Cari judul atau URL...",
        tips:
            "Optimalkan traffic berkualitas untuk meningkatkan pendapatan Ads Link dan Sell Link.",
        panels: {
            smart:
                "Smart Link",
            sell:
                "Sell Link",
            ads:
                "Ads Link",
            link:
                "Link"
        },
        edit: {
            title:
                "Edit Smart Link",
            linkTitle:
                "Judul Link",
            linkTitlePlaceholder:
                "Judul Smart Link",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            save:
                "Simpan",
            cancel:
                "Batal"
        },
        advanced: {
            title:
                "Advanced Settings",
            description:
                "Pengaturan tambahan untuk Smart Link.",
            customAlias:
                "Custom Alias",
            customAliasPlaceholder:
                "contoh: promo-juli",
            expired:
                "Expired Link",
            never:
                "Tidak Pernah",
            oneDay:
                "1 Hari",
            sevenDays:
                "7 Hari",
            thirtyDays:
                "30 Hari",
            campaign:
                "Campaign",
            campaignPlaceholder:
                "Nama Campaign",
            targetDevice:
                "Target Device",
            allDevice:
                "Semua Device",
            android:
                "Android",
            ios:
                "iPhone / iOS",
            desktop:
                "Desktop",
            save:
                "Simpan Pengaturan",
            note:
                "Setting akan digunakan saat membuat Smart Link baru."
        }
    },
    /* =================================================
       PAYMENT
    ================================================= */
    paymentPage: {
        title:
            "Payment",
        description:
            "Kelola saldo dan lakukan penarikan dana melalui Click2Pay.",
        serviceChecking:
            "Memeriksa layanan withdraw...",
        stats: {
            balance:
                "Saldo Saat Ini",
            adsBalance:
                "Saldo Ads",
            sellBalance:
                "Saldo Sell Link",
            success:
                "WD Success",
            pending:
                "WD Pending",
            failed:
                "WD Failed"
        },
        warning: {
            title:
                "Rekening belum disimpan",
            description:
                "Silakan simpan rekening pembayaran terlebih dahulu sebelum melakukan withdraw.",
            paymentSetting:
                "Payment Setting"
        },
        actions: {
            request:
                "Request Withdraw",
            history:
                "WD Transaksi"
        },
        information: {
            title:
                "Informasi Withdraw",
            days:
                "Layanan withdraw dibuka Senin - Jumat.",
            hours:
                "Jam operasional withdraw: 08:00 - 18:00 WIB.",
            weekend:
                "Sabtu dan Minggu layanan withdraw otomatis ditutup.",
            account:
                "Pastikan rekening pembayaran sudah tersimpan di menu Payment Setting.",
            responsibility:
                "Kesalahan rekening atau e-wallet menjadi tanggung jawab pengguna.",
            manual:
                "Withdraw manual akan masuk status Pending sebelum diproses admin.",
            instant:
                "Withdraw instant diproses otomatis apabila layanan tersedia.",
            success:
                "Withdraw berhasil akan masuk ke menu WD Transaksi."
        },
        manual: {
            title:
                "Withdraw Manual",
            description:
                "Tarik saldo menggunakan rekening yang sudah tersimpan pada Payment Setting.",
            amount:
                "Nominal Withdraw",
            placeholder:
                "Minimal Rp100.000",
            rules:
                "Ketentuan Withdraw Manual",
            minimum:
                "Minimal withdraw Rp100.000.",
            deducted:
                "Saldo akan dipotong setelah request berhasil.",
            pending:
                "Status awal withdraw adalah Pending.",
            admin:
                "Admin akan melakukan pengecekan sebelum pembayaran.",
            success:
                "Jika berhasil status berubah menjadi Success.",
            failed:
                "Jika gagal status berubah menjadi Failed.",
            submit:
                "Request Withdraw Manual"
        },
        instant: {
            title:
                "Withdraw Instant",
            description:
                "Tarik saldo otomatis dengan batas maksimal sesuai aturan sistem.",
            dailyLimit:
                "Limit Instant Hari Ini",
            amount:
                "Nominal Withdraw",
            fee:
                "Biaya layanan instant Rp15.000.",
            balance:
                "Saldo harus mencukupi nominal + biaya.",
            example:
                "Contoh Rp50.000 membutuhkan saldo Rp65.000.",
            limit:
                "Batas instant maksimal Rp500.000 per hari.",
            automatic:
                "Withdraw diproses otomatis oleh sistem.",
            submit:
                "Withdraw Instant"
        }
    },
    /* =================================================
       PROFILE
    ================================================= */
    profilePage: {
        title:
            "Profile",
        description:
            "Kelola informasi akun Click2Pay kamu.",
        member:
            "Member Click2Pay",
        information: {
            username:
                "Username",
            userId:
                "ID User",
            email:
                "Email",
            balance:
                "Saldo",
            referral:
                "Total Referral",
            referralIncome:
                "Pendapatan Referral",
            status:
                "Status Member",
            joined:
                "Bergabung"
        },
        security: {
            title:
                "Keamanan Akun",
            description:
                "Jangan pernah membagikan password, kode OTP, ataupun data pembayaran kepada siapa pun."
        },
        payment: {
            title:
                "Informasi Pembayaran",
            emptyTitle:
                "Belum ada metode pembayaran",
            emptyDescription:
                "Kamu belum menambahkan Bank atau E-Wallet. Tambahkan metode pembayaran agar dapat menerima penarikan saldo.",
            setup:
                "Atur Pembayaran",
            setupDescription:
                "Tambah Bank atau E-Wallet",
            method:
                "Bank / E-Wallet",
            number:
                "Nomor Rekening / Nomor HP",
            owner:
                "Atas Nama"
        },
        account: {
            title:
                "Manajemen Akun",
            add:
                "Tambah Akun Baru",
            switch:
                "Ganti Akun",
            logout:
                "Keluar",
            delete:
                "Hapus Akun"
        }
    },
    /* =================================================
       REFERRAL
    ================================================= */
    referralPage: {
        title:
            "Referral",
        description:
            "Undang teman & dapatkan bonus",
        program: {
            title:
                "Program Referral",
            share:
                "Bagikan link ke teman",
            register:
                "Teman daftar pakai link kamu",
            bonus:
                "Kamu dapat bonus otomatis",
            balance:
                "Bonus masuk ke saldo"
        },
        code:
            "Kode Referral Kamu",
        copy:
            "Copy",
        stats: {
            total:
                "Total Referral",
            bonus:
                "Bonus Didapat"
        },
        joined:
            "Teman Bergabung",
        dashboard:
            "Dashboard"
    },
    /* =================================================
       SETTINGS
    ================================================= */
    settingsPage: {
        title:
            "Pengaturan",
        description:
            "Kelola akun dan preferensi Click2Pay",
        account: {
            title:
                "Akun",
            profile:
                "Profile",
            profileDescription:
                "Lihat informasi akun",
            payment:
                "Pembayaran",
            paymentDescription:
                "Atur bank / e-wallet untuk withdraw"
        },
        application: {
            title:
                "Aplikasi",
            darkMode:
                "Dark Mode",
            darkModeDescription:
                "Ubah tampilan aplikasi",
            notifications:
                "Notifikasi",
            notificationsDescription:
                "Update transaksi dan informasi",
            language:
                "Bahasa",
            languageDescription:
                "Indonesia"
        },
        security: {
            title:
                "Keamanan",
            changePassword:
                "Ganti Password",
            changePasswordDescription:
                "Ubah password akun"
        },
        accountManagement: {
            title:
                "Manajemen Akun",
            add:
                "Tambah Akun",
            addDescription:
                "Tambah akun Click2Pay lain",
            switch:
                "Ganti Akun",
            switchDescription:
                "Masuk menggunakan akun lain",
            logout:
                "Keluar",
            logoutDescription:
                "Logout akun sekarang",
            delete:
                "Hapus Akun",
            deleteDescription:
                "Hapus akun permanen"
        },
        addAccountProcessing:
            "Add Account sedang dalam pemrosesan"
    },
    /* =================================================
       WITHDRAW
    ================================================= */
    withdrawPage: {
        title:
            "Withdraw",
        description:
            "Tarik pendapatan dari Click2Pay",
        balance:
            "Saldo Kamu",
        information: {
            title:
                "Informasi Withdraw",
            manual:
                "Withdraw manual diproses sesuai antrean admin.",
            instant:
                "Withdraw instan diproses otomatis.",
            minimum:
                "Minimal penarikan Rp10.000.",
            payment:
                "Pastikan data rekening / e-wallet benar."
        },
        type: {
            title:
                "Pilih Jenis Withdraw",
            manual:
                "Manual",
            manualDescription:
                "Menunggu antrean",
            instant:
                "Instan",
            instantDescription:
                "Proses otomatis"
        },
        form: {
            title:
                "Ajukan Withdraw",
            amount:
                "Jumlah Penarikan",
            amountPlaceholder:
                "Minimal Rp10.000",
            method:
                "Metode",
            bank:
                "Transfer Bank",
            dana:
                "Dana",
            ovo:
                "OVO",
            gopay:
                "GoPay",
            target:
                "Nomor Tujuan",
            targetPlaceholder:
                "Nomor rekening / e-wallet",
            submit:
                "Ajukan Withdraw"
        },
        history:
            "Riwayat Withdraw",
        empty:
            "Belum ada riwayat withdraw"
    },
    /* =================================================
       TUTORIAL WITHDRAW
    ================================================= */
    tutorialWithdraw: {
        title:
            "Cara Withdraw Saldo",
        description:
            "Panduan melakukan penarikan pendapatan dari Click2Pay.",
        steps: {
            balance: {
                title:
                    "1. Pastikan Saldo Cukup",
                description:
                    "Pastikan saldo Click2Pay sudah memenuhi minimal penarikan sebelum melakukan withdraw."
            },
            payment: {
                title:
                    "2. Tambahkan Data Pembayaran",
                description:
                    "Masuk ke halaman Payment lalu simpan rekening bank atau e-wallet yang digunakan untuk menerima pembayaran."
            },
            type: {
                title:
                    "3. Pilih Jenis Withdraw",
                description:
                    "Click2Pay menyediakan dua jenis penarikan yaitu Withdraw Normal dan Withdraw Instan."
            },
            verification: {
                title:
                    "4. Proses Verifikasi",
                description:
                    "Request withdraw akan masuk ke sistem dan diproses sesuai metode yang dipilih."
            },
            received: {
                title:
                    "5. Dana Diterima",
                description:
                    "Setelah berhasil diproses, dana akan dikirim ke rekening atau e-wallet tujuan."
            }
        },
        cards: {
            bank:
                "Withdraw Bank",
            bankDescription:
                "Gunakan rekening bank yang valid untuk menerima pembayaran.",
            wallet:
                "Withdraw E-Wallet",
            walletDescription:
                "Mendukung beberapa e-wallet yang tersedia di Click2Pay.",
            status:
                "Status Withdraw",
            statusDescription:
                "Pantau status Pending, Success, atau Failed melalui Payment."
        },
        instant: {
            title:
                "Withdraw Instan",
            description:
                "Withdraw Instan adalah fitur penarikan cepat dengan batas maksimal Rp500.000 per hari.",
            minimum:
                "Minimal saldo harus cukup dengan nominal withdraw + biaya layanan.",
            fee:
                "Biaya layanan Withdraw Instan sebesar Rp15.000 setiap transaksi.",
            example50:
                "Contoh: tarik Rp50.000 membutuhkan saldo Rp65.000.",
            example100:
                "Contoh: tarik Rp100.000 membutuhkan saldo Rp115.000.",
            example250:
                "Contoh: tarik Rp250.000 membutuhkan saldo Rp265.000.",
            dailyLimit:
                "Sisa limit harian akan otomatis berkurang setelah withdraw berhasil.",
            limitReached:
                "Jika limit Rp500.000 sudah habis, Withdraw Instan tidak dapat digunakan sampai hari berikutnya.",
            unavailable:
                "Jika bank atau e-wallet tidak tersedia, gunakan pilihan Bank / E-Wallet Lainnya pada form withdraw."
        },
        tips: {
            title:
                "Tips Withdraw Cepat",
            description:
                "Gunakan data pembayaran yang sesuai dengan nama pemilik akun agar proses verifikasi lebih cepat."
        },
        warning: {
            title:
                "Perhatian",
            description:
                "Kesalahan nomor rekening atau e-wallet dapat menyebabkan pembayaran gagal. Pastikan semua data sudah benar sebelum melakukan withdraw."
        },
        home:
            "Beranda",
        dashboard:
            "Dashboard"
    },
    /* =================================================
       TUTORIAL STATISTICS
    ================================================= */
    tutorialStatistics: {
        title:
            "Cara Melihat Statistik",
        description:
            "Pelajari cara membaca data Views, Click, CPM, dan Pendapatan di Click2Pay.",
        steps: {
            menu: {
                title:
                    "1. Buka Menu Statistik",
                description:
                    "Masuk ke Dashboard Click2Pay kemudian scroll ke bagian Statistik untuk melihat performa link."
            },
            views: {
                title:
                    "2. Memahami Views",
                description:
                    "Views menunjukkan jumlah pengunjung yang membuka shortlink kamu. Semakin banyak pengunjung, semakin besar peluang pendapatan."
            },
            clicks: {
                title:
                    "3. Memahami Click",
                description:
                    "Click menunjukkan jumlah klik valid yang dilakukan oleh pengunjung pada link yang dibuat."
            },
            cpm: {
                title:
                    "4. Memahami CPM",
                description:
                    "CPM adalah nilai pendapatan berdasarkan jumlah tayangan atau kunjungan yang diperoleh."
            },
            earnings: {
                title:
                    "5. Melihat Earnings",
                description:
                    "Bagian Earnings menampilkan total penghasilan yang sudah dikumpulkan dari Ads Link."
            },
            period: {
                title:
                    "6. Pilih Periode Laporan",
                description:
                    "Gunakan pilihan bulan atau periode untuk melihat perkembangan pendapatan berdasarkan waktu tertentu."
            },
            report: {
                title:
                    "7. Cek Detail Report",
                description:
                    "Gunakan tabel laporan harian untuk melihat tanggal, valid views, CPM, dan pendapatan setiap hari."
            }
        },
        tips: {
            title:
                "Tips Membaca Statistik",
            description:
                "Fokus meningkatkan jumlah pengunjung berkualitas. Traffic asli akan menghasilkan performa lebih baik dibanding traffic otomatis."
        },
        security: {
            title:
                "Data Aman",
            description:
                "Statistik dapat berubah mengikuti validasi sistem untuk memastikan data yang dihitung adalah kunjungan asli."
        },
        home:
            "Beranda",
        dashboard:
            "Dashboard"
    },

    sellLinkPage: {
        title: "Sell Link",
        description: "Jual link dan dapatkan penghasilan tambahan.",

        guide: {
            title: "Cara & Kegunaan Sell Link",
            use1: "Sell Link digunakan untuk menjual akses file, produk digital, atau halaman khusus.",
            use2: "Buat link, tentukan harga, lalu bagikan kepada pembeli.",
            use3: "Pembeli dapat memilih Link Buy untuk melakukan pembayaran.",
            use4: "Link Ads digunakan untuk mendapatkan penghasilan tambahan dari pengunjung.",
            use5: "Saldo hasil penjualan masuk otomatis ke akun kamu."
        },

        status: {
            title: "Status Sell Link",
            checking: "Memeriksa status akun...",
            active: "Sell Link Aktif",
            inactive: "Aktifkan Sell Link terlebih dahulu"
        },

        create: {
            title: "Buat Sell Link Baru",
            description: "Masukkan link yang to sell kepada pembeli.",
            linkTitle: "Judul Link",
            linkPlaceholder: "Contoh: Premium File, Course, Template",
            destination: "URL Tujuan",
            destinationPlaceholder: "https://website.com/file",
            price: "Harga Jual",
            pricePlaceholder: "Minimal Rp10.000",
            createButton: "Create Sell Link",
            lockedButton: "Sell Link Terkunci",
            checkingButton: "Memeriksa Status...",
            note: "Pastikan URL tujuan benar dan harga yang ditentukan sudah sesuai sebelum membuat Sell Link."
        },

        stats: {
            totalLink: "Total Sell Link",
            totalPrice: "Total Harga Jual",
            totalView: "Total View",
            totalSold: "Total Terjual",
            totalRevenue: "Total Pendapatan Terjual"
        },

        search: {
            placeholder: "Cari judul atau URL...",
            all: "Semua",
            active: "Aktif",
            inactive: "Nonaktif"
        },

        list: {
            title: "Daftar Sell Link",
            description: "Kelola seluruh Sell Link yang telah Anda buat.",
            emptyTitle: "Belum Ada Sell Link",
            emptyDescription: "Silakan buat Sell Link pertama Anda."
        },

        generated: {
            title: "Link Generated",
            description: "Link Buy dan Link Ads yang berhasil dibuat akan muncul di sini.",
            emptyTitle: "Belum Ada Link",
            emptyDescription: "Setelah membuat Sell Link, Link Buy akan muncul di bagian ini.",
            buyLink: "Buy Link",
            shortCode: "Short Code",
            active: "Link Aktif"
        },

        edit: {
            title: "Edit Sell Link",
            save: "Simpan Perubahan",
            cancel: "Batal"
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
        earnings: "Earnings",
        save: "Save",
        cancel: "Cancel",
        reset: "Reset",
        edit: "Edit",
        delete: "Delete",
        close: "Close",
        back: "Back",
        copy: "Copy",
        search: "Search",
        submit: "Submit",
        confirm: "Confirm",
        yes: "Yes",
        no: "No",
        active: "Active",
        expired: "Expired",
        all: "All",
        success: "Success",
        failed: "Failed",
        pending: "Pending",
        never: "Never"
    },
   /* EN */
list: {
    title: "Sell Link List",
    description: "Manage all your Sell Links.",
    emptyTitle: "No Sell Links Yet",
    emptyDescription: "Create your first Sell Link to get started.",
    loadingDescription: "Please wait a moment."
},
    /* =========================
       LOGIN ACTIVITY
    ========================= */
    loginActivityDescription:
        "History of devices and login times for your account.",
    totalDevice:
        "Total Devices",
    lastLogin:
        "Last Login",
    currentDevice:
        "Current Device",
    loginDevices:
        "Login Devices",
    loadingData:
        "Loading data...",
    /* =========================
       DASHBOARD
    ========================= */
    dashboard: {
        title:
            "Click2Pay Dashboard",
        notice:
            "If you don't know how to use it yet, please click the guide below. To activate Sell Link, you can upgrade to Premium or contact the admin.",
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
        market: {
            title:
                "Global CPM Market",
            loading:
                "Loading country CPM..."
        },
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
        statistics: {
            ads:
                "Ads Statistics",
            sell:
                "Sell Link Statistics",
            timezone:
                "Report based on Asia/Jakarta time."
        },
        dailyAds: {
            title:
                "Daily Ads Link Report",
            empty:
                "No ADS report data yet."
        },
        dailySell: {
            title:
                "Daily Sell Link Report",
            empty:
                "No SELL report available yet."
        },
        announcement: {
            title:
                "Admin Announcement",
            empty:
                "No announcements yet."
        }
    },
    /* =================================================
       CREATE LINK ADS
    ================================================= */
    createAds: {
        title:
            "Create Link Ads",
        description:
            "Create an advertising shortlink and earn from valid traffic.",
        information: {
            title:
                "Ads Link Information",
            validUrl:
                "Use a valid destination URL.",
            automatic:
                "The shortlink is created automatically by the system.",
            manage:
                "Links can be copied, edited, and deleted at any time.",
            statistics:
                "View, Click, and Earnings statistics are updated automatically."
        },
        form: {
            title:
                "Create New Ads Link",
            description:
                "Enter the destination URL you want to monetize.",
            linkName:
                "Link Name",
            linkNamePlaceholder:
                "Example: Product Promotion",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            create:
                "Create Ads Link",
            reset:
                "Reset",
            note:
                "Make sure the destination URL is safe and correct."
        },
        stats: {
            totalLink:
                "Total Ads Links",
            totalView:
                "Total Views",
            totalClick:
                "Total Clicks",
            totalEarning:
                "Total Earnings"
        },
        search:
            "Search link name or URL...",
        filters: {
            all:
                "All",
            active:
                "Active",
            expired:
                "Expired"
        },
        tips: {
            title:
                "Tips",
            description:
                "Share your Ads Link through social media, websites, or communities. Use quality traffic to keep CPM optimal."
        },
        list: {
            title:
                "Ads Link List",
            description:
                "Manage all your advertising shortlinks.",
            dashboard:
                "Dashboard"
        },
        edit: {
            title:
                "Edit Ads Link",
            description:
                "Update the link name and destination.",
            linkName:
                "Link Name",
            linkNamePlaceholder:
                "Example: Product Promotion",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            save:
                "Save Changes",
            cancel:
                "Cancel"
        }
    },
    /* =================================================
       EDIT PROFILE
    ================================================= */
    editProfile: {
        title:
            "Edit Profile",
        description:
            "Update your Click2Pay account information.",
        editUsername: {
            title:
                "Edit Username",
            description:
                "Update your Click2Pay account username.",
            label:
                "New Username",
            placeholder:
                "Enter your new username",
            save:
                "Save Changes"
        },
        information: {
            title:
                "Username Information",
            description:
                "Your username is used as your Click2Pay account identity. Use a unique and easy-to-remember username. Username changes will be saved automatically to your account."
        }
    },
    /* =================================================
       MY LINK
    ================================================= */
    myLinkPage: {
        title:
            "My Link",
        description:
            "Manage all Smart Links, Ads Links, and Sell Links.",
        information: {
            title:
                "Smart Link Management",
            smart:
                "Create short links using the Ads Link system.",
            statistics:
                "Monitor views, clicks, and earnings in real time.",
            advanced:
                "Use Advanced Settings for a Custom Alias.",
            quality:
                "High-quality links can achieve better performance.",
            sell:
                "Sell Link becomes available after your account meets the requirements."
        },
        create: {
            title:
                "Create New Smart Link",
            description:
                "Turn a regular URL into a smart Click2Pay link.",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://your-website.com",
            linkType:
                "Link Type",
            ads:
                "Ads Link",
            sell:
                "Sell Link 🔒",
            sellLocked:
                "Sell Link is not active yet.",
            preview:
                "Smart Link Preview",
            previewEmpty:
                "Link will be created automatically",
            create:
                "Create Smart Link",
            advanced:
                "Advanced"
        },
        stats: {
            total:
                "Total Links",
            views:
                "Total Views",
            clicks:
                "Total Clicks",
            earnings:
                "Total Earnings",
            adsLink:
                "Ads Links",
            adsViews:
                "Ads Views",
            sellLink:
                "Sell Links",
            sellRevenue:
                "Sell Revenue"
        },
        filters: {
            all:
                "All",
            ads:
                "Ads Link",
            sell:
                "Sell Link"
        },
        search:
            "Search title or URL...",
        tips:
            "Optimize quality traffic to increase Ads Link and Sell Link revenue.",
        panels: {
            smart:
                "Smart Link",
            sell:
                "Sell Link",
            ads:
                "Ads Link",
            link:
                "Link"
        },
        edit: {
            title:
                "Edit Smart Link",
            linkTitle:
                "Link Title",
            linkTitlePlaceholder:
                "Smart Link Title",
            destination:
                "Destination URL",
            destinationPlaceholder:
                "https://example.com",
            save:
                "Save",
            cancel:
                "Cancel"
        },
        advanced: {
            title:
                "Advanced Settings",
            description:
                "Additional settings for Smart Link.",
            customAlias:
                "Custom Alias",
            customAliasPlaceholder:
                "example: july-promo",
            expired:
                "Expired Link",
            never:
                "Never",
            oneDay:
                "1 Day",
            sevenDays:
                "7 Days",
            thirtyDays:
                "30 Days",
            campaign:
                "Campaign",
            campaignPlaceholder:
                "Campaign Name",
            targetDevice:
                "Target Device",
            allDevice:
                "All Devices",
            android:
                "Android",
            ios:
                "iPhone / iOS",
            desktop:
                "Desktop",
            save:
                "Save Settings",
            note:
                "These settings will be used when creating a new Smart Link."
        }
    },
    /* =================================================
       PAYMENT
    ================================================= */
    paymentPage: {
        title:
            "Payment",
        description:
            "Manage your balance and withdraw funds through Click2Pay.",
        serviceChecking:
            "Checking withdrawal service...",
        stats: {
            balance:
                "Current Balance",
            adsBalance:
                "Ads Balance",
            sellBalance:
                "Sell Link Balance",
            success:
                "WD Success",
            pending:
                "WD Pending",
            failed:
                "WD Failed"
        },
        warning: {
            title:
                "Payment account not saved",
            description:
                "Please save your payment account before making a withdrawal.",
            paymentSetting:
                "Payment Setting"
        },
        actions: {
            request:
                "Request Withdraw",
            history:
                "WD Transactions"
        },
        information: {
            title:
                "Withdrawal Information",
            days:
                "Withdrawal service is available Monday - Friday.",
            hours:
                "Withdrawal operating hours: 08:00 - 18:00 WIB.",
            weekend:
                "Withdrawal service is automatically closed on Saturday and Sunday.",
            account:
                "Make sure your payment account is saved in Payment Setting.",
            responsibility:
                "Incorrect bank or e-wallet information is the user's responsibility.",
            manual:
                "Manual withdrawals will enter Pending status before being processed by admin.",
            instant:
                "Instant withdrawals are processed automatically when the service is available.",
            success:
                "Successful withdrawals will appear in WD Transactions."
        },
        manual: {
            title:
                "Manual Withdraw",
            description:
                "Withdraw your balance using the payment account saved in Payment Setting.",
            amount:
                "Withdrawal Amount",
            placeholder:
                "Minimum Rp100,000",
            rules:
                "Manual Withdrawal Rules",
            minimum:
                "Minimum withdrawal is Rp100,000.",
            deducted:
                "Your balance will be deducted after the request succeeds.",
            pending:
                "The initial withdrawal status is Pending.",
            admin:
                "Admin will review the request before payment.",
            success:
                "If successful, the status will change to Success.",
            failed:
                "If failed, the status will change to Failed.",
            submit:
                "Request Manual Withdraw"
        },
        instant: {
            title:
                "Instant Withdraw",
            description:
                "Withdraw your balance automatically with a maximum limit according to system rules.",
            dailyLimit:
                "Today's Instant Limit",
            amount:
                "Withdrawal Amount",
            fee:
                "Instant service fee is Rp15,000.",
            balance:
                "Your balance must cover the withdrawal amount + fee.",
            example:
                "Example: Rp50,000 withdrawal requires Rp65,000 balance.",
            limit:
                "Maximum instant withdrawal is Rp500,000 per day.",
            automatic:
                "Withdrawal is processed automatically by the system.",
            submit:
                "Instant Withdraw"
        }
    },
    /* =================================================
       PROFILE
    ================================================= */
    profilePage: {
        title:
            "Profile",
        description:
            "Manage your Click2Pay account information.",
        member:
            "Click2Pay Member",
        information: {
            username:
                "Username",
            userId:
                "User ID",
            email:
                "Email",
            balance:
                "Balance",
            referral:
                "Total Referrals",
            referralIncome:
                "Referral Earnings",
            status:
                "Member Status",
            joined:
                "Joined"
        },
        security: {
            title:
                "Account Security",
            description:
                "Never share your password, OTP code, or payment information with anyone."
        },
        payment: {
            title:
                "Payment Information",
            emptyTitle:
                "No payment method added",
            emptyDescription:
                "You have not added a bank account or e-wallet. Add a payment method to receive withdrawals.",
            setup:
                "Set Up Payment",
            setupDescription:
                "Add Bank or E-Wallet",
            method:
                "Bank / E-Wallet",
            number:
                "Account Number / Phone Number",
            owner:
                "Account Holder"
        },
        account: {
            title:
                "Account Management",
            add:
                "Add New Account",
            switch:
                "Switch Account",
            logout:
                "Logout",
            delete:
                "Delete Account"
        }
    },
    /* =================================================
       REFERRAL
    ================================================= */
    referralPage: {
        title:
            "Referral",
        description:
            "Invite friends & earn bonuses",
        program: {
            title:
                "Referral Program",
            share:
                "Share your link with friends",
            register:
                "Friends register using your link",
            bonus:
                "You receive an automatic bonus",
            balance:
                "Bonus is added to your balance"
        },
        code:
            "Your Referral Code",
        copy:
            "Copy",
        stats: {
            total:
                "Total Referrals",
            bonus:
                "Bonus Earned"
        },
        joined:
            "Friends Joined",
        dashboard:
            "Dashboard"
    },
    /* =================================================
       SETTINGS
    ================================================= */
    settingsPage: {
        title:
            "Settings",
        description:
            "Manage your Click2Pay account and preferences.",
        account: {
            title:
                "Account",
            profile:
                "Profile",
            profileDescription:
                "View account information",
            payment:
                "Payment",
            paymentDescription:
                "Manage bank / e-wallet for withdrawals"
        },
        application: {
            title:
                "Application",
            darkMode:
                "Dark Mode",
            darkModeDescription:
                "Change application appearance",
            notifications:
                "Notifications",
            notificationsDescription:
                "Transaction and information updates",
            language:
                "Language",
            languageDescription:
                "English"
        },
        security: {
            title:
                "Security",
            changePassword:
                "Change Password",
            changePasswordDescription:
                "Change your account password"
        },
        accountManagement: {
            title:
                "Account Management",
            add:
                "Add Account",
            addDescription:
                "Add another Click2Pay account",
            switch:
                "Switch Account",
            switchDescription:
                "Sign in using another account",
            logout:
                "Logout",
            logoutDescription:
                "Logout from the current account",
            delete:
                "Delete Account",
            deleteDescription:
                "Permanently delete your account"
        },
        addAccountProcessing:
            "Add Account is currently being processed"
    },
    /* =================================================
       WITHDRAW
    ================================================= */
    withdrawPage: {
        title:
            "Withdraw",
        description:
            "Withdraw your earnings from Click2Pay",
        balance:
            "Your Balance",
        information: {
            title:
                "Withdrawal Information",
            manual:
                "Manual withdrawals are processed according to the admin queue.",
            instant:
                "Instant withdrawals are processed automatically.",
            minimum:
                "Minimum withdrawal is Rp10,000.",
            payment:
                "Make sure your bank / e-wallet information is correct."
        },
        type: {
            title:
                "Choose Withdrawal Type",
            manual:
                "Manual",
            manualDescription:
                "Waiting in queue",
            instant:
                "Instant",
            instantDescription:
                "Automatic processing"
        },
        form: {
            title:
                "Request Withdraw",
            amount:
                "Withdrawal Amount",
            amountPlaceholder:
                "Minimum Rp10,000",
            method:
                "Method",
            bank:
                "Bank Transfer",
            dana:
                "Dana",
            ovo:
                "OVO",
            gopay:
                "GoPay",
            target:
                "Destination Number",
            targetPlaceholder:
                "Bank account / e-wallet number",
            submit:
                "Request Withdraw"
        },
        history:
            "Withdrawal History",
        empty:
            "No withdrawal history yet"
    },
    /* =================================================
       TUTORIAL WITHDRAW
    ================================================= */
    tutorialWithdraw: {
        title:
            "How to Withdraw Your Balance",
        description:
            "Guide to withdrawing your earnings from Click2Pay.",
        steps: {
            balance: {
                title:
                    "1. Make Sure Your Balance Is Sufficient",
                description:
                    "Make sure your Click2Pay balance meets the minimum withdrawal amount before requesting a withdrawal."
            },
            payment: {
                title:
                    "2. Add Payment Information",
                description:
                    "Open the Payment page and save the bank account or e-wallet you want to use to receive payments."
            },
            type: {
                title:
                    "3. Choose Withdrawal Type",
                description:
                    "Click2Pay provides two withdrawal methods: Normal Withdrawal and Instant Withdrawal."
            },
            verification: {
                title:
                    "4. Verification Process",
                description:
                    "Your withdrawal request will enter the system and be processed according to the selected method."
            },
            received: {
                title:
                    "5. Receive Your Funds",
                description:
                    "Once processed successfully, the funds will be sent to your bank account or e-wallet."
            }
        },
        cards: {
            bank:
                "Bank Withdrawal",
            bankDescription:
                "Use a valid bank account to receive your payment.",
            wallet:
                "E-Wallet Withdrawal",
            walletDescription:
                "Supports several e-wallets available on Click2Pay.",
            status:
                "Withdrawal Status",
            statusDescription:
                "Monitor Pending, Success, or Failed status through Payment."
        },
        instant: {
            title:
                "Instant Withdrawal",
            description:
                "Instant Withdrawal is a fast withdrawal feature with a maximum limit of Rp500,000 per day.",
            minimum:
                "Your balance must cover the withdrawal amount + service fee.",
            fee:
                "Instant Withdrawal service fee is Rp15,000 per transaction.",
            example50:
                "Example: Rp50,000 withdrawal requires Rp65,000 balance.",
            example100:
                "Example: Rp100,000 withdrawal requires Rp115,000 balance.",
            example250:
                "Example: Rp250,000 withdrawal requires Rp265,000 balance.",
            dailyLimit:
                "The remaining daily limit will automatically decrease after a successful withdrawal.",
            limitReached:
                "If the Rp500,000 limit has been used, Instant Withdrawal cannot be used until the next day.",
            unavailable:
                "If a bank or e-wallet is unavailable, use the Bank / Other E-Wallet option in the withdrawal form."
        },
        tips: {
            title:
                "Tips for Faster Withdrawals",
            description:
                "Use payment information that matches the account owner's name to speed up verification."
        },
        warning: {
            title:
                "Important",
            description:
                "Incorrect bank account or e-wallet information may cause payment failure. Make sure all information is correct before requesting a withdrawal."
        },
        home:
            "Home",
        dashboard:
            "Dashboard"
    },
    /* =================================================
       TUTORIAL STATISTICS
    ================================================= */
    tutorialStatistics: {
        title:
            "How to View Statistics",
        description:
            "Learn how to read Views, Clicks, CPM, and Earnings data on Click2Pay.",
        steps: {
            menu: {
                title:
                    "1. Open the Statistics Menu",
                description:
                    "Open the Click2Pay Dashboard and scroll to the Statistics section to view your link performance."
            },
            views: {
                title:
                    "2. Understanding Views",
                description:
                    "Views show the number of visitors who opened your shortlink. More visitors create more earning opportunities."
            },
            clicks: {
                title:
                    "3. Understanding Clicks",
                description:
                    "Clicks show the number of valid clicks made by visitors on your links."
            },
            cpm: {
                title:
                    "4. Understanding CPM",
                description:
                    "CPM represents the revenue value based on the number of impressions or visits received."
            },
            earnings: {
                title:
                    "5. Viewing Earnings",
                description:
                    "The Earnings section shows the total income collected from Ads Links."
            },
            period: {
                title:
                    "6. Select Report Period",
                description:
                    "Use the month or period selector to view revenue performance for a specific period."
            },
            report: {
                title:
                    "7. Check Detailed Reports",
                description:
                    "Use the daily report table to view the date, valid views, CPM, and earnings for each day."
            }
        },
        tips: {
            title:
                "Tips for Reading Statistics",
            description:
                "Focus on increasing quality visitors. Genuine traffic will perform better than automated traffic."
        },
        security: {
            title:
                "Data Security",
            description:
                "Statistics may change according to system validation to ensure that counted data represents genuine visits."
        },
        home:
            "Home",
        dashboard:
            "Dashboard"
    },

    sellLinkPage: {
        title: "Sell Link",
        description: "Sell your links and earn extra income.",

        guide: {
            title: "Sell Link Guide & Benefits",
            use1: "Sell Links are used to sell access to files, digital products, or exclusive pages.",
            use2: "Create a link, set a price, and share it with buyers.",
            use3: "Buyers can use the Buy Link to complete their payment.",
            use4: "Ads Links can generate additional income from visitors.",
            use5: "Your sales earnings are automatically added to your account balance."
        },

        status: {
            title: "Sell Link Status",
            checking: "Checking account status...",
            active: "Sell Link Active",
            inactive: "Activate Sell Link first"
        },

        create: {
            title: "Create New Sell Link",
            description: "Enter the link you want to sell.",
            linkTitle: "Link Title",
            linkPlaceholder: "Example: Premium File, Course, Template",
            destination: "Destination URL",
            destinationPlaceholder: "https://website.com/file",
            price: "Selling Price",
            pricePlaceholder: "Minimum Rp10,000",
            createButton: "Create Sell Link",
            lockedButton: "Sell Link Locked",
            checkingButton: "Checking Status...",
            note: "Make sure the destination URL and selling price are correct before creating a Sell Link."
        },

        stats: {
            totalLink: "Total Sell Links",
            totalPrice: "Total Selling Price",
            totalView: "Total Views",
            totalSold: "Total Sold",
            totalRevenue: "Total Sales Revenue"
        },

        search: {
            placeholder: "Search title or URL...",
            all: "All",
            active: "Active",
            inactive: "Inactive"
        },

        list: {
            title: "Sell Link List",
            description: "Manage all your Sell Links.",
            emptyTitle: "No Sell Links Yet",
            emptyDescription: "Create your first Sell Link to get started."
        },

        generated: {
            title: "Generated Links",
            description: "Your Buy Link and Ads Link will appear here after creation.",
            emptyTitle: "No Links Yet",
            emptyDescription: "Once you create a Sell Link, the Buy Link will appear here.",
            buyLink: "Buy Link",
            shortCode: "Short Code",
            active: "Link Active"
        },

        edit: {
            title: "Edit Sell Link",
            save: "Save Changes",
            cancel: "Cancel"
        }
    }

}
}
};

/* =====================================================
GET NESTED TRANSLATION
===================================================== */

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

/* =====================================================
GET CURRENT LANGUAGE
===================================================== */

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
return "en";

}

/* =====================================================
APPLY LANGUAGE
===================================================== */

function applyLanguage(
language = getLanguage()
){

if(
    !translations[language]
){
    language = "en";
}
const data =
    translations[language];
/* =========================
   TEXT
========================= */
document
    .querySelectorAll(
        "[data-i18n]"
    )
    .forEach(
        function(element){
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
        }
    );
/* =========================
   PLACEHOLDER
========================= */
document
    .querySelectorAll(
        "[data-i18n-placeholder]"
    )
    .forEach(
        function(element){
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
        }
    );
/* =========================
   TITLE
========================= */
document
    .querySelectorAll(
        "[data-i18n-title]"
    )
    .forEach(
        function(element){
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
        }
    );
/* =========================
   LANGUAGE SELECTOR
========================= */
const selector =
    document.getElementById(
        "languageSelect"
    );
if(selector){
    selector.value =
        language;
}
/* =========================
   SAVE LANGUAGE
========================= */
localStorage.setItem(
    "language",
    language
);
/* =========================
   HTML LANG
========================= */
document.documentElement
    .setAttribute(
        "lang",
        language
    );
/* =========================
   LANGUAGE EVENT
========================= */
document.dispatchEvent(
    new CustomEvent(
        "languageChanged",
        {
            detail: {
                language: language
            }
        }
    )
);

}

/* =====================================================
CHANGE LANGUAGE
===================================================== */

function setLanguage(
language
){

if(
    !translations[language]
){
    language = "en";
}
applyLanguage(
    language
);

}

/* =====================================================
INITIALIZE LANGUAGE SELECTOR
===================================================== */

function initLanguageSelector(){

const selector =
    document.getElementById(
        "languageSelect"
    );
if(!selector){
    return false;
}
selector.value =
    getLanguage();
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

/* =====================================================
INITIALIZE LANGUAGE
===================================================== */

function initLanguage(){

initLanguageSelector();
applyLanguage();

}

/* =====================================================
REFRESH LANGUAGE
===================================================== */

function refreshLanguage(){

initLanguageSelector();
applyLanguage();

}

/* =====================================================
DOM READY
===================================================== */

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

/* =====================================================
GLOBAL API
===================================================== */

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

/* =====================================================
COMPATIBILITY
===================================================== */

window.applyLanguage =
applyLanguage;

})();