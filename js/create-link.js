let allLinks=[],filteredLinks=[];
const linkList=document.getElementById("linkList"),totalLink=document.getElementById("totalLink"),totalView=document.getElementById("totalView"),totalClick=document.getElementById("totalClick"),totalEarning=document.getElementById("totalEarning");

async function getCurrentUser(){
try{
const user=await database.getUser();
if(!user){
location.replace("index.html");
return null;
}
return user;
}catch(e){
console.error(e);
location.replace("index.html");
return null;
}
}

async function loadLinks(){
try{
const user=await getCurrentUser();
if(!user)return;
allLinks=await database.getLinks(user.id);
filteredLinks=[...allLinks];
updateStats();
renderLinks();
}catch(err){
console.error(err);
linkList.innerHTML=`
<div class="empty">
<i class="fa-solid fa-circle-xmark"></i>
<h3>Gagal Memuat Data</h3>
<p>${err.message}</p>
</div>`;
}
}

function updateStats(){
totalLink.textContent=allLinks.length;
let views=0,clicks=0,earning=0;
allLinks.forEach(link=>{
views+=Number(link.total_views||0);
clicks+=Number(link.total_clicks||0);
earning+=Number(link.total_earnings||0);
});
totalView.textContent=views.toLocaleString("id-ID");
totalClick.textContent=clicks.toLocaleString("id-ID");
totalEarning.textContent="Rp "+earning.toLocaleString("id-ID");
}

function renderLinks(){
if(!filteredLinks.length){
linkList.innerHTML=`
<div class="empty">
<i class="fa-solid fa-link-slash"></i>
<h3>Belum Ada Link</h3>
<p>Silakan buat Link pertama Anda.</p>
</div>`;
return;
}

linkList.innerHTML=filteredLinks.map(link=>`
<div class="link-card">

<div class="link-top">
<div class="link-left">
<div class="link-title">${link.title||"Tanpa Judul"}</div>
<div class="link-url">${location.origin}/s/${link.short_code}</div>
</div>
<div class="link-type ${link.type}">
${(link.type||"ads").toUpperCase()}
</div>
</div>

<div class="link-stats">

<div class="link-stat">
<h5>View</h5>
<span>${Number(link.total_views||0).toLocaleString("id-ID")}</span>
</div>

<div class="link-stat">
<h5>Click</h5>
<span>${Number(link.total_clicks||0).toLocaleString("id-ID")}</span>
</div>

<div class="link-stat">
<h5>Earning</h5>
<span>Rp ${Number(link.total_earnings||0).toLocaleString("id-ID")}</span>
</div>

<div class="link-stat">
<h5>Status</h5>
<span class="${link.status==="active"?"status-success":"status-danger"}">
${link.status==="active"?"Aktif":"Nonaktif"}
</span>
</div>

</div>

<div class="link-actions">

<button class="copy-btn" onclick="copyLink('${location.origin}/s/${link.short_code}')">
<i class="fa-solid fa-copy"></i>Copy
</button>

<button class="edit-btn" onclick="editLink('${link.id}')">
<i class="fa-solid fa-pen"></i>Edit
</button>

<button class="delete-btn" onclick="deleteLink('${link.id}')">
<i class="fa-solid fa-trash"></i>Hapus
</button>

</div>

</div>
`).join("");
}
const searchInput=document.getElementById("searchInput");
if(searchInput){
searchInput.addEventListener("input",()=>{
const keyword=searchInput.value.trim().toLowerCase();
filteredLinks=allLinks.filter(link=>
(link.title||"").toLowerCase().includes(keyword)||
(link.destination||"").toLowerCase().includes(keyword)||
(link.short_code||"").toLowerCase().includes(keyword)
);
renderLinks();
});
}

document.querySelectorAll(".link-filter button").forEach(btn=>{
btn.onclick=()=>{
document.querySelectorAll(".link-filter button").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
const type=btn.dataset.filter;
filteredLinks=type==="all"?[...allLinks]:allLinks.filter(link=>link.type===type);
renderLinks();
};
});

const createForm=document.getElementById("createForm");

if(createForm){

createForm.addEventListener("submit",async e=>{

e.preventDefault();

const title=document.getElementById("linkName").value.trim();
const destination=document.getElementById("linkUrl").value.trim();
const type=document.getElementById("linkType").value;

if(!title||!destination){
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

const user=await getCurrentUser();

if(!user)return;

const short_code=Math.random().toString(36).substring(2,10);

await database.createLink({

user_id:user.id,
title,
destination,
type,
short_code,
status:"active",
views:0,
clicks:0,
earnings:0,
total_views:0,
total_clicks:0,
total_earnings:0,
created_at:new Date().toISOString()

});

createForm.reset();

await loadLinks();

alert("Link berhasil dibuat.");

}catch(err){

console.error(err);

alert("Gagal membuat link.");

}

});

}

async function copyLink(url){

try{

await navigator.clipboard.writeText(url);

alert("Link berhasil disalin.");

}catch{

const input=document.createElement("input");
input.value=url;
document.body.appendChild(input);
input.select();
document.execCommand("copy");
input.remove();

alert("Link berhasil disalin.");

}

}

async function editLink(id){

const link=allLinks.find(i=>i.id===id);

if(!link)return;

const title=prompt("Nama Link",link.title||"");
if(title===null)return;

const destination=prompt("URL Tujuan",link.destination||"");
if(destination===null)return;

try{
new URL(destination);
}catch{
alert("URL tidak valid.");
return;
}
try{

await database.updateLink(id,{
title,
destination
});

await loadLinks();

alert("Link berhasil diperbarui.");

}catch(err){

console.error(err);

alert("Gagal mengubah link.");

}

}

async function deleteLink(id){

if(!confirm("Yakin ingin menghapus link ini?"))return;

try{

await database.deleteLink(id);

await loadLinks();

alert("Link berhasil dihapus.");

}catch(err){

console.error(err);

alert("Gagal menghapus link.");

}

}

async function refreshLinks(){

await loadLinks();

}

window.addEventListener("load",loadLinks);
