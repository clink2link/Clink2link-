// ======================================================
// MY LINK
// ======================================================

let allLinks = [];
let filteredLinks = [];

const linkList = document.getElementById("linkList");

const totalLink = document.getElementById("totalLink");
const totalView = document.getElementById("totalView");
const totalClick = document.getElementById("totalClick");
const totalEarning = document.getElementById("totalEarning");

// ======================================================
// LOAD LINK
// ======================================================

async function loadMyLinks(){

    try{

        const user = await database.getUser();

        if(!user){

            window.location.href = "index.html";
            return;

        }

        const { data, error } = await database.supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at",{ascending:false});

        if(error) throw error;

        allLinks = data || [];

        filteredLinks = [...allLinks];

        updateStats();

        renderLinks(filteredLinks);

    }catch(err){

        console.error(err);

        linkList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-circle-xmark"></i>
            <h3>Gagal memuat data</h3>
            <p>${err.message}</p>
        </div>`;

    }

}

// ======================================================
// UPDATE STATS
// ======================================================

function updateStats(){

    totalLink.textContent = allLinks.length;

    totalView.textContent = allLinks.reduce(
        (a,b)=>a+(b.total_views||0),0
    );

    totalClick.textContent = allLinks.reduce(
        (a,b)=>a+(b.total_clicks||0),0
    );

    const earning = allLinks.reduce(
        (a,b)=>a+(b.total_earnings||0),0
    );

    totalEarning.textContent =
        "Rp"+earning.toLocaleString("id-ID");

}

// ======================================================
// RENDER LINK
// ======================================================

function renderLinks(list){

    if(!list.length){

        linkList.innerHTML=`

        <div class="empty">

            <i class="fa-solid fa-link-slash"></i>

            <h3>Belum Ada Link</h3>

            <p>Silakan buat link pertama.</p>

        </div>

        `;

        return;

    }

    linkList.innerHTML=list.map(item=>{

        const status=getStatus(item);

        const ctr=calculateCTR(
            item.total_views,
            item.total_clicks
        );

        return `

        <div class="link-card">

            <div class="link-top">

                <div>

                    <div class="link-title">

                        ${item.title || "Short Link"}

                    </div>

                    <div class="link-url">

                        ${item.short_url}

                    </div>

                </div>

                <div>

                    <span class="link-type ${item.type}">

                        ${item.type.toUpperCase()}

                    </span>

                </div>

            </div>

            <div class="link-stats">

                <div class="link-stat">

                    <h5>View</h5>

                    <span>${item.total_views||0}</span>

                </div>

                <div class="link-stat">

                    <h5>Click</h5>

                    <span>${item.total_clicks||0}</span>

                </div>

                <div class="link-stat">

                    <h5>CTR</h5>

                    <span>${ctr}%</span>

                </div>

                <div class="link-stat">

                    <h5>Earning</h5>

                    <span>${rupiah(item.total_earnings)}</span>

                </div>

            </div>

            <div class="link-info">

                <p>

                    <i class="fa-solid fa-calendar"></i>

                    ${formatDate(item.created_at)}

                </p>

                <p>

                    <i class="fa-solid fa-tag"></i>

                    ${item.alias || "-"}

                </p>

                <p>

                    <i class="fa-solid fa-bullseye"></i>

                    ${item.campaign || "-"}

                </p>

                <p>

                    <i class="fa-solid fa-mobile-screen"></i>

                    ${item.device || "all"}

                </p>

                <p>

                    <i class="fa-solid fa-circle"></i>

                    <span class="status-${getStatusClass(status)}">

                        ${status}

                    </span>

                </p>

            </div>

            <div class="link-actions">

                <button
                class="copy-btn"
                onclick="copyLink('${item.short_url}')">

                    <i class="fa-solid fa-copy"></i>

                    Copy

                </button>

                <button
                class="edit-btn"
                onclick="openLink('${item.short_url}')">

                    <i class="fa-solid fa-up-right-from-square"></i>

                    Open

                </button>

                <button
                class="edit-btn"
                onclick="shareLink('${item.short_url}')">

                    <i class="fa-solid fa-share-nodes"></i>

                    Share

                </button>

                <button
                class="edit-btn"
                onclick="editLink('${item.id}')">

                    <i class="fa-solid fa-pen"></i>

                    Edit

                </button>

                <button
                class="delete-btn"
                onclick="deleteLink('${item.id}')">

                    <i class="fa-solid fa-trash"></i>

                    Hapus

                </button>

            </div>

        </div>

        `;

    }).join("");

}
// ======================================================
// SEARCH LINK
// ======================================================

function searchLinks(){

    const keyword = document
        .getElementById("searchLink")
        .value
        .toLowerCase()
        .trim();

    if(keyword===""){

        renderLinks(filteredLinks);

        return;

    }

    const result = filteredLinks.filter(item=>{

        return (

            (item.title || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (item.url || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (item.short_url || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (item.alias || "")
            .toLowerCase()
            .includes(keyword)

        );

    });

    renderLinks(result);

}

// ======================================================
// FILTER LINK
// ======================================================

function filterLink(type,button){

    document
        .querySelectorAll(".link-filter button")
        .forEach(btn=>btn.classList.remove("active"));

    if(button){

        button.classList.add("active");

    }

    if(type==="all"){

        filteredLinks=[...allLinks];

    }else{

        filteredLinks=allLinks.filter(item=>

            item.type===type

        );

    }

    searchLinks();

}

// ======================================================
// REFRESH DATA
// ======================================================

async function refreshLinks(){

    await loadMyLinks();

}

// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(()=>{

    refreshLinks();

},30000);

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date){

    if(!date) return "-";

    return new Date(date)
    .toLocaleString("id-ID",{

        day:"2-digit",

        month:"short",

        year:"numeric",

        hour:"2-digit",

        minute:"2-digit"

    });

}

// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(value){

    return "Rp"+Number(value||0)
    .toLocaleString("id-ID");

}

// ======================================================
// INIT
// ======================================================

document.addEventListener("DOMContentLoaded",()=>{

    loadMyLinks();

});

// ======================================================
// OPEN LINK
// ======================================================

function openLink(url){

    if(!url) return;

    window.open(url,"_blank");

}

// ======================================================
// SHARE LINK
// ======================================================

async function shareLink(url){

    if(!url) return;

    if(navigator.share){

        try{

            await navigator.share({

                title:"Click2Pay",

                text:"Lihat link ini",

                url:url

            });

            return;

        }catch(e){}

    }

    copyLink(url);

}

// ======================================================
// CALCULATE CTR
// ======================================================

function calculateCTR(view,click){

    view = Number(view||0);
    click = Number(click||0);

    if(view===0) return 0;

    return ((click/view)*100).toFixed(1);

}

// ======================================================
// GET STATUS
// ======================================================

function getStatus(item){

    if(item.expired==="never")
        return "Aktif";

    if(!item.created_at)
        return "Aktif";

    const created = new Date(item.created_at);

    const expire = new Date(created);

    expire.setDate(

        expire.getDate() +

        Number(item.expired)

    );

    if(new Date()>expire){

        return "Expired";

    }

    return "Aktif";

}

// ======================================================
// STATUS COLOR
// ======================================================

function getStatusClass(status){

    switch(status){

        case "Expired":
            return "danger";

        case "Aktif":
            return "success";

        default:
            return "secondary";

    }

}
