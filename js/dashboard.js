//======================================================
// CLICK2PAY DASHBOARD
//======================================================

let adsChartInstance=null;
let sellChartInstance=null;
let marketChartInstance=null;
let marketData=[];


//======================================================
// LOAD DASHBOARD
//======================================================

async function loadDashboard(){

try{


const profile=
await database.getCurrentProfile();


if(!profile){

location.href="index.html";
return;

}


const authId=profile.id;


//======================================================
// PROFILE
//======================================================

window.currentUserCountry=
profile.country || "Indonesia";


const countryNotice=
document.getElementById(
"countryNotice"
);


if(countryNotice){

countryNotice.textContent=
`Data CPM berdasarkan negara ${window.currentUserCountry}`;

}



//======================================================
// ELEMENT
//======================================================

const adsToday=
document.getElementById("adsToday");


const adsMonth=
document.getElementById("adsMonth");


const adsViewsMonth=
document.getElementById("adsViewsMonth");


const sellToday=
document.getElementById("sellToday");


const sellMonth=
document.getElementById("sellMonth");


const todayDate=
document.getElementById("todayDate");


const todayDateSell=
document.getElementById("todayDateSell");


const adsMonthSelect=
document.getElementById("adsMonthSelect");


const sellMonthSelect=
document.getElementById("sellMonthSelect");



//======================================================
// DATE
//======================================================

const now=new Date();


const dateText=
now.toLocaleString(
"id-ID",
{
day:"2-digit",
month:"long",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
);



if(todayDate){

todayDate.textContent=
dateText;

}


if(todayDateSell){

todayDateSell.textContent=
dateText;

}



const monthText=
now.toLocaleString(
"id-ID",
{
month:"long",
year:"numeric"
}
);



if(adsMonthSelect){

adsMonthSelect.innerHTML=
`<option>${monthText}</option>`;

}



if(sellMonthSelect){

sellMonthSelect.innerHTML=
`<option>${monthText}</option>`;

}



//======================================================
// ADS SUMMARY
//======================================================

if(adsToday){

adsToday.textContent=
"Rp "+
Number(
profile.ads_earning_today || 0
)
.toLocaleString("id-ID");

}



if(adsMonth){

adsMonth.textContent=
"Rp "+
Number(
profile.ads_earning_month || 0
)
.toLocaleString("id-ID");

}



//======================================================
// LOAD DATABASE
//======================================================


const links=
await database.getLinks(authId) || [];


const sellOrders=
await database.getSellOrders(authId) || [];



console.log(
"PROFILE",
profile
);


console.log(
"LINKS",
links
);


console.log(
"SELL ORDERS",
sellOrders
);



//======================================================
// VARIABLE
//======================================================


let adsViews=0;
let adsClicks=0;


let totalSell=0;
let totalSellViews=0;
let totalSellClicks=0;


let totalSellPrice=0;
let totalSold=0;


let sellTodayEarn=0;
let sellMonthEarn=0;
let sellTotalEarn=0;


//======================================================
// PROCESS LINKS
//======================================================

if(Array.isArray(links)){

for(const link of links){


const type=
String(
link.type ||
link.link_type ||
""
)
.toLowerCase();


const views=
Number(
link.total_views ??
link.views ??
0
);


const clicks=
Number(
link.total_clicks ??
link.clicks ??
0
);



//======================================================
// ADS LINK
//======================================================

if(type==="ads"){

adsViews+=views;

adsClicks+=clicks;

}



//======================================================
// SELL LINK
//======================================================

if(
type==="sell" ||
type==="sell_link"
){

totalSell++;

totalSellViews+=views;

totalSellClicks+=clicks;

}


}

}



//======================================================
// PROCESS SELL ORDERS
//======================================================

if(Array.isArray(sellOrders)){


const today=
new Date();


for(const order of sellOrders){


const quantity=
Number(
order.quantity || 1
);


const price=
Number(
order.price || 0
);


const receive=
Number(
order.seller_receive ??
order.receive ??
order.net_amount ??
0
);



const status=
String(
order.status || ""
)
.toLowerCase();



totalSold+=quantity;


totalSellPrice+=
(price * quantity);



const paidStatus=[

"paid",
"success",
"completed",
"settled"

]
.includes(status);



if(paidStatus){


sellTotalEarn+=receive;



const created=
new Date(
order.created_at
);



if(
created.toDateString() ===
today.toDateString()
){

sellTodayEarn+=receive;

}



if(
created.getMonth() ===
today.getMonth()
&&
created.getFullYear() ===
today.getFullYear()
){

sellMonthEarn+=receive;

}


}



}



}



//======================================================
// DISPLAY ADS
//======================================================


const adsViewsEl=
document.getElementById(
"adsViews"
);


const adsClicksEl=
document.getElementById(
"adsClicks"
);



if(adsViewsEl){

adsViewsEl.textContent=
adsViews.toLocaleString("id-ID");

}



if(adsClicksEl){

adsClicksEl.textContent=
adsClicks.toLocaleString("id-ID");

}



if(adsViewsMonth){

adsViewsMonth.textContent=
adsViews.toLocaleString("id-ID");

}



//======================================================
// DISPLAY SELL
//======================================================


const sellViewsEl=
document.getElementById(
"sellViews"
);


const sellClicksEl=
document.getElementById(
"sellClicks"
);


const sellTotalLink=
document.getElementById(
"sellTotalLink"
);


const sellTotalSold=
document.getElementById(
"sellTotalSold"
);



if(sellViewsEl){

sellViewsEl.textContent=
totalSellViews.toLocaleString("id-ID");

}



if(sellClicksEl){

sellClicksEl.textContent=
totalSellClicks.toLocaleString("id-ID");

}



if(sellTotalLink){

sellTotalLink.textContent=
totalSell.toLocaleString("id-ID");

}



if(sellTotalSold){

sellTotalSold.textContent=
totalSold.toLocaleString("id-ID");

}



if(sellToday){

sellToday.textContent=
"Rp "+
sellTodayEarn.toLocaleString("id-ID");

}



if(sellMonth){

sellMonth.textContent=
"Rp "+
sellMonthEarn.toLocaleString("id-ID");

}



//======================================================
// CURRENT CPM
//======================================================

const currentCpm=
document.getElementById("currentCpm");


if(currentCpm){

let cpm=0;


const totalEarning=
Number(
profile.ads_earnings_total || 0
);



if(adsViews>0){

cpm=Math.round(
(totalEarning*1000) /
adsViews
);

}



currentCpm.textContent=
"Rp "+
cpm.toLocaleString("id-ID");

}



//======================================================
// REPORT DATA
//======================================================

const reports=
await database.getReports(authId)||[];


console.log(
"REPORT DATA",
reports
);



let labels=[];

let earnings=[];

let sellViewsChart=[];



if(reports.length){


const chartData=
reports.slice(-7);



labels=
chartData.map(item=>{


const date=
new Date(
item.report_date
);


return date.toLocaleDateString(
"id-ID",
{
day:"2-digit",
month:"short"
}
);


});



earnings=
chartData.map(item=>

Number(
item.ads_earnings || 0
)

);



sellViewsChart=
chartData.map(item=>

Number(
item.sell_views || 0
)

);



}else{


const today=
new Date();



for(let i=6;i>=0;i--){


const date=
new Date();


date.setDate(
today.getDate()-i
);



labels.push(

date.toLocaleDateString(
"id-ID",
{
day:"2-digit",
month:"short"
}

)

);



earnings.push(0);

sellViewsChart.push(0);


}


}



//======================================================
// CHART OPTION
//======================================================

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


const value=
Number(
context.parsed.y || 0
);



if(
context.dataset.label==="Pendapatan"
){

return "Rp "+
value.toLocaleString("id-ID");

}



return value.toLocaleString("id-ID");


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


ticks:{


callback(value){

return Number(value)
.toLocaleString("id-ID");

}


}


}


}


};



