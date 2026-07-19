// js/dashboard.js

async function loadDashboard(){

try{

const user=await database.getUser();

if(!user){
window.location.replace("index.html");
return;
}

const authId=user.id;

// ===========================
// PROFILE
// ===========================

const profile=await database.getProfile(authId);

if(!profile){
console.error("Profile tidak ditemukan.");
return;
}

// ===========================
// DATE
// ===========================

const now = new Date();

const dateText = now.toLocaleString("id-ID",{
day:"2-digit",
month:"long",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
});

const todayDate = document.getElementById("todayDate");
if(todayDate){
todayDate.textContent = dateText;
}

const todayDateSell = document.getElementById("todayDateSell");
if(todayDateSell){
todayDateSell.textContent = dateText;
}

const monthText = now.toLocaleString("id-ID",{
month:"long",
year:"numeric"
});

const adsMonthSelect = document.getElementById("adsMonthSelect");
if(adsMonthSelect){
adsMonthSelect.innerHTML = `<option>${monthText}</option>`;
}

const sellMonthSelect = document.getElementById("sellMonthSelect");
if(sellMonthSelect){
sellMonthSelect.innerHTML = `<option>${monthText}</option>`;
}

// ===========================
// ADS REPORT
// ===========================

const adsToday=document.getElementById("adsToday");
const adsMonth=document.getElementById("adsMonth");
const adsViewsMonth=document.getElementById("adsViewsMonth");
const currentCpm=document.getElementById("currentCpm");

if(adsToday){
adsToday.textContent=
"Rp "+Number(profile.ads_earning_today||0).toLocaleString("id-ID");
}

if(adsMonth){
adsMonth.textContent=
"Rp "+Number(profile.ads_earning_month||0).toLocaleString("id-ID");
}

if(adsViewsMonth){
adsViewsMonth.textContent=
Number(profile.total_views||0).toLocaleString("id-ID");
}

// ===========================
// SELL LINK ACCESS
// ===========================

const sellOption=document.querySelector('#linkType option[value="sell"]');
const sellCards=document.querySelectorAll(".sell-card");

const sellActive=
profile.sell_link_enabled===true||
profile.sell_link_enabled===1||
profile.sell_link_enabled==="1";

const sellToday=document.getElementById("sellToday");
const sellMonth=document.getElementById("sellMonth");
const sellLastMonth=document.getElementById("sellLastMonth");
const sellInfo=document.getElementById("sellInfo");

if(sellActive){

sellCards.forEach(card=>card.classList.remove("locked"));

if(sellOption){
sellOption.disabled=false;
sellOption.textContent="🛒 Sell Link";
}

if(sellToday){
sellToday.textContent=
"Rp "+Number(profile.sell_earning_today||0).toLocaleString("id-ID");
}

if(sellMonth){
sellMonth.textContent=
"Rp "+Number(profile.sell_earning_month||0).toLocaleString("id-ID");
}

if(sellLastMonth){
sellLastMonth.textContent=
"Rp "+Number(profile.sell_earning_last_month||0).toLocaleString("id-ID");
}

if(sellInfo){
sellInfo.innerHTML=
'<i class="fa-solid fa-circle-check"></i> Sell Link sudah aktif.';
}

}else{

sellCards.forEach(card=>card.classList.add("locked"));

if(sellOption){
sellOption.disabled=true;
sellOption.textContent="🛒 Sell Link 🔒";
}

if(sellToday){
sellToday.textContent="Rp 0";
}

if(sellMonth){
sellMonth.textContent="Rp 0";
}

if(sellLastMonth){
sellLastMonth.textContent="Rp 0";
}

if(sellInfo){
sellInfo.innerHTML=
'<i class="fa-solid fa-lock"></i> Sell Link akan aktif setelah Withdraw berhasil minimal 1 kali.';
}

}
setupCreateLink(
authId,
sellActive
);



// ===========================
// LINK STATISTICS
// ===========================

const links=await database.getLinks(authId);

let adsViews=0;
let adsClicks=0;
let sellViews=0;
let sellClicks=0;
let totalSell=0;

if(Array.isArray(links)){

links.forEach(link=>{

if(link.type==="ads"){
adsViews+=Number(link.total_views||0);
adsClicks+=Number(link.total_clicks||0);
}

if(link.type==="sell"){
sellViews+=Number(link.total_views||0);
sellClicks+=Number(link.total_clicks||0);
totalSell++;
}

});

}

const adsViewsEl=document.getElementById("adsViews");
if(adsViewsEl){
adsViewsEl.textContent=
adsViews.toLocaleString("id-ID");
}

const adsClicksEl=document.getElementById("adsClicks");
if(adsClicksEl){
adsClicksEl.textContent=
adsClicks.toLocaleString("id-ID");
}

const adsViewsMonth=document.getElementById("adsViewsMonth");
if(adsViewsMonth){
adsViewsMonth.textContent=
adsViews.toLocaleString("id-ID");
}

const sellViewsEl=document.getElementById("sellViews");
if(sellViewsEl){
sellViewsEl.textContent=
sellViews.toLocaleString("id-ID");
}

const sellClicksEl=document.getElementById("sellClicks");
if(sellClicksEl){
sellClicksEl.textContent=
sellClicks.toLocaleString("id-ID");
}

const sellTotalLink=document.getElementById("sellTotalLink");
if(sellTotalLink){
sellTotalLink.textContent=
totalSell.toLocaleString("id-ID");
}

// ===========================
// CPM SAAT INI
// ===========================

function getTodayCPM(){

const day=new Date().getDay();

const range={
0:[5000,6200], // Minggu
1:[3000,3600], // Senin
2:[3100,3700], // Selasa
3:[3200,3800], // Rabu
4:[4000,4700], // Kamis
5:[4500,5300], // Jumat
6:[3900,4500]  // Sabtu
};

const [min,max]=range[day];

return Math.floor(Math.random()*(max-min+1))+min;

}

const currentCpm=document.getElementById("currentCpm");

if(currentCpm){
currentCpm.textContent=
"Rp "+getTodayCPM().toLocaleString("id-ID");
}

// ===========================
// ADVANCED MODAL
// ===========================

const advanceBtn=document.getElementById("advanceBtn");
const advancedModal=document.getElementById("advancedModal");
const closeAdvanced=document.getElementById("closeAdvanced");
const saveAdvanced=document.getElementById("saveAdvanced");

if(advanceBtn&&advancedModal){
advanceBtn.onclick=()=>{
advancedModal.classList.add("active");
};
}

if(closeAdvanced&&advancedModal){
closeAdvanced.onclick=()=>{
advancedModal.classList.remove("active");
};
}

if(advancedModal){

advancedModal.onclick=(e)=>{

if(e.target===advancedModal){
advancedModal.classList.remove("active");
}

};

}

if(saveAdvanced&&advancedModal){

saveAdvanced.onclick=()=>{

const advancedData={

alias:document.getElementById("customAlias")?.value.trim()||"",
expired:document.getElementById("expiredLink")?.value||"never",
campaign:document.getElementById("campaignName")?.value.trim()||"",
device:document.getElementById("targetDevice")?.value||"all"

};

localStorage.setItem(
"advanced_settings",
JSON.stringify(advancedData)
);

advancedModal.classList.remove("active");

alert("Advanced Settings berhasil disimpan.");

};

}

// ===========================
// CHART ADS & SELL
// ===========================

const reports=await database.getReports(authId);

let labels=[];
let views=[];
let earnings=[];

if(Array.isArray(reports)&&reports.length){

const chartData=reports.slice(-7);

labels=chartData.map(item=>item.report_date);

views = chartData.map(item =>
Number(item.ads_views || 0)
);

earnings = chartData.map(item =>
Number(item.ads_earnings || 0)
);

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
earnings=[0,0,0,0,0,0,0];

}

const commonOptions={

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
titleFont:{size:13},
bodyFont:{size:14},
callbacks:{
label(context){

const value=context.parsed.y||0;

return context.dataset.label==="Pendapatan"
? " Rp "+value.toLocaleString("id-ID")
: " "+value.toLocaleString("id-ID");

}
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
},
ticks:{
callback(value){
return value.toLocaleString("id-ID");
}
}
}

}

};

