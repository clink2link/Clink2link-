let allLinks = [];
let filteredLinks = [];

const linkList = document.getElementById("linkList");
const totalLink = document.getElementById("totalLink");
const totalView = document.getElementById("totalView");
const totalClick = document.getElementById("totalClick");
const totalEarning = document.getElementById("totalEarning");


async function getCurrentUser(){

    try{

        const user = await database.getUser();

        if(!user){

            location.replace("index.html");
            return null;

        }

        return user;


    }catch(err){

        console.error("USER ERROR:",err);

        location.replace("index.html");

        return null;

    }

}



async function loadLinks(){

    try{

        const user = await getCurrentUser();

        if(!user)return;


        allLinks = await database.getLinks(user.id) || [];

        filteredLinks=[...allLinks];


        updateStats();

        renderLinks();



    }catch(err){

        console.error("LOAD LINK ERROR:",err);


        linkList.innerHTML=`

        <div class="empty">

        <i class="fa-solid fa-circle-xmark"></i>

        <h3>Gagal Memuat Data</h3>

        <p>${err.message}</p>

        </div>

        `;

    }

}




function getValue(link,key1,key2){

    return Number(
        link[key1] ??
        link[key2] ??
        0
    );

}




function updateStats(){

    totalLink.textContent =
    allLinks.length;


    let views=0;
    let clicks=0;
    let earnings=0;


    allLinks.forEach(link=>{


        views += getValue(
            link,
            "total_views",
            "views"
        );


        clicks += getValue(
            link,
            "total_clicks",
            "clicks"
        );


        earnings += getValue(
            link,
            "total_earnings",
            "earnings"
        );


    });



    totalView.textContent =
    views.toLocaleString("id-ID");


    totalClick.textContent =
    clicks.toLocaleString("id-ID");


    totalEarning.textContent =
    "Rp "+earnings.toLocaleString("id-ID");


}




function renderLinks(){


if(!filteredLinks.length){

linkList.innerHTML=`

<div class="empty">

<i class="fa-solid fa-link-slash"></i>

<h3>Belum Ada Link</h3>

<p>Silakan buat Link pertama Anda.</p>

</div>

`;

return;

}



linkList.innerHTML = filteredLinks.map(link=>{


let url =
`${location.origin}/s/${link.short_code}`;


return `


<div class="link-card">


<div class="link-top">

<div class="link-left">


<div class="link-title">

${link.title || "Tanpa Judul"}

</div>


<div class="link-url">

${url}

</div>


</div>


<div class="link-type ads">

ADS

</div>


</div>





<div class="link-stats">


<div class="link-stat">

<h5>View</h5>

<span>

${getValue(link,"total_views","views").toLocaleString("id-ID")}

</span>

</div>



<div class="link-stat">

<h5>Click</h5>

<span>

${getValue(link,"total_clicks","clicks").toLocaleString("id-ID")}

</span>

</div>




<div class="link-stat">

<h5>Earning</h5>

<span>

Rp ${getValue(link,"total_earnings","earnings").toLocaleString("id-ID")}

</span>

</div>




<div class="link-stat">

<h5>Status</h5>

<span class="${
link.status==="active"
?
"status-success"
:
"status-danger"
}">

${link.status==="active"?"Aktif":"Nonaktif"}

</span>


</div>


</div>





<div class="link-actions">


<button class="copy-btn"
onclick="copyLink('${url}')">

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


}).join("");

}






// SEARCH

const searchInput =
document.getElementById("searchInput");


if(searchInput){


searchInput.oninput=()=>{


const key =
searchInput.value
.toLowerCase()
.trim();



filteredLinks =
allLinks.filter(link=>

(link.title||"")
.toLowerCase()
.includes(key)

||

(link.destination||"")
.toLowerCase()
.includes(key)

||

(link.short_code||"")
.toLowerCase()
.includes(key)


);



renderLinks();


};


}






// CREATE


const createForm =
document.getElementById("createForm");


if(createForm){


createForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const title =
document.getElementById("linkName")
.value.trim();


const destination =
document.getElementById("linkUrl")
.value.trim();



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


const user =
await getCurrentUser();


if(!user)return;



const short_code =
crypto.randomUUID()
.replaceAll("-","")
.substring(0,8);



await database.createLink({

user_id:user.id,

type:"ads",

title,

destination,

destination_url:destination,

short_code,

status:"active",

views:0,

clicks:0,

earnings:0,

total_views:0,

total_clicks:0,

total_earnings:0,

link_type:"ads"


});



createForm.reset();



await loadLinks();



alert("Link berhasil dibuat.");



}catch(err){


console.error(
"CREATE ERROR:",
err
);


alert(
err.message
);


}


});


}






async function copyLink(url){


try{


await navigator.clipboard.writeText(url);


alert("Link berhasil disalin.");


}catch{


alert("Gagal copy link.");

}


}






async function deleteLink(id){


if(!confirm("Hapus link ini?"))
return;


try{


await database.deleteLink(id);


await loadLinks();


}catch(err){

console.error(err);

alert(err.message);

}


}






async function editLink(id){


const link =
allLinks.find(x=>x.id===id);


if(!link)return;



const title =
prompt(
"Nama Link",
link.title
);



if(title===null)return;



const destination =
prompt(
"URL",
link.destination
);



if(destination===null)return;



await database.updateLink(
id,
{
title,
destination,
destination_url:destination
}
);



await loadLinks();


}





window.addEventListener(
"load",
loadLinks
);
