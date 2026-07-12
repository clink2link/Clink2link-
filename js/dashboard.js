// js/dashboard.js

async function loadDashboard(){
try{

const user=await database.getUser();

if(!user){
window.location.replace("index.html");
return;
}

const authId=user.id;

// PROFILE
const profile=await database.getProfile(authId);

if(!profile){
console.log("Profile tidak ditemukan");
return;
}

// DATE
const now=new Date();

document.getElementById("todayDate").innerHTML=
now.toLocaleString("id-ID",{
day:"2-digit",
month:"long",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
});

// ADS EARNING
document.getElementById("adsToday").innerHTML=
"Rp "+Number(profile.ads_earning_today||0).toLocaleString("id-ID");

document.getElementById("adsMonth").innerHTML=
"Rp "+Number(profile.ads_earning_month||0).toLocaleString("id-ID");

// ===========================
// SELL LINK ACCESS
// ===========================

const sellOption=document.querySelector('#linkType option[value="sell"]');
const sellCards=document.querySelectorAll(".sell-card");

const sellActive=
profile.sell_link_enabled===true ||
profile.sell_link_enabled===1 ||
profile.sell_link_enabled==="1";


if(sellActive){

sellCards.forEach(el=>{
el.classList.remove("locked");
});


if(sellOption){
sellOption.disabled=false;
sellOption.textContent="🛒 Sell Link";
}


document.getElementById("sellToday").innerHTML=
"Rp "+Number(profile.sell_earning_today||0).toLocaleString("id-ID");


document.getElementById("sellMonth").innerHTML=
"Rp "+Number(profile.sell_earning_month||0).toLocaleString("id-ID");


document.getElementById("sellInfo").innerHTML=
'<i class="fa-solid fa-circle-check"></i> Sell Link sudah aktif.';


}else{


sellCards.forEach(el=>{
el.classList.add("locked");
});


if(sellOption){
sellOption.disabled=true;
sellOption.textContent="🛒 Sell Link 🔒";
}


document.getElementById("sellInfo").innerHTML=
'<i class="fa-solid fa-lock"></i> Sell Link akan aktif setelah Withdraw berhasil minimal 1 kali.';

}

// ===========================
// CREATE LINK
// ===========================

const shortenBtn=document.getElementById("shortenBtn");

if(shortenBtn){

shortenBtn.onclick=()=>{

const url=document.getElementById("urlInput").value.trim();
const type=document.getElementById("linkType").value;

if(!url){
alert("Masukkan URL terlebih dahulu.");
return;
}

try{
new URL(url);
}catch{
alert("URL tidak valid.");
return;
}

localStorage.setItem("create_url",url);

if(type==="ads"){
window.location.href="task1.html";
}

if(type==="sell"){

if(!sellActive){
alert("Sell Link belum tersedia. Selesaikan 1x Withdraw terlebih dahulu.");
return;
}

window.location.href="bayargg.html";

}

};

}

// LINK STATISTICS
const links=await database.getLinks(authId);

let adsViews=0;
let adsClicks=0;
let sellViews=0;
let sellClicks=0;

if(links){

links.forEach(link=>{

if(link.type==="ads"){

adsViews+=Number(link.total_views||0);
adsClicks+=Number(link.total_clicks||0);

}

if(link.type==="sell"){

sellViews+=Number(link.total_views||0);
sellClicks+=Number(link.total_clicks||0);

}

});

}

document.getElementById("adsViews").innerHTML=
adsViews.toLocaleString("id-ID");

document.getElementById("adsClicks").innerHTML=
adsClicks.toLocaleString("id-ID");

const sellViewsEl=document.getElementById("sellViews");
const sellClicksEl=document.getElementById("sellClicks");

if(sellViewsEl){
sellViewsEl.innerHTML=sellViews.toLocaleString("id-ID");
}

if(sellClicksEl){
sellClicksEl.innerHTML=sellClicks.toLocaleString("id-ID");
}

// ===========================
// ADVANCED MODAL
// ===========================

const advanceBtn=document.getElementById("advanceBtn");
const advancedModal=document.getElementById("advancedModal");
const closeAdvanced=document.getElementById("closeAdvanced");
const saveAdvanced=document.getElementById("saveAdvanced");


if(advanceBtn){

advanceBtn.onclick=()=>{

advancedModal.classList.add("active");

};

}


if(closeAdvanced){

closeAdvanced.onclick=()=>{

advancedModal.classList.remove("active");

};

}


if(saveAdvanced){

saveAdvanced.onclick=()=>{


const advancedData={

alias:document.getElementById("customAlias").value.trim(),

expired:document.getElementById("expiredLink").value,

campaign:document.getElementById("campaignName").value.trim(),

device:document.getElementById("targetDevice").value

};


localStorage.setItem(
"advanced_settings",
JSON.stringify(advancedData)
);


advancedModal.classList.remove("active");


alert("Advanced Settings tersimpan.");

};


}

// ===========================
// CHART ADS
// ===========================

const reports = await database.getReports(authId);

let labels = [];
let views = [];

if(reports && reports.length){

const chartData = reports.slice(0,7).reverse();

labels = chartData.map(item=>item.report_date);
views = chartData.map(item=>Number(item.views || 0));

}else{

labels=[
"Hari 1",
"Hari 2",
"Hari 3",
"Hari 4",
"Hari 5",
"Hari 6",
"Hari 7"
];

views=[0,0,0,0,0,0,0];

}


const adsCanvas = document.getElementById("adsChart");

if(adsCanvas){

new Chart(adsCanvas,{
type:"line",

data:{
labels:labels,

datasets:[{
label:"Views",
data:views,

borderColor:"#2563eb",
backgroundColor:"rgba(37,99,235,.12)",

borderWidth:3,
fill:true,
tension:.45,

pointRadius:5,
pointHoverRadius:8,
pointBackgroundColor:"#2563eb",
pointBorderWidth:2
}]
},

options:{
responsive:true,
maintainAspectRatio:false,

interaction:{
mode:"index",
intersect:false
},

plugins:{
legend:{
display:false
},

tooltip:{
backgroundColor:"#0f172a",
padding:12,

titleFont:{
size:13
},

bodyFont:{
size:14
}
}
},

scales:{
x:{
grid:{
display:false
}
},

y:{
beginAtZero:true,

grid:{
color:"rgba(148,163,184,.15)"
}
}
}
}

});

}
// CPM
if(reports.length){

let cpm=Number(reports[0].daily_cpm||0);

document.getElementById("adsCpm").innerHTML=
cpm.toLocaleString("id-ID");

}

// REPORT TABLE
let reportHTML="";

if(reports.length){

reports.forEach(row=>{

reportHTML+=`
<tr>
<td>${row.report_date}</td>
<td>${Number(row.views||0).toLocaleString("id-ID")}</td>
<td class="earning">Rp ${Number(row.link_earnings||0).toLocaleString("id-ID")}</td>
<td>${Number(row.daily_cpm||0).toLocaleString("id-ID")}</td>
<td>Rp ${Number(row.penghasilan||0).toLocaleString("id-ID")}</td>
</tr>`;

});

}else{

reportHTML=`
<tr>
<td colspan="5">
Belum ada data report.
</td>
</tr>`;

}

document.getElementById("reportTable").innerHTML=reportHTML;

// ANNOUNCEMENT
const news=await database.getAnnouncements();

let newsHTML="";

news.forEach(item=>{

newsHTML+=`
<div style="margin-bottom:15px">
<b>${item.title}</b>
<p>${item.content}</p>
</div>`;

});

document.getElementById("announcementBox").innerHTML=
newsHTML||"Belum ada pengumuman.";

}catch(error){

console.error("Dashboard Error:",error);

}

}


// ANIMATION
document.addEventListener("DOMContentLoaded",()=>{

const cards=document.querySelectorAll(".dash-card,.dash-box,.report-card,.stats-box");

cards.forEach((item,index)=>{

item.style.opacity="0";
item.style.transform="translateY(30px)";

setTimeout(()=>{

item.style.transition=".6s";
item.style.opacity="1";
item.style.transform="translateY(0)";

},index*100);

});

});


// AUTO DARK MODE
function autoTheme(){

const jam=new Date().getHours();

if(jam>=18||jam<6){
document.body.classList.add("dark");
}else{
document.body.classList.remove("dark");
}

}

autoTheme();

setInterval(autoTheme,60000);

loadDashboard();