// ===========================
// ADS CHART
// ===========================

const adsCanvas=document.getElementById("adsChart");

if(adsCanvas){

new Chart(adsCanvas,{

type:"line",

data:{

labels,

datasets:[{

label:"Pendapatan",

data:earnings,

borderColor:"#2563eb",
backgroundColor:"rgba(37,99,235,.12)",

borderWidth:3,
fill:true,
tension:.45,

pointRadius:5,
pointHoverRadius:8,
pointBackgroundColor:"#2563eb",
pointBorderWidth:2,

pointHoverBorderWidth:3

}]

},

options:commonOptions

});

}

// ===========================
// SELL CHART
// ===========================

const sellCanvas = document.getElementById("sellChart");

if (sellCanvas) {

new Chart(sellCanvas, {

type: "line",

data: {
labels,
datasets: [{
label: "Views",
data: sellActive ? views : Array(views.length).fill(0),

borderColor: "#8b5cf6",
backgroundColor: "rgba(139,92,246,.12)",

borderWidth: 3,
fill: true,
tension: .45,

pointRadius: 5,
pointHoverRadius: 8,
pointBackgroundColor: "#8b5cf6",
pointBorderWidth: 2

}]
},

options: commonOptions

});

}

// ===========================
// CPM REPORT
// ===========================

