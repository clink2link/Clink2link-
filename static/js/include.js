/* ==========================================
   CLICK2PAY COMPONENT LOADER
========================================== */

async function loadComponent(id, url) {

    const element = document.getElementById(id);

    if (!element) return;

    try {

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(`Failed to load ${url}`);

        }

        element.innerHTML = await response.text();

        // Inisialisasi navbar setelah HTML selesai dimuat
        if (id === "navbar") {

            if (typeof initNavbar === "function") {

                initNavbar();

            } else {

                console.warn("initNavbar() tidak ditemukan.");

            }

        }

    } catch (err) {

        console.error(err);

        element.innerHTML = `
            <div style="padding:20px;color:#ef4444;text-align:center">
                Failed to load ${url}
            </div>
        `;

    }

}

/* ==========================================
   LOAD COMPONENTS
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    await Promise.all([

        loadComponent("navbar", "/static/components/navbar.html"),

        loadComponent("footer", "/static/components/footer.html")

    ]);

});
