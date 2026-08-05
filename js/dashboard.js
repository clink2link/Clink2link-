// js/dashboard.js

let adsChartInstance=null;
let sellChartInstance=null;
let marketChartInstance=null;
let marketData=[];

async function loadDashboard(){

try{

const profile = await database.getCurrentProfile();

if(!profile){
    window.location.replace("index.html");
    return;
}

const authId = profile.id;

// ===========================
// PROFILE
// ===========================

window.currentUserCountry = profile.country || "Indonesia";


const countryNotice = document.getElementById("countryNotice");

if(countryNotice){
    countryNotice.textContent =
        `Data CPM berdasarkan negara ${window.currentUserCountry}`;
}

const sellToday=document.getElementById("sellToday");
const sellMonth=document.getElementById("sellMonth");
const sellLastMonth=document.getElementById("sellLastMonth");

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
// LINK STATISTICS
// ===========================

const links = await database.getLinks(authId);

const sellOrders = await database.getSellOrders(authId);


console.log(
    "SELL LINKS:",
    links
);

console.log(
    "SELL ORDERS:",
    sellOrders
);

let adsViews = 0;
let adsClicks = 0;

let totalSellViews = 0;
let totalSellClicks = 0;
let totalSell = 0;
let totalSellPrice = 0;
let totalSold = 0;


// ===========================
// PROCESS LINKS
// ===========================

if(Array.isArray(links)){

links.forEach(link=>{


if(link.type==="ads"){

    adsViews += Number(
        link.total_views ||
        link.views ||
        0
    );

    adsClicks += Number(
        link.total_clicks ||
        link.clicks ||
        0
    );

}


// ===========================
// SELL LINK
// ===========================

if(
    link.type === "sell" ||
    link.link_type === "sell" ||
    link.type === "sell_link" ||
    link.link_type === "sell_link"
){

    totalSell++;


    totalSellViews += Number(
        link.total_views ??
        link.views ??
        0
    );


    totalSellClicks += Number(
        link.total_clicks ??
        link.clicks ??
        0
    );


}

// ===========================
// SELL ORDERS
// ===========================

if(Array.isArray(sellOrders)){

sellOrders.forEach(order=>{


    totalSold += Number(
        order.quantity ??
        order.qty ??
        1
    );


    totalSellPrice += Number(
        order.price ??
        order.amount ??
        order.total_price ??
        0
    );


});

}

// ===========================
// DISPLAY ADS
// ===========================

const adsViewsEl=document.getElementById("adsViews");

if(adsViewsEl){

adsViewsEl.textContent =
adsViews.toLocaleString("id-ID");

}


const adsClicksEl=document.getElementById("adsClicks");

if(adsClicksEl){

adsClicksEl.textContent =
adsClicks.toLocaleString("id-ID");

}


const adsViewsMonthEl=document.getElementById("adsViewsMonth");

if(adsViewsMonthEl){

adsViewsMonthEl.textContent =
adsViews.toLocaleString("id-ID");

}



// ===========================
// DISPLAY SELL
// ===========================

const sellViewsEl=document.getElementById("sellViews");

if(sellViewsEl){

    sellViewsEl.textContent =
    Number(totalSellViews || 0)
    .toLocaleString("id-ID");

}



const sellClicksEl=document.getElementById("sellClicks");

if(sellClicksEl){

    sellClicksEl.textContent =
    Number(totalSellClicks || 0)
    .toLocaleString("id-ID");

}



const sellTotalLink=document.getElementById("sellTotalLink");

if(sellTotalLink){

    sellTotalLink.textContent =
    Number(totalSell || 0)
    .toLocaleString("id-ID");

}



const sellTotalPrice =
document.getElementById("sellTotalPrice");


if(sellTotalPrice){

    sellTotalPrice.textContent =
    "Rp " +
    Number(totalSellPrice || 0)
    .toLocaleString("id-ID");

}



const sellTotalSold =
document.getElementById("sellTotalSold");


if(sellTotalSold){

    sellTotalSold.textContent =
    Number(totalSold || 0)
    .toLocaleString("id-ID");

}


// DEBUG SELL STATISTIC

console.log("SELL STATISTIC:",{
    totalSellViews,
    totalSellClicks,
    totalSell,
    totalSellPrice,
    totalSold
});

// ===========================
// SELL EARNING PROFILE
// ===========================

if(sellToday){

sellToday.textContent =
"Rp " +
Number(
profile.sell_earning_today || 0
)
.toLocaleString("id-ID");

}



if(sellMonth){

sellMonth.textContent =
"Rp " +
Number(
profile.sell_earning_month || 0
)
.toLocaleString("id-ID");

}



if(sellLastMonth){

sellLastMonth.textContent =
"Rp " +
Number(
profile.sell_earning_total || 0
)
.toLocaleString("id-ID");

}

// ===========================
// CPM SAAT INI (REAL)
// ===========================

const currentCpm=document.getElementById("currentCpm");

if(currentCpm){

let cpm=0;

const views=Number(profile.total_views || 0);
const earning=Number(profile.ads_earning_total || 0);

if(views>0){

cpm = Math.round(
earning / (views / 1000)
);
}

currentCpm.textContent=
"Rp "+cpm.toLocaleString("id-ID");

}

// ===========================
// CHART ADS & SELL
// ===========================

const reports=await database.getReports(authId)||[];

console.log(
    "REPORT DATA:",
    reports
);

let labels = [];
let earnings = [];
let sellViewsChart = [];

if(reports.length){

const chartData=reports.slice(-7);

labels=chartData.map(item=>{
const date=new Date(item.report_date);
return date.toLocaleDateString("id-ID",{
day:"2-digit",
month:"short"
});
});

sellViewsChart = chartData.map(item =>
    Number(
        item.sell_views ||
        item.sell_total_views ||
        item.total_sell_views ||
        item.sell_clicks ||
        0
    )
);

earnings = chartData.map(item =>
    Number(item.ads_earnings || 0)
);

}else{

const today=new Date();

for(let i=6;i>=0;i--){

const date=new Date();
date.setDate(today.getDate()-i);

labels.push(
date.toLocaleDateString("id-ID",{
day:"2-digit",
month:"short"
})
);

earnings.push(0);
sellViewsChart.push(0);

}

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
callbacks:{
label(context){

const value=Number(context.parsed.y||0);

if(context.dataset.label==="Pendapatan"){
return " Rp "+value.toLocaleString("id-ID");
}

return " "+value.toLocaleString("id-ID")+" views";

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
return Number(value).toLocaleString("id-ID");
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

if(adsChartInstance){
adsChartInstance.destroy();
}

adsChartInstance=new Chart(adsCanvas,{

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
// CPM MARKET REAL DATA
// ===========================

const marketList = document.getElementById("cpmMarketList");

const market = await database.getCPMMarket();

marketData = market || [];

if (marketList && marketData.length) {

    marketList.innerHTML = marketData.map(item => `
        <div class="market-row"
             onclick="selectCountry(${item.id})">

            <div class="flag">
                ${item.flag || "🌍"}
            </div>

            <div>
                <div class="country">${item.country}</div>

                <div class="spark">
                    <span style="width:${item.trend || 50}%"></span>
                </div>
            </div>

            <div class="market-price">
                <b>Rp ${Number(item.cpm).toLocaleString("id-ID")}</b>

                <div class="market-change ${Number(item.change)>=0?"up":"down"}">
                    ${Number(item.change)>=0?"▲":"▼"}
                    ${Math.abs(Number(item.change)).toFixed(2)}%
                </div>
            </div>

        </div>
    `).join("");

    selectCountry(marketData[0].id);

}else{

    if(marketList){
        marketList.innerHTML =
        "<div>Belum ada data CPM.</div>";
    }

}

// ===========================
// SELL CHART
// ===========================

const sellCanvas = document.getElementById("sellChart");

if (sellCanvas) {


    if(sellChartInstance){
        sellChartInstance.destroy();
    }


    sellChartInstance = new Chart(sellCanvas, {

        type:"line",

        data:{

            labels,

            datasets:[{

                label:"Sell Link Views",

                data:sellViewsChart,


                borderColor:"#8b5cf6",

                backgroundColor:
                "rgba(139,92,246,.12)",


                borderWidth:3,

                fill:true,

                tension:.45,


                pointRadius:5,

                pointHoverRadius:8,


                pointBackgroundColor:"#8b5cf6",

                pointBorderWidth:2

            }]

        },


        options:{

            ...commonOptions,


            plugins:{

                ...commonOptions.plugins,


                tooltip:{

                    ...commonOptions.plugins.tooltip,


                    callbacks:{


                        label(context){


                            return (
                                " " +
                                Number(
                                    context.parsed.y || 0
                                )
                                .toLocaleString("id-ID") +
                                " views"
                            );


                        }


                    }

                }

            }

        }

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

// ===========================
// CPM SELL
// ===========================

if (sellCpm) {

    let cpm = 0;


    if(lastReport){

        const sellViews = Number(
            lastReport.sell_total_views ??
            lastReport.sell_views ??
            0
        );


        const sellEarnings = Number(
            lastReport.sell_total_earnings ??
            lastReport.sell_earnings ??
            lastReport.total_sell_earnings ??
            0
        );


        if(sellViews > 0){

            cpm = Math.round(
                (sellEarnings * 1000) /
                sellViews
            );

        }

    }


    sellCpm.textContent =
    "Rp " + cpm.toLocaleString("id-ID");

}

// ===========================
// REPORT TABLE
// ===========================

const reportTable = document.getElementById("reportTable");

if (reportTable) {

    if (reports.length) {

        reportTable.innerHTML = reports.map(row => {

            const adsViews = Number(row.ads_views || 0);
            const adsEarnings = Number(row.ads_earnings || 0);
            const totalEarnings = Number(
                row.total_earnings ?? row.ads_earnings ?? 0
            );

            const cpm = adsViews > 0
                ? Math.round((adsEarnings * 1000) / adsViews)
                : 0;

            return `
<tr>
    <td>${new Date(row.report_date).toLocaleDateString("id-ID")}</td>
    <td>${adsViews.toLocaleString("id-ID")}</td>
    <td class="earning">
        Rp ${adsEarnings.toLocaleString("id-ID")}
    </td>
    <td>${cpm.toLocaleString("id-ID")}</td>
    <td>
        Rp ${totalEarnings.toLocaleString("id-ID")}
    </td>
</tr>
`;

        }).join("");

    } else {

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
// SELL REPORT TABLE
// ===========================

const sellReportTable =
document.getElementById("sellReportTable");

if(sellReportTable){

    console.log("SELL REPORT DATA:", sellOrders);


    if(Array.isArray(sellOrders) && sellOrders.length){


        sellReportTable.innerHTML =
        sellOrders.map(order=>{


            const date =
            new Date(
                order.created_at ||
                order.date ||
                Date.now()
            )
            .toLocaleDateString("id-ID");


            const qty =
            Number(
                order.quantity ||
                order.qty ||
                1
            );


            const price =
            Number(
                order.price ||
                order.amount ||
                order.total_price ||
                0
            );


            const receive =
            Number(
                order.seller_receive ||
                order.seller_earning ||
                order.earning ||
                price
            );


            const status =
            order.status ||
            "success";


            return `
<tr>

<td>
${date}
</td>


<td>
${qty}x
</td>


<td class="earning">
Rp ${receive.toLocaleString("id-ID")}
</td>


<td>
${status}
</td>


<td>
Rp ${price.toLocaleString("id-ID")}
</td>


</tr>
`;

        }).join("");


    }else{


        sellReportTable.innerHTML = `
<tr>
<td colspan="5">
Belum ada transaksi sell.
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

checkSellStatus();


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

function selectCountry(id){

    const item = marketData.find(x => x.id == id);

    if(!item) return;

    document.getElementById("marketCountry").textContent =
        item.country;

    document.getElementById("marketPrice").textContent =
        "Rp " + Number(item.cpm).toLocaleString("id-ID");

    document.getElementById("marketChange").innerHTML =
        (Number(item.change)>=0?"▲ ":"▼ ") +
        Math.abs(Number(item.change)).toFixed(2) + "%";

    if(!marketChartInstance){

        marketChartInstance = new Chart(
            document.getElementById("marketChart"),
            {
                type:"line",
                data:{
                    labels:item.history.map((_,i)=>i+1),
                    datasets:[{
                        data:item.history,
                        borderColor:"#2563eb",
                        backgroundColor:"rgba(37,99,235,.12)",
                        fill:true,
                        tension:.4,
                        pointRadius:0
                    }]
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{
                        legend:{display:false}
                    },
                    scales:{
                        x:{display:false},
                        y:{display:false}
                    }
                }
            }
        );

    }else{

        marketChartInstance.data.labels =
            item.history.map((_,i)=>i+1);

        marketChartInstance.data.datasets[0].data =
            item.history;

        marketChartInstance.update();
    }
}


function toggleGuide(){

const content=document.getElementById("guideContent");
const arrow=document.getElementById("guideArrow");

content.classList.toggle("show");

arrow.classList.toggle("active");

}

function toggleMarket(){

const content=document.getElementById("marketContent");
const arrow=document.getElementById("marketArrow");

content.classList.toggle("show");
arrow.classList.toggle("active");

}

// ===========================
// CHECK SELL LINK STATUS
// ===========================

async function checkSellStatus(){

    try{

        const profile = await database.getCurrentProfile();

        if(!profile){
            console.log("PROFILE TIDAK ADA");
            return;
        }

        console.log("PROFILE:", profile);

        // cek status sell
        const enabled =
            profile.sell_link_enabled === true ||
            profile.sell_unlocked === true ||
            Number(profile.withdraw_count || 0) >= 3;

        const cards = document.querySelectorAll(".sell-card");

        if(enabled){

            cards.forEach(card=>{
                card.classList.remove("locked");
            });

            console.log("✅ SELL LINK AKTIF");

        }else{

            cards.forEach(card=>{
                card.classList.add("locked");
            });

            console.log("🔒 SELL LINK TERKUNCI");

        }

    }catch(err){

        console.error("CHECK SELL ERROR:", err);

    }

}
