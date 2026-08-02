// ======================================================
// CLICK2PAY MY LINK SYSTEM
// ======================================================

let allLinks=[];
let filteredLinks=[];
let currentFilter="all";

const smartList=document.getElementById("smartLinkList");
const adsList=document.getElementById("adsLinkList");
const sellList=document.getElementById("sellLinkList");

const totalAdsLink=document.getElementById("totalAdsLink");
const totalAdsView=document.getElementById("totalAdsView");
const totalSellLink=document.getElementById("totalSellLink");
const totalSellRevenue=document.getElementById("totalSellRevenue");

const totalLink=document.getElementById("totalLink");
const totalView=document.getElementById("totalView");
const totalClick=document.getElementById("totalClick");
const totalEarning=document.getElementById("totalEarning");


// ======================================================
// LOAD LINKS
// ======================================================

async function loadMyLinks(){

try{

const user=await database.getUser();

if(!user){

window.location.href="index.html";

return;

}


const data=
await database.getLinks(user.id);


allLinks=data||[];

window.allLinks=allLinks;


await checkSellAccess(user);


updateStats();


applyCurrentFilter();


}catch(err){

console.error(
"LOAD LINK ERROR:",
err
);


if(smartList){

smartList.innerHTML=`

<div class="empty">

<i class="fa-solid fa-circle-xmark"></i>

<h3>Gagal Memuat Link</h3>

<p>${err.message}</p>

</div>

`;

}

}

}


// ======================================================
// CHECK SELL ACCESS
// ======================================================

async function checkSellAccess(user){

try{

const linkType=document.getElementById("linkType");
const sellInfo=document.getElementById("sellInfo");

if(!linkType||!sellInfo)return;


const profile=await database.getProfile(user.id);


const active=
profile &&
(
profile.sell_link_enabled===true ||
Number(profile.withdraw_count||0)>=3
);


const option=linkType.querySelector(
"option[value='sell']"
);


if(active){

if(option)
option.disabled=false;


sellInfo.innerHTML = `
<span class="status-success">
    <i class="fa-solid fa-circle-check"></i>
    Sell Link sudah aktif
</span>
`;

}else{

if(option)
option.disabled=true;


linkType.value="ads";


sellInfo.innerHTML = `
<span class="status-danger">
    <i class="fa-solid fa-lock"></i>
    Sell Link belum aktif
</span>
`;

}


}catch(err){

console.error(
"SELL ACCESS ERROR:",
err
);

}

}


// ======================================================
// HELPER
// ======================================================

function getLinkType(link){

return(
link.link_type||
link.type||
"ads"
).toLowerCase();

}


function getShortUrl(link){

if(link.short_url){
return link.short_url;
}


if(link.short_code){

return `${location.origin}/s/${link.short_code}`;

}


return "-";

}


function getDestination(link){

return(
link.destination_url ||
link.destination ||
"-"
);

}


// ======================================================
// UPDATE STATS
// ======================================================

function updateStats(){

const adsLinks=allLinks.filter(
link=>getLinkType(link)==="ads"
);

const sellLinks=allLinks.filter(
link=>getLinkType(link)==="sell"
);

const views=allLinks.reduce(
(a,b)=>a+Number(b.total_views||b.views||0),0
);

const clicks=allLinks.reduce(
(a,b)=>a+Number(b.total_clicks||b.clicks||0),0
);

const earnings=allLinks.reduce(
(a,b)=>a+Number(b.total_earnings||b.earnings||0),0
);

const adsViews=adsLinks.reduce(
(a,b)=>a+Number(b.total_views||b.views||0),0
);

const sellRevenue=sellLinks.reduce(
(a,b)=>a+Number(
b.seller_receive ||
b.total_earnings ||
b.earnings ||
0
),0
);


if(totalLink)
totalLink.textContent=allLinks.length;

if(totalView)
totalView.textContent=views.toLocaleString("id-ID");

if(totalClick)
totalClick.textContent=clicks.toLocaleString("id-ID");

if(totalEarning)
totalEarning.textContent=
"Rp"+earnings.toLocaleString("id-ID");


if(totalAdsLink)
totalAdsLink.textContent=adsLinks.length;

if(totalAdsView)
totalAdsView.textContent=
adsViews.toLocaleString("id-ID");

if(totalSellLink)
totalSellLink.textContent=sellLinks.length;

if(totalSellRevenue)
totalSellRevenue.textContent=
"Rp"+sellRevenue.toLocaleString("id-ID");

}


// ======================================================
// RENDER LINKS
// ======================================================

function renderAllLinks(){

renderLinkBox(
smartList,
filteredLinks,
"Belum Ada Smart Link"
);

renderLinkBox(
adsList,
filteredLinks.filter(
x=>getLinkType(x)==="ads"
),
"Belum Ada Ads Link"
);

renderLinkBox(
sellList,
filteredLinks.filter(
x=>getLinkType(x)==="sell"
),
"Belum Ada Sell Link"
);


updateCount(
"smartCount",
filteredLinks.length
);

updateCount(
"adsCount",
filteredLinks.filter(
x=>getLinkType(x)==="ads"
).length
);

updateCount(
"sellCount",
filteredLinks.filter(
x=>getLinkType(x)==="sell"
).length
);

}


