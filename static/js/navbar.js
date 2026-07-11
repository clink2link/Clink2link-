/* ==========================================
   CLICK2PAY NAVBAR
========================================== */

function initNavbar() {

    const body = document.body;

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const menuToggle = document.getElementById("menuToggle");
    const themeToggle = document.getElementById("themeToggle");

    if (!sidebar || !overlay || !menuToggle || !themeToggle) {
        return;
    }

    /* ==========================
       MENU
    ========================== */

    menuToggle.onclick = () => {

        if (window.innerWidth <= 991) {

            sidebar.classList.toggle("show");
            overlay.classList.toggle("show");

        } else {

            sidebar.classList.toggle("collapsed");

        }

    };

    /* ==========================
       OVERLAY
    ========================== */

    overlay.onclick = () => {

        sidebar.classList.remove("show");
        overlay.classList.remove("show");

    };

    /* ==========================
       DROPDOWN
    ========================== */

    document.querySelectorAll(".dropdown-btn").forEach(btn => {

        btn.onclick = function () {

            this.parentElement.classList.toggle("active");

        };

    });

    /* ==========================
       CLOSE MOBILE
    ========================== */

    document.querySelectorAll(".sidebar a").forEach(link => {

        link.onclick = () => {

            if (window.innerWidth <= 991) {

                sidebar.classList.remove("show");
                overlay.classList.remove("show");

            }

        };

    });

    /* ==========================
       DARK MODE
    ========================== */

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {

        body.classList.add("dark");

        themeToggle.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    }

    themeToggle.onclick = () => {

        body.classList.toggle("dark");

        if (body.classList.contains("dark")) {

            localStorage.setItem("theme", "dark");

            themeToggle.innerHTML =
                '<i class="fa-solid fa-sun"></i>';

        } else {

            localStorage.setItem("theme", "light");

            themeToggle.innerHTML =
                '<i class="fa-solid fa-moon"></i>';

        }

    };

    /* ==========================
       ACTIVE MENU
    ========================== */

    const current = location.pathname.split("/").pop();

    document.querySelectorAll(".sidebar a").forEach(link => {

        const href = link.getAttribute("href");

        if (!href) return;

        if (href.endsWith(current)) {

            link.classList.add("active");

            const dropdown = link.closest(".dropdown");

            if (dropdown) {

                dropdown.classList.add("active");

            }

        }

    });

    /* ==========================
       RESIZE
    ========================== */

    window.onresize = () => {

        if (window.innerWidth > 991) {

            sidebar.classList.remove("show");
            overlay.classList.remove("show");

        }

    };

}