//======================================================
// ADS CHART
//======================================================

const adsCanvas=
document.getElementById("adsChart");


if(adsCanvas){

if(adsChartInstance){

adsChartInstance.destroy();

}


adsChartInstance=
new Chart(
adsCanvas,
{

type:"line",

data:{

labels:labels,

datasets:[{

label:"Pendapatan",

data:earnings,

borderColor:"#2563eb",

backgroundColor:
"rgba(37,99,235,.12)",

borderWidth:3,

fill:true,

tension:.45,

pointRadius:4,

pointHoverRadius:7

}]

},

options:commonOptions

}

);

}



//======================================================
// SELL CHART
//======================================================

const sellCanvas=
document.getElementById("sellChart");


if(sellCanvas){

if(sellChartInstance){

sellChartInstance.destroy();

}


sellChartInstance=
new Chart(
sellCanvas,
{

type:"line",

data:{

labels:labels,

datasets:[{

label:"Sell Views",

data:sellViewsChart,

borderColor:"#8b5cf6",

backgroundColor:
"rgba(139,92,246,.12)",

borderWidth:3,

fill:true,

tension:.45,

pointRadius:4,

pointHoverRadius:7

}]

},

options:commonOptions

}

);

}



//======================================================
// CPM ADS / SELL
//======================================================

