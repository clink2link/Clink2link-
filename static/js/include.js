async function loadComponent(id, path) {
    const res = await fetch(path);

    if (!res.ok) {
        console.error("Gagal memuat:", path);
        return;
    }

    document.getElementById(id).innerHTML = await res.text();

    // Jalankan navbar.js setelah navbar selesai dimuat
    if (id === "navbar") {
        const script = document.createElement("script");
        script.src = "/static/js/navbar.js";
        document.body.appendChild(script);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("navbar", "/templates/components/navbar.html");
    await loadComponent("footer", "/templates/components/footer.html");
});