// ======================================================
// RENDER BOX
// ======================================================

function renderLinkBox(box,list,msg){

if(!box)return;


if(!list.length){

box.innerHTML=`
<div class="empty">
<i class="fa-solid fa-link-slash"></i>
<h3>${msg}</h3>
<p>Link kamu akan tampil disini.</p>
</div>`;

return;

}


box.innerHTML=list.map(
link=>createLinkCard(link)
).join("");

}


// ======================================================
// COUNT
// ======================================================

function updateCount(id,total){

const el=document.getElementById(id);

if(el)
el.textContent=total+" Link";

}


// ======================================================
// CREATE CARD
// ======================================================

function createLinkCard(link){

const type=getLinkType(link);

const short=getShortUrl(link);

const destination=getDestination(link);

const views=Number(
link.total_views ||
link.views ||
0
);

const clicks=Number(
link.total_clicks ||
link.clicks ||
0
);

const earn=Number(
link.total_earnings ||
link.earnings ||
0
);


return`

<div class="link-card">

<div class="link-top">
<h3>${link.title||"Smart Link"}</h3>
</div>


<div class="link-meta">

<span>
<i class="fa-solid fa-eye"></i>
${views.toLocaleString("id-ID")} View
</span>

<span>
<i class="fa-solid fa-computer-mouse"></i>
${clicks.toLocaleString("id-ID")} Click
</span>

<span>
<i class="fa-solid fa-calendar"></i>
${formatDate(link.created_at)}
</span>

</div>


<div class="destination-link">

<i class="fa-solid fa-globe"></i>

<a href="${destination}" target="_blank">
${destination}
</a>

</div>


<div class="badge-group">

<span class="badge ${type==="ads"?"blue":"orange"}">
${type.toUpperCase()} LINK
</span>

<span class="badge green">
Rp ${earn.toLocaleString("id-ID")}
</span>

</div>


<div class="advanced-info">


${link.alias ? `
<span>
<i class="fa-solid fa-tag"></i>
${link.alias}
</span>
`:""}



${link.campaign ? `
<span>
<i class="fa-solid fa-bullseye"></i>
${link.campaign}
</span>
`:""}



${link.device ? `
<span>
<i class="fa-solid fa-mobile-screen"></i>
${link.device}
</span>
`:""}



</div>


<div class="copy-box">

<input readonly value="${short}">

<button class="btn-copy" onclick="copyLink('${short}')">
<i class="fa-solid fa-copy"></i>
</button>

</div>


<div class="link-actions">

<button class="btn-edit"
onclick="editLink('${link.id}')">

<i class="fa-solid fa-pen"></i>
Edit

</button>


<button class="btn-delete"
onclick="deleteLink('${link.id}')">

<i class="fa-solid fa-trash"></i>
Hapus

</button>

</div>


</div>

`;

}


// ======================================================
// EDIT LINK
// ======================================================

window.editLink=function(id){

const link=allLinks.find(
x=>x.id==id
);

if(!link)return;


document.getElementById("editModal")
.classList.add("active");


document.getElementById("editId").value=link.id;

document.getElementById("editTitle").value=
link.title||"";

document.getElementById("editUrl").value=
getDestination(link);

};


// ======================================================
// SAVE EDIT
// ======================================================

window.saveEdit=async function(){

try{

const id=document.getElementById("editId").value;

await database.updateLink(
id,
{
title:
document.getElementById("editTitle").value.trim(),

destination:
document.getElementById("editUrl").value.trim(),

destination_url:
document.getElementById("editUrl").value.trim()
}
);


closeEdit();

await loadMyLinks();


alert("Link berhasil diperbarui.");


}catch(err){

console.error(err);

alert(
"Gagal memperbarui link."
);

}

};


// ======================================================
// CLOSE EDIT
// ======================================================

window.closeEdit=function(){

const modal=
document.getElementById("editModal");

if(modal)
modal.classList.remove("active");

};


// ======================================================
// CANCEL EDIT
// ======================================================

document
.getElementById("cancelEditBtn")
?.addEventListener(
"click",
()=>{

closeEdit();

}
);


document
.getElementById("closeEditBtn")
?.addEventListener(
"click",
()=>{

closeEdit();

}
);


// ======================================================
// DELETE LINK
// ======================================================

window.deleteLink=async function(id){

if(!confirm(
"Yakin ingin menghapus link ini?"
))
return;


try{

await database.deleteLink(id);

await loadMyLinks();


alert(
"Link berhasil dihapus."
);


}catch(err){

console.error(err);

alert(
"Gagal menghapus link."
);

}

};


// ======================================================
// COPY LINK
// ======================================================