const adsCpm=
document.getElementById("adsCpm");


const sellCpm=
document.getElementById("sellCpm");


const lastReport=
reports.length?
reports[reports.length-1]:
null;



if(adsCpm){

let cpm=0;


if(
lastReport &&
Number(lastReport.ads_views)>0
){

cpm=Math.round(

Number(
lastReport.ads_earnings||0
)
*
1000
/
Number(
lastReport.ads_views
)

);

}


adsCpm.textContent=
"Rp "+
cpm.toLocaleString("id-ID");

}



if(sellCpm){

let cpm=0;


if(
lastReport &&
Number(lastReport.sell_views)>0
){

cpm=Math.round(

Number(
lastReport.sell_earnings||0
)
*
1000
/
Number(
lastReport.sell_views
)

);

}


sellCpm.textContent=
"Rp "+
cpm.toLocaleString("id-ID");

}



//======================================================
// ADS REPORT TABLE
//======================================================

const reportTable=
document.getElementById(
"reportTable"
);


if(reportTable){


if(reports.length){


reportTable.innerHTML=

reports.map(row=>{


const views=
Number(
row.ads_views||0
);


const earn=
Number(
row.ads_earnings||0
);


const total=
Number(
row.total_earnings ??
row.ads_earnings ??
0
);



const cpm=

views>0?

Math.round(
(earn*1000)/
views
)

:0;



return`

<tr>

<td>
${new Date(
row.report_date
)
.toLocaleDateString("id-ID")}
</td>


<td>
${views.toLocaleString("id-ID")}
</td>


<td class="earning">
Rp ${earn.toLocaleString("id-ID")}
</td>


<td>
Rp ${cpm.toLocaleString("id-ID")}
</td>


<td>
Rp ${total.toLocaleString("id-ID")}
</td>


</tr>

`;


}).join("");



}else{


reportTable.innerHTML=`

<tr>

<td colspan="5">

Belum ada data report.

</td>

</tr>

`;

}


}



//======================================================
// SELL REPORT TABLE
//======================================================

const sellReportTable=
document.getElementById(
"sellReportTable"
);



if(sellReportTable){


if(reports.length){


sellReportTable.innerHTML=

reports.map(row=>{


const views=
Number(
row.sell_views||0
);


const clicks=
Number(
row.sell_clicks||0
);


const earn=
Number(
row.sell_earnings||0
);



const cpm=

views>0?

Math.round(
(earn*1000)/
views
)

:0;



return`

<tr>

<td>
${new Date(
row.report_date
)
.toLocaleDateString("id-ID")}
</td>


<td>
${views.toLocaleString("id-ID")}
</td>


<td>
${clicks.toLocaleString("id-ID")}
</td>


<td class="earning">
Rp ${earn.toLocaleString("id-ID")}
</td>


<td>
Rp ${cpm.toLocaleString("id-ID")}
</td>


</tr>

`;


}).join("");



}else{


sellReportTable.innerHTML=`

<tr>

<td colspan="5">

Belum ada laporan sell.

</td>

</tr>

`;

}


}



//======================================================
// CPM MARKET
//======================================================

const marketList=
document.getElementById(
"cpmMarketList"
);


const market=
await database.getCPMMarket();


marketData=
market || [];



if(marketList){


if(marketData.length){


marketList.innerHTML=

marketData.map(item=>`

<div class="market-row"
onclick="selectCountry(${item.id})">


<div class="flag">

${item.flag || "🌍"}

</div>


<div>

<div class="country">

${item.country}

</div>


<div class="spark">

<span style="width:${item.trend || 50}%"></span>

</div>


</div>



<div class="market-price">


<b>

Rp ${Number(item.cpm)
.toLocaleString("id-ID")}

</b>


<div class="market-change ${
Number(item.change)>=0?
"up":
"down"
}">


${Number(item.change)>=0?"▲":"▼"}

${Math.abs(
Number(item.change)
).toFixed(2)}%

</div>


</div>


</div>


`).join("");



selectCountry(
marketData[0].id
);



}else{


marketList.innerHTML=
"Belum ada data CPM.";


}


}




