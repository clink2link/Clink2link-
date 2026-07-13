/* ==========================================================
   CREATE LINK
========================================================== */

let allLinks = [];
let filteredLinks = [];

const linkList = document.getElementById("linkList");

const totalLink = document.getElementById("totalLink");
const totalView = document.getElementById("totalView");
const totalClick = document.getElementById("totalClick");
const totalEarning = document.getElementById("totalEarning");

/* ==========================================================
   LOAD USER
========================================================== */

async function getCurrentUser(){

    try{

        const user = await database.getUser();

        if(!user){

            location.replace("index.html");
            return null;

        }

        return user;

    }catch(err){

        console.error(err);

        location.replace("index.html");

        return null;

    }

}

/* ==========================================================
   LOAD LINKS
========================================================== */

async function loadLinks(){

    try{

        const user = await getCurrentUser();

        if(!user) return;

        allLinks = await database.getLinks(user.id);

        filteredLinks = [...allLinks];

        updateStats();

        renderLinks();

    }catch(err){

        console.error(err);

        linkList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-circle-exclamation"></i>
            <h3>Gagal Memuat Data</h3>
            <p>${err.message}</p>
        </div>
        `;

    }

}

/* ==========================================================
   UPDATE STATS
========================================================== */

function updateStats(){

    totalLink.textContent = allLinks.length;

    let views = 0;
    let clicks = 0;
    let earnings = 0;

    allLinks.forEach(link=>{

        views += Number(link.total_views || 0);
        clicks += Number(link.total_clicks || 0);
        earnings += Number(link.total_earnings || 0);

    });

    totalView.textContent = views.toLocaleString();

    totalClick.textContent = clicks.toLocaleString();

    totalEarning.textContent =
    "Rp " + earnings.toLocaleString("id-ID");

}

/* ==========================================================
   CREATE LINK
========================================================== */

const createForm = document.getElementById("createForm");

if(createForm){

createForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    const name =
    document.getElementById("linkName").value.trim();

    const url =
    document.getElementById("linkUrl").value.trim();

    const type =
    document.getElementById("linkType").value;

    if(name===""){

        alert("Masukkan Nama Link.");

        return;

    }

    if(url===""){

        alert("Masukkan URL.");

        return;

    }

    try{

        const user =
        await getCurrentUser();

        if(!user) return;

        const code =
        Math.random()
        .toString(36)
        .substring(2,8);

        const payload={

            user_id:user.id,

            title:name,

            url:url,

            type:type,

            short_url:
            "https://click2pay.id/"+code,

            total_views:0,

            total_clicks:0,

            total_earnings:0,

            created_at:
            new Date().toISOString()

        };

        await database.createLink(payload);

        createForm.reset();

        alert("Link berhasil dibuat.");

        loadLinks();

    }catch(err){

        console.error(err);

        alert("Gagal membuat link.");

    }

});

}

/* ==========================================================
   AUTO LOAD
========================================================== */

window.addEventListener("load",()=>{

    loadLinks();

});


// ======================================================
// LOAD LINK
// ======================================================

async function loadLinks() {

    try {

        const user = await database.getUser();

        if (!user) {

            location.href = "index.html";
            return;

        }

        allLinks = await database.getLinks(user.id);
        filteredLinks = [...allLinks];

        updateStats();
        renderLinks();

    } catch (err) {

        console.error(err);

        linkList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-circle-xmark"></i>
            <h3>Gagal Memuat Data</h3>
            <p>${err.message}</p>
        </div>
        `;

    }

}

// ======================================================
// UPDATE STATS
// ======================================================

function updateStats() {

    totalLink.textContent = allLinks.length;

    const views = allLinks.reduce(
        (a, b) => a + (b.total_views || 0),
        0
    );

    const clicks = allLinks.reduce(
        (a, b) => a + (b.total_clicks || 0),
        0
    );

    const earning = allLinks.reduce(
        (a, b) => a + Number(b.total_earnings || 0),
        0
    );

    totalView.textContent = views.toLocaleString();

    totalClick.textContent = clicks.toLocaleString();

    totalEarning.textContent =
        "Rp " + earning.toLocaleString("id-ID");

}

// ======================================================
// RENDER LINK
// ======================================================

