async function loadComponent(id, url) {

    const res = await fetch(url);

    if (!res.ok) {
        console.error("Gagal memuat:", url);
        return;
    }

    document.getElementById(id).innerHTML = await res.text();

    if (id === "navbar") {

        const script = document.createElement("script");
        script.src = "/static/js/navbar.js";
        document.body.appendChild(script);

    }

}

window.addEventListener("DOMContentLoaded", async () => {

    await loadComponent("navbar", "/static/components/navbar.html");

    await loadComponent("footer", "/static/components/footer.html");

});