//======================================================
// ANNOUNCEMENT
//======================================================


const news=
await database.getAnnouncements();



const announcementBox=
document.getElementById(
"announcementBox"
);



if(announcementBox){


if(
Array.isArray(news)
&&
news.length
){


announcementBox.innerHTML=

news.map(item=>`

<div class="announcement-item">


<b>

${item.title || "Pengumuman"}

</b>


<p>

${item.content || ""}

</p>


</div>


`).join("");



}else{


announcementBox.innerHTML=
"Belum ada pengumuman.";


}


}



}catch(error){


console.error(
"Dashboard Error:",
error
);


}


}



//======================================================
// AUTO THEME
//======================================================


function autoTheme(){


const theme=
localStorage.getItem(
"theme"
);



if(theme==="dark"){


document.body.classList.add(
"dark"
);


return;


}



if(theme==="light"){


document.body.classList.remove(
"dark"
);


return;


}



const hour=
new Date().getHours();



if(
hour>=18 ||
hour<6
){


document.body.classList.add(
"dark"
);


}else{


document.body.classList.remove(
"dark"
);


}


}



autoTheme();



setInterval(
autoTheme,
60000
);




//======================================================
// DOM LOAD
//======================================================


document.addEventListener(
"DOMContentLoaded",
()=>{


loadDashboard();


checkSellStatus();



const params=
new URLSearchParams(
location.search
);



if(
params.get("tab")==="statistics"
){


setTimeout(()=>{


const section=
document.getElementById(
"statistics"
);



if(section){


section.scrollIntoView({

behavior:"smooth",

block:"start"

});


}


},700);


}


}

);




//======================================================
// MARKET DETAIL
//======================================================


function selectCountry(id){


const item=
marketData.find(
x=>x.id==id
);



if(!item)return;



const country=
document.getElementById(
"marketCountry"
);



const price=
document.getElementById(
"marketPrice"
);



const change=
document.getElementById(
"marketChange"
);



if(country){

country.textContent=
item.country;

}



if(price){

price.textContent=
"Rp "+
Number(item.cpm)
.toLocaleString("id-ID");

}



if(change){

change.innerHTML=

(Number(item.change)>=0?"▲ ":"▼ ")

+
Math.abs(
Number(item.change)
)
.toFixed(2)
+"%";

}




const canvas=
document.getElementById(
"marketChart"
);



if(!canvas)return;



if(!marketChartInstance){


marketChartInstance=
new Chart(
canvas,
{

type:"line",

data:{

labels:
item.history.map(
(_,i)=>i+1
),


datasets:[{


data:item.history,


borderColor:"#2563eb",


backgroundColor:
"rgba(37,99,235,.12)",


fill:true,


tension:.4,


pointRadius:0


}]

},


options:{


responsive:true,


maintainAspectRatio:false,


plugins:{


legend:{

display:false

}

},


scales:{


x:{

display:false

},


y:{

display:false

}


}


}


}

);


}else{


marketChartInstance.data.labels=
item.history.map(
(_,i)=>i+1
);



marketChartInstance.data.datasets[0].data=
item.history;



marketChartInstance.update();


}



}




//======================================================
// TOGGLE GUIDE
//======================================================


function toggleGuide(){


document
.getElementById(
"guideContent"
)
.classList.toggle(
"show"
);



document
.getElementById(
"guideArrow"
)
.classList.toggle(
"active"
);


}




//======================================================
// TOGGLE MARKET
//======================================================


function toggleMarket(){


document
.getElementById(
"marketContent"
)
.classList.toggle(
"show"
);



document
.getElementById(
"marketArrow"
)
.classList.toggle(
"active"
);


}




//======================================================
// CHECK SELL STATUS
//======================================================


async function checkSellStatus(){


try{


const profile=
await database.getCurrentProfile();



if(!profile)return;



const enabled=

profile.sell_link_enabled===true ||

profile.sell_unlocked===true ||

Number(
profile.withdraw_count || 0
)>=3;




document
.querySelectorAll(
".sell-card"
)
.forEach(card=>{


card.classList.toggle(
"locked",
!enabled
);



});



}catch(error){


console.error(
"CHECK SELL ERROR:",
error
);


}


}
