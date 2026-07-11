/* ==========================================
   CLICK2PAY COMPONENT LOADER
========================================== */

async function loadComponent(id, url) {

    const element = document.getElementById(id);

    if (!element) return;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load " + url);
        }

        const html = await response.text();

        element.innerHTML = html;

        // Jalankan navbar setelah HTML selesai dimuat
        if (id === "navbar" && typeof initNavbar === "function") {

            initNavbar();

        }

    } catch (error) {

        console.error(error);

    }

}

/* ==========================================
   LOAD COMPONENTS
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadComponent("navbar", "/static/components/navbar.html");

    loadComponent("footer", "/static/components/footer.html");

});
