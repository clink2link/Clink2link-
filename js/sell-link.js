/* =================================
   CLICK2PAY SELL LINK SYSTEM
================================= */

document.addEventListener("DOMContentLoaded",()=>{

let sellActive = false;

let sellLinks = [];
let filteredLinks = [];

let currentUser = null;
let currentProfile = null;
let currentFilter = "all";


/* =========================
   LOAD USER
========================= */

async function loadUser(){

    try{

        if(!window.database){

            console.error("DATABASE BELUM READY");
            return null;

        }

        if(currentUser){

            return currentUser;

        }

        const user =
            await database.getUser();

        console.log(
            "CURRENT USER:",
            user
        );

        if(!user){

            console.error(
                "USER TIDAK DITEMUKAN"
            );

            return null;

        }

        currentUser = user;

        currentProfile =
            await database.getProfile(
                user.id
            );

        console.log(
            "CURRENT PROFILE:",
            currentProfile
        );

        if(currentProfile){

            sellActive = Boolean(
                currentProfile.sell_link_enabled === true ||
                Number(currentProfile.withdraw_count || 0) >= 1
            );

        }else{

            console.warn(
                "PROFILE TIDAK DITEMUKAN"
            );

            sellActive = false;

        }

        console.log(
            "SELL ACCESS:",
            sellActive
        );

        checkAccess();

        return currentUser;

    }catch(err){

        console.error(
            "LOAD USER ERROR:",
            err
        );

        return null;

    }

}



/* =========================
   LOAD SELL LINKS
========================= */

async function loadSellLinks(){

    try{

        console.log(
            "=== START LOAD SELL LINK ==="
        );

        if(!currentUser){

            console.error(
                "USER BELUM LOGIN"
            );

            return;

        }

        console.log(
            "USER ID:",
            currentUser.id
        );

        const data =
            await database.getLinks(
                currentUser.id
            );

        console.log(
            "ALL USER LINKS:",
            data
        );

        if(!Array.isArray(data)){

            console.error(
                "DATA LINKS INVALID:",
                data
            );

            sellLinks = [];
            filteredLinks = [];

            renderSellStats();
            renderLinks();

            return;

        }

        sellLinks = data.filter(link=>

            link.link_type === "sell"

        );

        console.log(
            "FILTER SELL LINK:",
            sellLinks
        );

        console.log(
            "TOTAL SELL:",
            sellLinks.length
        );

        filteredLinks = [...sellLinks];

        renderSellStats();

        applyFilter();

    }catch(err){

        console.error(
            "LOAD SELL LINK ERROR:",
            err
        );

        sellLinks = [];
        filteredLinks = [];

        renderSellStats();

        const box =
            document.getElementById(
                "sellList"
            );

        if(box){

            box.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Gagal Memuat Sell Link</h3>

                <p>${err.message}</p>

            </div>

            `;

        }

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
        document.getElementById("sellTotalLink");

    const totalPrice =
        document.getElementById("sellTotalPrice");

    const totalView =
        document.getElementById("sellTotalView");

    const totalSold =
        document.getElementById("sellTotalSold");

    let totalEarning = 0;
    let sold = 0;
    let views = 0;

    for(const link of sellLinks){

        const price = Number(link.price || 0);

        const soldCount = Number(
            link.sold ??
            link.sales ??
            0
        );

        const viewCount = Number(
            link.total_views ??
            link.views ??
            0
        );

        sold += soldCount;

        views += viewCount;

        // Total uang hasil penjualan
        totalEarning += price * soldCount;

    }

    if(totalLink){
        totalLink.textContent = sellLinks.length;
    }

    if(totalPrice){
        totalPrice.textContent =
            "Rp " +
            totalEarning.toLocaleString("id-ID");
    }

    if(totalView){
        totalView.textContent =
            views.toLocaleString("id-ID");
    }

    if(totalSold){
        totalSold.textContent =
            sold.toLocaleString("id-ID");
    }

    console.log("SELL STATS:",{
        totalLink: sellLinks.length,
        totalEarning,
        views,
        sold
    });

}


/* =========================
   SEARCH & FILTER
========================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );

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

            (
                link.short_code ||
                link.shortcode ||
                link.code ||
                ""
            )
            .toLowerCase()
            .includes(keyword);

        let matchFilter = true;

        switch(currentFilter){

            case "active":

                matchFilter =
                    link.status === "active";

                break;

            case "inactive":

                matchFilter =
                    link.status !== "active";

                break;

            default:

                matchFilter = true;

        }

        return (
            matchSearch &&
            matchFilter
        );

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

        filterButtons.forEach(button=>

            button.classList.remove(
                "active"
            )

        );

        btn.classList.add(
            "active"
        );

        currentFilter =
            btn.dataset.filter ||
            "all";

        applyFilter();

    });

});

/* =========================
   GENERATE SHORT CODE
========================= */

function generateCode(length = 8){

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const randomBytes =
        new Uint8Array(length);

    crypto.getRandomValues(
        randomBytes
    );

    let result = "";

    for(const byte of randomBytes){

        result +=
            chars[
                byte % chars.length
            ];

    }

    return result;

}


/* =========================
   CREATE SELL LINK
========================= */

const createBtn =
    document.getElementById(
        "createSellBtn"
    );


if(createBtn){

    createBtn.onclick = async()=>{


        if(!sellActive){

            alert(
                "Sell Link belum aktif."
            );

            return;

        }


        if(!currentUser){

            alert(
                "User belum login."
            );

            return;

        }


        const title =
            document
            .getElementById("sellTitle")
            .value
            .trim();


        const destination =
            document
            .getElementById("sellUrl")
            .value
            .trim();


        const price =
            Number(
                document
                .getElementById("sellPrice")
                .value
            );



        if(
            !title ||
            !destination ||
            price < 1000
        ){

            alert(
                "Lengkapi data dengan benar.\nHarga minimal Rp10.000."
            );

            return;

        }



        try{

            new URL(destination);


        }catch{

            alert(
                "URL tidak valid."
            );

            return;

        }




        createBtn.disabled = true;


        createBtn.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Membuat Sell Link...

        `;



        try{


            let short_code;


            do{


                short_code =
                    generateCode(8);


            }while(

                await database.getLinkByCode(
                    short_code
                )

            );





            const newLink =

            await database.createLink({

                user_id:
                    currentUser.id,


                type:
                    "sell",


                link_type:
                    "sell",



                title,


                destination,


                destination_url:
                    destination,



                short_code,


                price,



                status:
                    "active",




                // Statistik awal

                sold:
                    0,


                sales:
                    0,


                views:
                    0,


                total_views:
                    0


            });





            document
            .getElementById("sellTitle")
            .value = "";



            document
            .getElementById("sellUrl")
            .value = "";



            document
            .getElementById("sellPrice")
            .value = "";





            await loadSellLinks();



            if(newLink?.id){

                generateLink(
                    newLink.id
                );

            }




            applyFilter();





            const result =
                document.getElementById(
                    "createResult"
                );


            if(result){

                result.innerHTML = `

                <div class="success-box">

                    <i class="fa-solid fa-circle-check"></i>

                    Sell Link berhasil dibuat.

                </div>

                `;

            }



        }catch(err){


            console.error(
                "CREATE SELL ERROR:",
                err
            );


            alert(

                err.message ||

                "Gagal membuat Sell Link."

            );



        }finally{


            createBtn.disabled = false;


            checkAccess();


        }


    };


}


/* =========================
   RENDER SELL LINKS
========================= */

function renderLinks(){

    const box =
        document.getElementById(
            "sellList"
        );


    if(!box) return;



    if(!filteredLinks.length){


        box.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-box-open"></i>

            <h3>
                Belum Ada Sell Link
            </h3>

            <p>
                Silakan buat Sell Link pertama Anda.
            </p>

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



        const sellUrl =
            `${location.origin}/b/${shortCode}`;



        const status =
            link.status === "active";



        const sold =
            Number(
                link.sales ??
                link.sold ??
                0
            );



        const views =
            Number(
                link.total_views ??
                link.views ??
                0
            );



        const price =
            Number(
                link.price ?? 0
            );



        const destination =
            link.destination_url ||
            link.destination ||
            "-";



        const date =
            link.created_at

            ?

            new Date(
                link.created_at
            )
            .toLocaleDateString("id-ID")

            :

            "-";




        return `


        <div class="link-card">


            <div class="link-top">

                <h3>
                    ${link.title || "Tanpa Judul"}
                </h3>

            </div>




            <div class="link-meta">


                <span>

                    <i class="fa-regular fa-calendar"></i>

                    ${date}

                </span>



                <span>

                    <i class="fa-solid fa-money-bill"></i>

                    Rp ${price.toLocaleString("id-ID")}

                </span>



                <span>

                    <i class="fa-solid fa-eye"></i>

                    ${views} View

                </span>


            </div>





            <div class="destination-link">

                <i class="fa-solid fa-link"></i>

                <a
                    href="${destination}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="destination-url"
                >
                    ${destination}
                </a>

            </div>





            <div class="badge-group">


                <span class="badge blue">

                    <i class="fa-solid fa-tag"></i>

                    Sell Link

                </span>



                <span class="badge ${status ? "green" : "red"}">

                    <i class="fa-solid fa-circle"></i>

                    ${status ? "Aktif" : "Nonaktif"}

                </span>



                <span class="badge orange">

                    <i class="fa-solid fa-cart-shopping"></i>

                    Terjual ${sold}x

                </span>


            </div>





            <div class="copy-box">


                <input

                    readonly

                    value="${sellUrl}">


                <button

                    class="btn-copy"

                    onclick="copySell('${sellUrl}')">


                    <i class="fa-regular fa-copy"></i>


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

    const link =
        sellLinks.find(
            item => item.id === id
        );


    if(!link){

        console.error(
            "SELL LINK TIDAK DITEMUKAN:",
            id
        );

        return;

    }



    const box =
        document.getElementById(
            "generatedBox"
        );


    if(!box){

        console.error(
            "GENERATED BOX TIDAK ADA"
        );

        return;

    }




    const shortCode =
        link.short_code ||
        link.shortcode ||
        link.code ||
        "";



    if(!shortCode){

        alert(
            "Short code tidak ditemukan."
        );

        return;

    }




    const buyLink =
        `${location.origin}/b/${shortCode}`;



    const price =
        Number(
            link.price || 0
        );




    box.innerHTML = `


    <div class="link-card">


        <div class="link-top">

            <h3>

                ${link.title || "Sell Link"}

            </h3>

        </div>




        <div class="badge-group">


            <span class="badge green">

                <i class="fa-solid fa-circle-check"></i>

                Link Aktif

            </span>



            <span class="badge blue">

                <i class="fa-solid fa-money-bill"></i>

                Rp ${price.toLocaleString("id-ID")}

            </span>


        </div>





        <label>

            Buy Link

        </label>



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





        <div class="link-info">


            <small>

                Short Code:

                <b>
                    ${shortCode}
                </b>


            </small>


        </div>



    </div>


    `;



    box.scrollIntoView({

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

            await navigator.clipboard.writeText(
                text
            );

        }else{

            const input =
                document.createElement(
                    "input"
                );

            input.value = text;

            document.body.appendChild(
                input
            );

            input.select();

            document.execCommand(
                "copy"
            );

            input.remove();

        }

        alert(
            "Link berhasil disalin."
        );

    }catch(err){

        console.error(err);

        alert(
            "Gagal menyalin link."
        );

    }

};


/* =========================
   EDIT SELL LINK
========================= */

window.editSell = function(id){

    const link =
        sellLinks.find(
            item => item.id === id
        );

    if(!link) return;

    document.getElementById("editId").value =
        id;

    document.getElementById("editTitle").value =
        link.title || "";

    document.getElementById("editUrl").value =
        link.destination_url ||
        link.destination ||
        "";

    const price =
        document.getElementById(
            "editPrice"
        );

    if(price){

        price.value =
            link.price ?? 0;

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
        document.getElementById("editTitle")
        .value
        .trim();

    const destination =
        document.getElementById("editUrl")
        .value
        .trim();

    const price =
        Number(
            document.getElementById("editPrice")
            ?.value || 0
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

            destination_url:
                destination,

            price

        });

        closeEdit();

        await loadSellLinks();

        applyFilter();

        alert(
            "Sell Link berhasil diperbarui."
        );

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

    if(
        e.target ===
        document.getElementById(
            "editModal"
        )
    ){

        closeEdit();

    }

});

window.addEventListener("keydown",e=>{

    if(e.key === "Escape"){

        closeEdit();

    }

});


/* =========================
   ACCESS
========================= */

function checkAccess(){

    const btn =
        document.getElementById(
            "createSellBtn"
        );

    const status =
        document.getElementById(
            "sellStatus"
        );

    if(!btn || !status) return;

    status.classList.remove(
        "active",
        "inactive"
    );

    if(sellActive){

        status.classList.add(
            "active"
        );

        btn.disabled = false;

        btn.innerHTML = `
        <i class="fa-solid fa-plus"></i>
        Create Sell Link
        `;

        status.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        Sell Link Aktif
        `;

    }else{

        status.classList.add(
            "inactive"
        );

        btn.disabled = true;

        btn.innerHTML = `
        <i class="fa-solid fa-lock"></i>
        Sell Link Terkunci
        `;

        status.innerHTML = `
        <i class="fa-solid fa-circle-xmark"></i>
        Aktifkan Sell Link terlebih dahulu
        `;

    }

}


/* =========================
   INIT
========================= */

(async()=>{

    if(await loadUser()){

        await loadSellLinks();

    }

})();

}); // Penutup document.addEventListener("DOMContentLoaded", ...)