function renderLinks() {

    if (!filteredLinks.length) {

        linkList.innerHTML = `
        <div class="empty">

            <i class="fa-solid fa-link-slash"></i>

            <h3>Belum Ada Link</h3>

            <p>Silakan buat Link Ads pertama Anda.</p>

        </div>
        `;

        return;

    }

    linkList.innerHTML = filteredLinks.map(link => `

<div class="link-card">

<div class="link-top">

<div class="link-left">

<div class="link-title">
${link.title || "Tanpa Judul"}
</div>

<div class="link-url">
${link.short_url}
</div>

</div>

<div class="link-type ${link.type}">
${link.type.toUpperCase()}
</div>

</div>

<div class="link-stats">

<div class="link-stat">

<h5>View</h5>

<span>
${link.total_views || 0}
</span>

</div>

<div class="link-stat">

<h5>Click</h5>

<span>
${link.total_clicks || 0}
</span>

</div>

<div class="link-stat">

<h5>Earning</h5>

<span>

Rp${Number(
link.total_earnings || 0
).toLocaleString("id-ID")}

</span>

</div>

<div class="link-stat">

<h5>Status</h5>

<span class="${link.active ? "status-success" : "status-danger"}">

${link.active ? "Aktif" : "Nonaktif"}

</span>

</div>

</div>

<div class="link-actions">

<button
class="copy-btn"
onclick="copyLink('${link.short_url}')">

<i class="fa-solid fa-copy"></i>

Copy

</button>

<button
class="edit-btn"
onclick="editLink('${link.id}')">

<i class="fa-solid fa-pen"></i>

Edit

</button>

<button
class="delete-btn"
onclick="deleteLink('${link.id}')">

<i class="fa-solid fa-trash"></i>

Hapus

</button>

</div>

</div>

`).join("");

}

// ======================================================
// SEARCH
// ======================================================

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {

    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    filteredLinks = allLinks.filter(link => {

        return (
            (link.title || "")
                .toLowerCase()
                .includes(keyword) ||

            (link.url || "")
                .toLowerCase()
                .includes(keyword) ||

            (link.short_url || "")
                .toLowerCase()
                .includes(keyword)
        );

    });

    renderLinks();

});

// ======================================================
// FILTER
// ======================================================

document.querySelectorAll(".link-filter button")
.forEach(button => {

    button.onclick = () => {

        document
            .querySelectorAll(".link-filter button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        const type = button.dataset.filter;

        if (type === "all") {

            filteredLinks = [...allLinks];

        } else {

            filteredLinks = allLinks.filter(link =>
                link.type === type
            );

        }

        renderLinks();

    };

});

// ======================================================
// CREATE LINK
// ======================================================

const createForm = document.getElementById("createForm");

createForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const title = document
        .getElementById("linkName")
        .value
        .trim();

    const url = document
        .getElementById("linkUrl")
        .value
        .trim();

    const type = document
        .getElementById("linkType")
        .value;

    if (!title || !url) {

        alert("Lengkapi semua data.");
        return;

    }

    try {

        const user = await database.getUser();

        if (!user) {

            location.href = "index.html";
            return;

        }

        const code = Math.random()
            .toString(36)
            .substring(2, 8);

        await database.createLink({

            user_id: user.id,

            title,

            url,

            type,

            short_url:
                "https://click2pay.id/" + code,

            total_views: 0,

            total_clicks: 0,

            total_earnings: 0,

            active: true,

            created_at: new Date().toISOString()

        });

        createForm.reset();

        await loadLinks();

        alert("Link berhasil dibuat.");

    } catch (err) {

        console.error(err);

        alert("Gagal membuat link.");

    }

});

// ======================================================
// COPY LINK
// ======================================================

async function copyLink(url) {

    try {

        await navigator.clipboard.writeText(url);

        alert("Link berhasil disalin.");

    } catch (err) {

        const input = document.createElement("input");

        input.value = url;

        document.body.appendChild(input);

        input.select();

        document.execCommand("copy");

        input.remove();

        alert("Link berhasil disalin.");

    }

}

// ======================================================
// EDIT LINK
// ======================================================

async function editLink(id) {

    const link = allLinks.find(item => item.id == id);

    if (!link) return;

    const title = prompt("Nama Link", link.title);

    if (title === null) return;

    const url = prompt("URL Tujuan", link.url);

    if (url === null) return;

    try {

        await database.updateLink(id, {

            title,
            url

        });

        await loadLinks();

        alert("Link berhasil diperbarui.");

    } catch (err) {

        console.error(err);

        alert("Gagal mengubah link.");

    }

}

// ======================================================
// DELETE LINK
// ======================================================

async function deleteLink(id) {

    const ok = confirm("Yakin ingin menghapus link ini?");

    if (!ok) return;

    try {

        await database.deleteLink(id);

        await loadLinks();

        alert("Link berhasil dihapus.");

    } catch (err) {

        console.error(err);

        alert("Gagal menghapus link.");

    }

}

// ======================================================
// REFRESH DATA
// ======================================================

async function refreshLinks() {

    await loadLinks();

}

// ======================================================
// AUTO LOAD
// ======================================================

window.addEventListener("load", async () => {

    await loadLinks();

});
