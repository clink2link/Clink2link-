// ======================================================
// CLICK2PAY MY LINK SYSTEM
// ======================================================

let allLinks = [];
let filteredLinks = [];
let currentFilter = "all";

// ======================================================
// ELEMENT
// ======================================================

const smartList = document.getElementById("smartLinkList");
const adsList = document.getElementById("adsLinkList");
const sellList = document.getElementById("sellLinkList");

const totalAdsLink = document.getElementById("totalAdsLink");
const totalAdsView = document.getElementById("totalAdsView");
const totalSellLink = document.getElementById("totalSellLink");
const totalSellRevenue = document.getElementById("totalSellRevenue");

const totalLink = document.getElementById("totalLink");
const totalView = document.getElementById("totalView");
const totalClick = document.getElementById("totalClick");
const totalEarning = document.getElementById("totalEarning");

// ======================================================
// LOAD MY LINKS
// ======================================================

async function loadMyLinks(){

    try{

        const user = await database.getUser();

        if(!user){
            window.location.href="index.html";
            return;
        }

        const {data,error}=await database.supabase
        .from("links")
        .select("*")
        .eq("user_id",user.id)
        .order("created_at",{ascending:false});

        if(error) throw error;

        allLinks=data||[];
        updateStats();
        applyCurrentFilter();

    }catch(err){

        console.error("LOAD LINK ERROR:",err);

        if(smartList){

            smartList.innerHTML=`
            <div class="empty">
                <i class="fa-solid fa-circle-xmark"></i>
                <h3>Gagal Memuat Link</h3>
                <p>${err.message}</p>
            </div>`;

        }

    }

}

// ======================================================
// HELPER
// ======================================================

function getLinkType(link){

    return (
        link.link_type ||
        link.type ||
        "ads"
    ).toLowerCase();

}

function getShortUrl(link){

    return (
        link.short_url ||
        (
            link.short_code
            ?
            location.origin+"/s/"+link.short_code
            :
            "-"
        )
    );

}

function getDestination(link){

    return (
        link.destination_url ||
        link.destination ||
        link.url ||
        "-"
    );

}

// ======================================================
// UPDATE STATS
// ======================================================

function updateStats(){

    const adsLinks = allLinks.filter(
        link => getLinkType(link) === "ads"
    );

    const sellLinks = allLinks.filter(
        link => getLinkType(link) === "sell"
    );

    const totalViews = allLinks.reduce(
        (a,b)=>a+Number(b.total_views||b.views||0),
        0
    );

    const totalClicks = allLinks.reduce(
        (a,b)=>a+Number(b.total_clicks||b.clicks||0),
        0
    );

    const totalEarnings = allLinks.reduce(
        (a,b)=>a+Number(
            b.total_earnings||
            b.earnings||
            0
        ),
        0
    );

    const adsViews = adsLinks.reduce(
        (a,b)=>a+Number(
            b.total_views||
            b.views||
            0
        ),
        0
    );

    const sellRevenue = sellLinks.reduce(
        (a,b)=>a+Number(
            b.total_earnings||
            b.earnings||
            0
        ),
        0
    );

    totalLink.textContent = allLinks.length;

    totalView.textContent =
        totalViews.toLocaleString("id-ID");

    totalClick.textContent =
        totalClicks.toLocaleString("id-ID");

    totalEarning.textContent =
        "Rp"+totalEarnings.toLocaleString("id-ID");

    if(totalAdsLink)
        totalAdsLink.textContent =
        adsLinks.length;

    if(totalAdsView)
        totalAdsView.textContent =
        adsViews.toLocaleString("id-ID");

    if(totalSellLink)
        totalSellLink.textContent =
        sellLinks.length;

    if(totalSellRevenue)
        totalSellRevenue.textContent =
        "Rp"+sellRevenue.toLocaleString("id-ID");

}


// ======================================================
// RENDER ALL LINK
// ======================================================

function renderAllLinks(){

    renderLinkBox(
        smartList,
        filteredLinks,
        "Belum Ada Smart Link"
    );

    renderLinkBox(
        adsList,
        filteredLinks.filter(link =>
            getLinkType(link) === "ads"
        ),
        "Belum Ada Ads Link"
    );

    renderLinkBox(
        sellList,
        filteredLinks.filter(link =>
            getLinkType(link) === "sell"
        ),
        "Belum Ada Sell Link"
    );

    updateCount(
        "smartCount",
        filteredLinks.length
    );

    updateCount(
        "adsCount",
        filteredLinks.filter(link =>
            getLinkType(link) === "ads"
        ).length
    );

    updateCount(
        "sellCount",
        filteredLinks.filter(link =>
            getLinkType(link) === "sell"
        ).length
    );

}

// ======================================================
// COUNT
// ======================================================

function updateCount(id,total){

    const el=document.getElementById(id);

    if(el){

        el.textContent=
        total+" Link";

    }

}


// ======================================================
// RENDER BOX
// ======================================================

function renderLinkBox(box,list,message){

    if(!box) return;


    if(!list.length){

        box.innerHTML=`

        <div class="empty">

            <i class="fa-solid fa-link-slash"></i>

            <h3>${message}</h3>

            <p>Link kamu akan tampil di sini.</p>

        </div>

        `;

        return;

    }


    box.innerHTML=list.map(link=>

        createLinkCard(link)

    ).join("");

}


