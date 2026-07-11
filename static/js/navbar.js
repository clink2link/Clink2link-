/* ==========================================
   CLICK2PAY NAVBAR
========================================== */

const body = document.body;

const sidebar = document.getElementById("sidebar");

const overlay = document.getElementById("overlay");

const menuToggle = document.getElementById("menuToggle");

const themeToggle = document.getElementById("themeToggle");

/* ==========================================
   SIDEBAR
========================================== */

menuToggle.addEventListener("click", () => {

    if (window.innerWidth <= 991) {

        sidebar.classList.toggle("show");
        overlay.classList.toggle("show");

    } else {

        sidebar.classList.toggle("collapsed");

    }

});

/* ==========================================
   OVERLAY
========================================== */

overlay.addEventListener("click", () => {

    sidebar.classList.remove("show");

    overlay.classList.remove("show");

});

/* ==========================================
   DROPDOWN
========================================== */

document.querySelectorAll(".dropdown-btn").forEach(btn => {

    btn.addEventListener("click", function () {

        this.parentElement.classList.toggle("active");

    });

});

/* ==========================================
   DARK MODE
========================================== */

if (localStorage.getItem("theme") === "dark") {

    body.classList.add("dark");

    themeToggle.innerHTML =
        '<i class="fa-solid fa-sun"></i>';

}

themeToggle.addEventListener("click", () => {

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

});

/* ==========================================
   CLOSE SIDEBAR ON MOBILE
========================================== */

document.querySelectorAll(".sidebar a").forEach(link => {

    link.addEventListener("click", () => {

        if (window.innerWidth <= 991) {

            sidebar.classList.remove("show");

            overlay.classList.remove("show");

        }

    });

});

/* ==========================================
   RESIZE
========================================== */

window.addEventListener("resize", () => {

    if (window.innerWidth > 991) {

        sidebar.classList.remove("show");

        overlay.classList.remove("show");

    }

});
