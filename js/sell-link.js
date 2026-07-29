/* =================================
   CLICK2PAY SELL LINK SYSTEM
================================= */

document.addEventListener("DOMContentLoaded",()=>{

let sellActive = false;

let sellLinks = [];
let filteredLinks = [];

let currentUser = null;
let currentFilter = "all";


/* =========================
   LOAD USER
========================= */

async function loadUser(){

try{

if(!window.database){
console.error("DATABASE BELUM READY");
return;
}


currentUser =
await database.getUser();


if(!currentUser){

console.log("USER BELUM LOGIN");

return;

}


const profile =
await database.getProfile(
currentUser.id
);


sellActive =
profile?.sell_link_enabled ||
profile?.withdraw_count >= 3 ||
false;


}catch(err){

console.error(
"LOAD USER ERROR:",
err
);

}

}


/* =========================
   LOAD SELL LINKS
========================= */

async function loadSellLinks(){

try{

if(!window.database){

console.error(
"DATABASE BELUM READY"
);

return;

}


if(!currentUser){

currentUser =
await database.getUser();

}


if(!currentUser){

console.log(
"USER BELUM LOGIN"
);

return;

}



const data =
await database.getLinks(
currentUser.id
);



console.log(
"ALL LINKS:",
data
);



sellLinks =
(data || []).filter(link=>{


const type =
(link.type || "")
.toLowerCase();


const linkType =
(link.link_type || "")
.toLowerCase();


return (
type==="sell" ||
linkType==="sell"
);


});



console.log(
"SELL LINKS:",
sellLinks
);



filteredLinks =
[...sellLinks];


renderSellStats();


applyFilter();



}catch(err){

console.error(
"LOAD SELL LINK ERROR:",
err
);

}

}


/* =========================
   HELPER
========================= */

function getValue(link,key1,key2){

    return Number(
        link[key1] ??
        link[key2] ??
        0
    );

}


/* =========================
   STATS
========================= */

function renderSellStats(){

    const totalLink =
        document.getElementById("totalLink");

    const totalSold =
        document.getElementById("totalSold");

    if(totalLink){

        totalLink.textContent =
            sellLinks.length;

    }

    if(totalSold){

        let sold = 0;

        sellLinks.forEach(link=>{

            sold += getValue(
                link,
                "sales",
                "sold"
            );

        });

        totalSold.textContent =
            sold.toLocaleString("id-ID");

    }

}


/* =========================
   SEARCH & FILTER
========================= */

const searchInput =
    document.getElementById("searchInput");

const filterButtons =
    document.querySelectorAll(
        ".link-filter button"
    );

function applyFilter(){

    const keyword =
        (searchInput?.value || "")
        .toLowerCase()
        .trim();

    filteredLinks = sellLinks.filter(link=>{

        const matchSearch =

            (link.title || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (link.destination || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (link.destination_url || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (link.short_code || "")
            .toLowerCase()
            .includes(keyword);

        let matchFilter = true;

        switch(currentFilter){

            case "active":

                matchFilter =
                    link.status==="active";

                break;

            case "inactive":

                matchFilter =
                    link.status!=="active";

                break;

            default:

                matchFilter = true;

        }

        return matchSearch && matchFilter;

    });

    renderLinks();

}


if(searchInput){

    searchInput.addEventListener(
        "input",
        applyFilter
    );

}


filterButtons.forEach(btn=>{

    btn.addEventListener("click",()=>{

        filterButtons.forEach(b=>

            b.classList.remove("active")

        );

        btn.classList.add("active");

        currentFilter =
            btn.dataset.filter;

        applyFilter();

    });

});

/* =========================
   GENERATE SHORT CODE
========================= */

function generateCode(length = 8){

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    const array =
        new Uint8Array(length);

    crypto.getRandomValues(array);

    for(let i=0;i<length;i++){

        result +=
            chars[array[i] % chars.length];

    }

    return result;

}


/* =========================
   CREATE SELL LINK
========================= */

const createBtn =
    document.getElementById("createSellBtn");

if(createBtn){

    createBtn.onclick = async()=>{

        if(!sellActive){

            alert("Sell Link belum aktif.");

            return;

        }

        const title =
            document.getElementById("sellTitle")
            .value
            .trim();

        const destination =
            document.getElementById("sellUrl")
            .value
            .trim();

        const price =
            Number(
                document
                .getElementById("sellPrice")
                .value
            );

        if(!title || !destination || !price){

            alert("Lengkapi semua data.");

            return;

        }

        try{

            new URL(destination);

        }catch{

            alert("URL tidak valid.");

            return;

        }

        try{

            let short_code;

            do{

                short_code =
                    generateCode(8);

            }while(
                await database.getLinkByCode(short_code)
            );

            const newLink =
                await database.createLink({

                    user_id:
                        currentUser.id,

                    type:"sell",

                    link_type:"sell",

                    title,

                    destination,

                    destination_url:
                        destination,

                    short_code,

                    price,

                    status:"active",

                    sales:0,

                    sold:0

                });

            document
                .getElementById("sellTitle")
                .value="";

            document
                .getElementById("sellUrl")
                .value="";

            document
                .getElementById("sellPrice")
                .value="";

            await loadSellLinks();

            applyFilter();

            generateLink(
                newLink.id
            );

        }catch(err){

            console.error(
                "CREATE SELL ERROR:",
                err
            );

            alert(
                err.message
            );

        }

    };

}


/* =========================
   RENDER SELL LINKS
========================= */

function renderLinks(){

    const box =
        document.getElementById("sellList");

    if(!box) return;

    if(!filteredLinks.length){

        box.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-box-open"></i>
            <h3>Belum Ada Sell Link</h3>
            <p>Silakan buat Sell Link pertama Anda.</p>
        </div>
        `;

        return;

    }

    box.innerHTML = filteredLinks.map(link=>{

        const shortCode =
            link.short_code ||
            link.shortcode ||
            link.code ||
            "";

        const status =
            link.status === "active";

        const sold =
            Number(
                link.sales ??
                link.sold ??
                0
            );

        return `

        <div class="link-card">

            <h3>
                ${link.title || "Tanpa Judul"}
            </h3>

            <div class="link-meta">

                <span>
                    <i class="fa-regular fa-calendar"></i>
                    ${new Date(
                        link.created_at
                    ).toLocaleDateString("id-ID")}
                </span>

                <span>
                    <i class="fa-solid fa-tag"></i>
                    Rp ${Number(
                        link.price || 0
                    ).toLocaleString("id-ID")}
                </span>

            </div>

            <div class="badge-group">

                <span class="badge pink">
                    Sell Link
                </span>

                <span class="badge ${status ? "green" : "pink"}">
                    ${status ? "Aktif" : "Nonaktif"}
                </span>

                <span class="badge blue">
                    Terjual ${sold}x
                </span>

            </div>

            <div class="copy-box">

                <input
                    readonly
                    value="https://click2pay.my.id/b/${shortCode}">

                <button
                    class="btn-copy"
                    onclick="generateLink('${link.id}')">

                    <i class="fa-solid fa-qrcode"></i>

                </button>

            </div>

            <div class="link-actions">

                <button
                    class="btn-edit"
                    onclick="editSell('${link.id}')">

                    <i class="fa-solid fa-pen"></i>
                    Edit

                </button>

                <button
                    class="btn-delete"
                    onclick="deleteSell('${link.id}')">

                    <i class="fa-solid fa-eye-slash"></i>
                    Hide

                </button>

            </div>

        </div>

        `;

    }).join("");

}


/* =========================
   GENERATE SELL LINK
========================= */

window.generateLink = function(id){

    const link = sellLinks.find(
        item => item.id === id
    );

    if(!link) return;

    const shortCode =
        link.short_code ||
        link.shortcode ||
        link.code ||
        "";

    const adsLink =
        `${location.origin}/a/${shortCode}`;

    const buyLink =
        `${location.origin}/b/${shortCode}`;

    document.getElementById("generatedBox").innerHTML = `

    <div class="link-card">

        <h3>${link.title}</h3>

        <div class="badge-group">

            <span class="badge green">
                Link Siap Digunakan
            </span>

        </div>

        <label>Ads Link</label>

        <div class="copy-box">

            <input
                readonly
                value="${adsLink}">

            <button
                class="btn-copy"
                onclick="copySell('${adsLink}')">

                <i class="fa-regular fa-copy"></i>

            </button>

        </div>

        <label>Buy Link</label>

        <div class="copy-box">

            <input
                readonly
                value="${buyLink}">

            <button
                class="btn-copy"
                onclick="copySell('${buyLink}')">

                <i class="fa-regular fa-copy"></i>

            </button>

        </div>

    </div>

    `;

    document
        .getElementById("generatedBox")
        .scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

};


/* =========================
   COPY LINK
========================= */

window.copySell = async function(text){

    try{

        if(navigator.clipboard){

            await navigator.clipboard.writeText(text);

        }else{

            const input =
                document.createElement("input");

            input.value = text;

            document.body.appendChild(input);

            input.select();

            document.execCommand("copy");

            input.remove();

        }

        alert("Link berhasil disalin.");

    }catch(err){

        console.error(err);

        alert("Gagal menyalin link.");

    }

};

/* =========================
   EDIT SELL LINK
========================= */

window.editSell = async function(id){

    const link =
        sellLinks.find(item=>item.id===id);

    if(!link) return;

    document.getElementById("editId").value = id;

    document.getElementById("editTitle").value =
        link.title || "";

    document.getElementById("editUrl").value =
        link.destination_url ||
        link.destination ||
        "";

    if(document.getElementById("editPrice")){

        document.getElementById("editPrice").value =
            link.price || 0;

    }

    document
        .getElementById("editModal")
        .classList.add("show");

};


/* =========================
   CLOSE EDIT
========================= */

window.closeEdit = function(){

    document
        .getElementById("editModal")
        ?.classList.remove("show");

};


/* =========================
   SAVE EDIT
========================= */

window.saveEdit = async function(){

    const id =
        document.getElementById("editId").value;

    const title =
        document.getElementById("editTitle").value.trim();

    const destination =
        document.getElementById("editUrl").value.trim();

    const price =
        Number(
            document.getElementById("editPrice")?.value || 0
        );

    if(!title || !destination){

        alert("Lengkapi data.");

        return;

    }

    try{

        new URL(destination);

    }catch{

        alert("URL tidak valid.");

        return;

    }

    try{

        await database.updateLink(id,{

            title,

            destination,

            destination_url:destination,

            price

        });

        closeEdit();

        await loadSellLinks();

        applyFilter();

        alert("Sell Link berhasil diperbarui.");

    }catch(err){

        console.error(err);

        alert(err.message);

    }

};


/* =========================
   DELETE / HIDE
========================= */

window.deleteSell = async function(id){

    if(
        !confirm(
            "Yakin ingin menyembunyikan Sell Link ini?"
        )
    ) return;

    try{

        await database.deleteLink(id);

        await loadSellLinks();

        applyFilter();

    }catch(err){

        console.error(err);

        alert(err.message);

    }

};


/* =========================
   MODAL EVENT
========================= */

window.addEventListener("click",e=>{

    const modal =
        document.getElementById("editModal");

    if(e.target===modal){

        closeEdit();

    }

});


window.addEventListener("keydown",e=>{

    if(e.key==="Escape"){

        closeEdit();

    }

});


/* =========================
   INIT
========================= */

(async()=>{

    await loadUser();

    await loadSellLinks();

})();