// ======================================================
// CREATE CARD
// ======================================================

function createLinkCard(link){

    const type = getLinkType(link);
    const shortUrl = getShortUrl(link);
    const destination = getDestination(link);

    const views = Number(link.total_views || link.views || 0);
    const clicks = Number(link.total_clicks || link.clicks || 0);
    const earning = Number(link.total_earnings || link.earnings || 0);

    return `

<div class="link-card">

    <div class="link-top">

        <div class="link-left">

            <h3 class="link-title">
                ${link.title || "Smart Link"}
            </h3>

            <div class="link-url">
                <i class="fa-solid fa-link"></i>
                <span>${shortUrl}</span>
            </div>

        </div>

        <span class="link-type ${type}">
            ${type.toUpperCase()}
        </span>

    </div>

    <div class="link-stats">

        <div class="link-stat">
            <h5>Views</h5>
            <span>${views.toLocaleString("id-ID")}</span>
        </div>

        <div class="link-stat">
            <h5>Clicks</h5>
            <span>${clicks.toLocaleString("id-ID")}</span>
        </div>

        <div class="link-stat">
            <h5>Earning</h5>
            <span>Rp${earning.toLocaleString("id-ID")}</span>
        </div>

        <div class="link-stat">
            <h5>Type</h5>
            <span>${type.toUpperCase()}</span>
        </div>

    </div>

    <div class="link-info">

        <p>
            <i class="fa-solid fa-globe"></i>
            ${destination}
        </p>

        <p>
            <i class="fa-solid fa-calendar"></i>
            ${formatDate(link.created_at)}
        </p>

    </div>

    <div class="link-actions">

        <button class="copy-btn"
            onclick="copyLink('${shortUrl}')">
            <i class="fa-solid fa-copy"></i>
            Copy
        </button>

        <button class="edit-btn"
            onclick="editLink('${link.id}')">
            <i class="fa-solid fa-pen"></i>
            Edit
        </button>

        <button class="delete-btn"
            onclick="deleteLink('${link.id}')">
            <i class="fa-solid fa-trash"></i>
            Hapus
        </button>

    </div>

</div>

`;

}

window.editLink = function(id){

    const link = allLinks.find(
        item => item.id === id
    );

    if(!link) return;


    document
    .getElementById("editModal")
    .classList.add("active");


    document.getElementById("editId").value =
    link.id;


    document.getElementById("editTitle").value =
    link.title || "";


    document.getElementById("editUrl").value =
    link.url || "";

};

// ======================================================
// SEARCH LINK
// ======================================================

function searchLinks(){

    applyCurrentFilter();

}


// ======================================================
// FILTER LINK
// ======================================================

function filterLink(type,button){

    currentFilter=type;


    document
    .querySelectorAll(".link-filter button")
    .forEach(btn=>{

        btn.classList.remove("active");

    });


    if(button){

        button.classList.add("active");

    }


    applyCurrentFilter();

}


// ======================================================
// APPLY FILTER
// ======================================================

function applyCurrentFilter(){

    const keyword = (
        document.getElementById("searchLink")?.value || ""
    ).toLowerCase().trim();

    let data = [...allLinks];

    // Search
    if(keyword){

        data = data.filter(link =>

            (link.title || "")
            .toLowerCase()
            .includes(keyword)

            ||

            getDestination(link)
            .toLowerCase()
            .includes(keyword)

            ||

            getShortUrl(link)
            .toLowerCase()
            .includes(keyword)

            ||

            getLinkType(link)
            .toLowerCase()
            .includes(keyword)

        );

    }

    filteredLinks = data;

    renderAllLinks();

    // =========================
    // SHOW / HIDE PANEL
    // =========================

    const smartPanel = document.getElementById("smartPanel");
    const adsPanel = document.getElementById("adsPanel");
    const sellPanel = document.getElementById("sellPanel");

    if(!smartPanel || !adsPanel || !sellPanel) return;

    smartPanel.style.display = "";
    adsPanel.style.display = "";
    sellPanel.style.display = "";

    if(currentFilter === "ads"){

        smartPanel.style.display = "none";
        sellPanel.style.display = "none";

    }

    else if(currentFilter === "sell"){

        smartPanel.style.display = "none";
        adsPanel.style.display = "none";

    }

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date){

    if(!date)
        return "-";


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
// COPY LINK
// ======================================================

window.copyLink = async function(url){

    try{

        await navigator.clipboard.writeText(url);

        alert(
            "Link berhasil disalin."
        );

    }catch(err){

        console.error(err);

    }

};


// ======================================================
// OPEN LINK
// ======================================================

window.openLink=function(url){

    if(!url)
        return;


    window.open(
        url,
        "_blank"
    );

};


// ======================================================
// DELETE LINK
// ======================================================

window.deleteLink=async function(id){

    if(!confirm(
        "Yakin ingin menghapus link ini?"
    )) return;


    try{

        await database.deleteLink(id);

        await loadMyLinks();


        alert(
            "Link berhasil dihapus."
        );


    }catch(err){

        console.error(err);

        alert(
            err.message
        );

    }

};


// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(()=>{

    loadMyLinks();

},30000);


// ======================================================
// INIT
// ======================================================

document.addEventListener(
"DOMContentLoaded",
()=>{

    loadMyLinks();

});