const adsCpm = document.getElementById("adsCpm");
const sellCpm = document.getElementById("sellCpm");

let lastReport = reports.length ? reports[reports.length - 1] : null;

// CPM Ads
if (adsCpm) {

    let cpm = 0;

    if (lastReport && Number(lastReport.ads_views) > 0) {
        cpm = Math.round(
            (Number(lastReport.ads_earnings) * 1000) /
            Number(lastReport.ads_views)
        );
    }

    adsCpm.textContent = cpm.toLocaleString("id-ID");
}

// CPM Sell
if (sellCpm) {

    let cpm = 0;

    if (
        sellActive &&
        lastReport &&
        Number(lastReport.sell_views) > 0
    ) {
        cpm = Math.round(
            (Number(lastReport.sell_earnings) * 1000) /
            Number(lastReport.sell_views)
        );
    }

    sellCpm.textContent = cpm.toLocaleString("id-ID");
}

// ===========================
// REPORT TABLE
// ===========================

const reportTable = document.getElementById("reportTable");

if(reportTable){

    if(reports.length){

        reportTable.innerHTML = reports.map(row => {

            const cpm =
                Number(row.ads_views || 0) > 0
                ? Math.round(
                    (Number(row.ads_earnings || 0) /
                    Number(row.ads_views || 0)) * 1000
                )
                : 0;

            return `
<tr>
<td>${row.report_date}</td>
<td>${Number(row.ads_views || 0).toLocaleString("id-ID")}</td>
<td class="earning">
Rp ${Number(row.ads_earnings || 0).toLocaleString("id-ID")}
</td>
<td>${cpm.toLocaleString("id-ID")}</td>
<td>
Rp ${Number(row.ads_earnings || 0).toLocaleString("id-ID")}
</td>
</tr>
`;

        }).join("");

    }else{

        reportTable.innerHTML = `
<tr>
<td colspan="5">
Belum ada data report.
</td>
</tr>
`;

    }

}

// ===========================
// ANNOUNCEMENT
// ===========================

const news=await database.getAnnouncements();

const announcementBox=document.getElementById("announcementBox");

if(announcementBox){

if(Array.isArray(news)&&news.length){

announcementBox.innerHTML=news.map(item=>`
<div style="margin-bottom:18px">
<b>${item.title||"Pengumuman"}</b>
<p style="margin:8px 0 0">
${item.content||""}
</p>
</div>
`).join("");

}else{

announcementBox.innerHTML="Belum ada pengumuman.";

}

}

}catch(error){

console.error("Dashboard Error:",error);

}

}

// ===========================
// ANIMATION
// ===========================

document.addEventListener("DOMContentLoaded",()=>{

const cards=document.querySelectorAll(
".dash-card,.dash-box,.report-card,.stats-box,.create-form"
);

cards.forEach((item,index)=>{

item.style.opacity="0";
item.style.transform="translateY(30px)";

setTimeout(()=>{

item.style.transition=".6s ease";
item.style.opacity="1";
item.style.transform="translateY(0)";

},index*80);

});

});

// ===========================
// AUTO DARK MODE
// ===========================

function autoTheme(){

if(localStorage.getItem("theme")==="dark"){
document.body.classList.add("dark");
return;
}

if(localStorage.getItem("theme")==="light"){
document.body.classList.remove("dark");
return;
}

const jam=new Date().getHours();

if(jam>=18||jam<6){
document.body.classList.add("dark");
}else{
document.body.classList.remove("dark");
}

}

autoTheme();

setInterval(autoTheme,60000);

// ===========================
// LOAD DASHBOARD
// ===========================

document.addEventListener("DOMContentLoaded",()=>{

loadDashboard();

const params=new URLSearchParams(location.search);

if(params.get("tab")==="statistics"){

setTimeout(()=>{

const section=document.getElementById("statistics");

if(section){

section.scrollIntoView({
behavior:"smooth",
block:"start"
});

}

},700);

}

});
