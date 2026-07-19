let allLinks=[];
let filteredLinks=[];

const linkList=document.getElementById("linkList");
const totalLink=document.getElementById("totalLink");
const totalView=document.getElementById("totalView");
const totalClick=document.getElementById("totalClick");
const totalEarning=document.getElementById("totalEarning");

async function getCurrentUser(){
try{
const user=await database.getUser();
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

const user=await getCurrentUser();
if(!user)return;

allLinks=await database.getLinks(user.id)||[];
filteredLinks=[...allLinks];

updateStats();
applyFilter();

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
return Number(link[key1]??link[key2]??0);
}

function updateStats(){

totalLink.textContent=allLinks.length;

let views=0;
let clicks=0;
let earnings=0;

allLinks.forEach(link=>{

views+=getValue(link,"total_views","views");
clicks+=getValue(link,"total_clicks","clicks");
earnings+=getValue(link,"total_earnings","earnings");

});

totalView.textContent=views.toLocaleString("id-ID");
totalClick.textContent=clicks.toLocaleString("id-ID");
totalEarning.textContent="Rp "+earnings.toLocaleString("id-ID");

}

function renderLinks(){

if(!filteredLinks.length){
linkList.innerHTML=`
<div class="empty">
<i class="fa-solid fa-link-slash"></i>
<h3>Belum Ada Ads Link</h3>
<p>Silakan buat Ads Link pertama Anda.</p>
</div>`;
return;
}

linkList.innerHTML=filteredLinks.map(link=>{

const shortCode=link.short_code||link.shortcode||link.code||link.slug||"";
const url=`${location.origin}/s/${shortCode}`;
const status=link.status==="active";

return`

<div class="link-card">

<h3>${link.title||"Tanpa Judul"}</h3>

<div class="link-meta">

<a href="dashboard.html?tab=statistics&id=${link.id}">
<i class="fa-solid fa-chart-column"></i>
Stats
</a>

<span>
<i class="fa-regular fa-calendar"></i>
${new Date(link.created_at).toLocaleDateString("id-ID")}
</span>

<span>
${new URL(link.destination_url||link.destination).hostname}
</span>

</div>

<div class="created">
Created on : <b>Website</b>
</div>

<div class="destination-link">
<i class="fa-solid fa-globe"></i>
<a href="${link.destination_url||link.destination}"
target="_blank"
rel="noopener noreferrer">
${link.destination_url||link.destination}
</a>
</div>

<div class="badge-group">

<span class="badge pink">
Ads Link
</span>

<span class="badge ${status?"green":"pink"}">
${status?"Aktif":"Nonaktif"}
</span>

</div>

<div class="copy-box">

<input
readonly
value="${url}">

<button onclick="copyLink('${url}')">

<i class="fa-regular fa-copy"></i>

</button>

</div>

<div class="action-btn">

<button class="btn-blue"
onclick="editLink('${link.id}')">

Edit

</button>

<button class="btn-orange"
onclick="deleteLink('${link.id}')">

Hide

</button>

</div>

</div>

`;

}).join("");

}

// SEARCH

const searchInput=document.getElementById("searchInput");
const filterButtons=document.querySelectorAll(".link-filter button");

let currentFilter="all";

function applyFilter(){

const key=(searchInput?.value||"").toLowerCase().trim();

filteredLinks=allLinks.filter(link=>{

const matchSearch=
(link.title||"").toLowerCase().includes(key)||
(link.destination||"").toLowerCase().includes(key)||
(link.destination_url||"").toLowerCase().includes(key)||
(link.short_code||link.shortcode||link.code||link.slug||"").toLowerCase().includes(key);

let matchFilter=true;

switch(currentFilter){

case"active":
matchFilter=link.status==="active";
break;

case"expired":
matchFilter=link.status==="expired"||link.status==="inactive";
break;

default:
matchFilter=true;

}

return matchSearch&&matchFilter;

});

renderLinks();

}

if(searchInput){
searchInput.addEventListener("input",applyFilter);
}

filterButtons.forEach(btn=>{
btn.addEventListener("click",()=>{

filterButtons.forEach(b=>b.classList.remove("active"));
btn.classList.add("active");

currentFilter=btn.dataset.filter;

applyFilter();

});
});

// CREATE

const createForm=document.getElementById("createForm");

if(createForm){

createForm.addEventListener("submit",async e=>{

e.preventDefault();

const title=document.getElementById("linkName").value.trim();
const destination=document.getElementById("linkUrl").value.trim();

if(!title||!destination){

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

const user=await getCurrentUser();
if(!user)return;

const short_code=crypto.randomUUID()
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
total_views:0,
total_clicks:0,
total_earnings:0,
link_type:"ads"

});

createForm.reset();

await loadLinks();
applyFilter();

document.getElementById("createResult").innerHTML=`
<div class="create-success">
<div class="link-title">
<i class="fa-solid fa-circle-check"></i>
Ads Link berhasil dibuat
</div>
<div class="link-url">
${location.origin}/s/${short_code}
</div>
</div>
`;

}catch(err){

console.error("CREATE ERROR:",err);

alert(err.message);

}

});

}

async function copyLink(url){

try{

if(navigator.clipboard){
await navigator.clipboard.writeText(url);
}else{
const input=document.createElement("input");
input.value=url;
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

}

async function deleteLink(id){

if(!confirm("Yakin ingin menghapus link ini?"))return;

try{

await database.deleteLink(id);

await loadLinks();
applyFilter();

}catch(err){

console.error(err);

alert(err.message);

}

}

async function editLink(id){

const link=allLinks.find(item=>item.id===id);

if(!link)return;

document.getElementById("editId").value=id;

document.getElementById("editTitle").value=
link.title||"";

document.getElementById("editUrl").value=
link.destination_url||link.destination||"";

document
.getElementById("editModal")
.classList.add("show");

}

function closeEdit(){

document
.getElementById("editModal")
.classList.remove("show");

}

async function saveEdit(){

const id=document.getElementById("editId").value;

const title=document.getElementById("editTitle").value.trim();

const destination=document.getElementById("editUrl").value.trim();

if(!title||!destination){

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
destination_url:destination
});

closeEdit();

await loadLinks();
applyFilter();

alert("Link berhasil diperbarui.");

}catch(err){

console.error(err);

alert(err.message);

}

}

window.addEventListener("click",e=>{

const modal=document.getElementById("editModal");

if(e.target===modal){

closeEdit();

}

});

window.addEventListener("keydown",e=>{

if(e.key==="Escape"){

closeEdit();

}

});

window.addEventListener("load",loadLinks);

