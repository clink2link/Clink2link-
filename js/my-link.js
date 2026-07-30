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
        filteredLinks=[...allLinks];

        updateStats();
        renderAllLinks();

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

    const views = allLinks.reduce(
        (a,b)=>a+Number(b.total_views||b.views||0),
        0
    );

    const clicks = allLinks.reduce(
        (a,b)=>a+Number(b.total_clicks||b.clicks||0),
        0
    );

    const earning = allLinks.reduce(
        (a,b)=>a+Number(b.total_earnings||b.earnings||0),
        0
    );

    if(totalLink)
        totalLink.textContent=allLinks.length;

    if(totalView)
        totalView.textContent=views.toLocaleString("id-ID");

    if(totalClick)
        totalClick.textContent=clicks.toLocaleString("id-ID");

    if(totalEarning)
        totalEarning.textContent=
        "Rp"+earning.toLocaleString("id-ID");

}


// ======================================================
// RENDER ALL LINK
// ======================================================

function renderAllLinks(){

    const smart = filteredLinks;

    const ads = filteredLinks.filter(link=>
        getLinkType(link)==="ads"
    );

    const sell = filteredLinks.filter(link=>
        getLinkType(link)==="sell"
    );


    renderLinkBox(
        smartList,
        smart,
        "Belum Ada Smart Link"
    );


    renderLinkBox(
        adsList,
        ads,
        "Belum Ada Ads Link"
    );


    renderLinkBox(
        sellList,
        sell,
        "Belum Ada Sell Link"
    );


    updateCount(
        "smartCount",
        smart.length
    );

    updateCount(
        "adsCount",
        ads.length
    );

    updateCount(
        "sellCount",
        sell.length
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

    const type =
    getLinkType(link);

    const shortUrl =
    getShortUrl(link);

    const destination =
    getDestination(link);


    const views =
    Number(
        link.total_views||
        link.views||
        0
    );


    const clicks =
    Number(
        link.total_clicks||
        link.clicks||
        0
    );


    const earning =
    Number(
        link.total_earnings||
        link.earnings||
        0
    );


    return `

    <div class="link-card">

        <div class="link-top">

            <div>

                <div class="link-title">
                    ${link.title||"Smart Link"}
                </div>

                <div class="link-url">
                    ${shortUrl}
                </div>

            </div>


            <span class="link-type ${type}">
                ${type.toUpperCase()}
            </span>

        </div>


        <div class="link-stats">

            <div class="link-stat">
                <h5>View</h5>
                <span>${views}</span>
            </div>

            <div class="link-stat">
                <h5>Click</h5>
                <span>${clicks}</span>
            </div>

            <div class="link-stat">
                <h5>Earning</h5>
                <span>
                Rp${earning.toLocaleString("id-ID")}
                </span>
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
            onclick="openLink('${shortUrl}')">

                <i class="fa-solid fa-up-right-from-square"></i>
                Open

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

// ======================================================
// SEARCH LINK
// ======================================================

function searchLinks(){

    const input =
    document.getElementById("searchLink");

    const keyword =
    (input?.value || "")
    .toLowerCase()
    .trim();


    if(!keyword){

        filteredLinks=[...allLinks];

    }else{

        filteredLinks =
        allLinks.filter(link=>{

            return (

                (link.title||"")
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

        });

    }


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

    let data=[...filteredLinks];


    if(currentFilter!=="all"){

        data =
        data.filter(link=>

            getLinkType(link)===currentFilter

        );

    }


    filteredLinks=data;

    renderAllLinks();

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