window.copyLink=async function(url){

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
// SEARCH
// ======================================================

window.searchLinks=function(){

applyCurrentFilter();

};


// ======================================================
// FILTER
// ======================================================

window.filterLink=function(type,btn){

currentFilter=type;


document
.querySelectorAll(".link-filter button")
.forEach(x=>{

x.classList.remove("active");

});


if(btn)
btn.classList.add("active");


applyCurrentFilter();

};


// ======================================================
// APPLY FILTER
// ======================================================

function applyCurrentFilter(){

let data=[...allLinks];


const keyword=
(
document.getElementById("searchLink")?.value||""
)
.toLowerCase()
.trim();


if(keyword){

data=data.filter(link=>{


const title=
(link.title||"")
.toLowerCase();


const url=
getDestination(link)
.toLowerCase();


const short=
getShortUrl(link)
.toLowerCase();


const type=
getLinkType(link)
.toLowerCase();


return(
title.includes(keyword) ||
url.includes(keyword) ||
short.includes(keyword) ||
type.includes(keyword)
);


});

}


if(currentFilter!=="all"){

data=data.filter(
link=>getLinkType(link)===currentFilter
);

}


filteredLinks=data;


renderAllLinks();


const smartPanel=
document.getElementById("smartPanel");

const adsPanel=
document.getElementById("adsPanel");

const sellPanel=
document.getElementById("sellPanel");


if(!smartPanel||
!adsPanel||
!sellPanel)
return;


smartPanel.style.display="";
adsPanel.style.display="";
sellPanel.style.display="";


if(currentFilter==="ads"){

smartPanel.style.display="none";
sellPanel.style.display="none";

}


if(currentFilter==="sell"){

smartPanel.style.display="none";
adsPanel.style.display="none";

}

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date){

if(!date)
return "-";


return new Date(date)
.toLocaleString(
"id-ID",
{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
);

}


// ======================================================
// ADVANCED SETTINGS
// ======================================================

document
.getElementById("saveAdvanced")
?.addEventListener(
"click",
()=>{


const data={

alias:
document.getElementById("customAlias").value.trim(),

expired:
document.getElementById("expiredLink").value,

campaign:
document.getElementById("campaignName").value.trim(),

device:
document.getElementById("targetDevice").value

};


localStorage.setItem(
"advanced_settings",
JSON.stringify(data)
);


document
.getElementById("advancedModal")
.classList.remove("active");


alert(
"Advanced Settings berhasil disimpan."
);


}
);


// ======================================================
// OPEN ADVANCED MODAL
// ======================================================

document
.getElementById("advanceBtn")
?.addEventListener(
"click",
()=>{

document
.getElementById("advancedModal")
?.classList.add("active");

}
);


// ======================================================
// CLOSE ADVANCED MODAL
// ======================================================

document
.getElementById("closeAdvanced")
?.addEventListener(
"click",
()=>{

document
.getElementById("advancedModal")
?.classList.remove("active");

}
);


window.addEventListener(
"click",
e=>{

const modal=
document.getElementById("advancedModal");


if(e.target===modal){

modal.classList.remove("active");

}

});


// ======================================================
// CREATE SMART LINK
// ======================================================

document
.getElementById("shortenBtn")
?.addEventListener(
"click",
async()=>{


const input=document.getElementById("urlInput");

const url=input.value.trim();


const type=document.getElementById("linkType").value;


if(!url){

alert(
"Masukkan Destination URL."
);

return;

}



try{


const user=
await database.getUser();



if(!user){

window.location.href="index.html";

return;

}



let advanced={};


try{

advanced=
JSON.parse(
localStorage.getItem("advanced_settings")
)||{};


}catch{

advanced={};

}




const code=
Math.random()
.toString(36)
.substring(2,8);




await database.createLink({

user_id:user.id,


title:
advanced.campaign ||
"Smart Link",


destination:url,


destination_url:url,


short_code:code,


type:type,


link_type:type,


price:0,


status:"active",



// ADVANCED SETTINGS

alias:
advanced.alias || null,


campaign:
advanced.campaign || null,


expired:
advanced.expired || "never",


device:
advanced.device || "all"

});



input.value="";



localStorage.removeItem(
"advanced_settings"
);



await loadMyLinks();



alert(
"Smart Link berhasil dibuat."
);



}catch(err){


console.error(
"CREATE LINK ERROR:",
err
);



alert(
"Gagal membuat link."
);



}



});


// ======================================================
// ESC CLOSE MODAL
// ======================================================

window.addEventListener(
"keydown",
e=>{

if(e.key==="Escape"){

document
.getElementById("editModal")
?.classList.remove("active");


document
.getElementById("advancedModal")
?.classList.remove("active");

}

});


// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(
()=>{

loadMyLinks();

},
30000
);


// ======================================================
// INIT
// ======================================================

document.addEventListener(
"DOMContentLoaded",
async()=>{

await loadMyLinks();

}
);
