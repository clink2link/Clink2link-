"use strict";

let ipPromise = null;


// =========================
// EXPORT DULU
// =========================

window.trackLoginActivity = trackLoginActivity;


// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded",()=>{

    loadLoginActivity();

});


// =========================
// LOAD LOGIN ACTIVITY
// =========================

async function loadLoginActivity(){

const list=document.getElementById("loginList");

if(!list)return;


const totalEl=document.getElementById("totalLogin");
const lastLoginEl=document.getElementById("lastLogin");
const lastDeviceEl=document.getElementById("lastDevice");


const userId=localStorage.getItem("user_id");


if(!userId){

list.innerHTML="❌ User tidak ditemukan";

return;

}


if(!window.database?.supabase){

list.innerHTML="❌ Database belum siap";

return;

}


try{


const {data,error}=await window.database.supabase
.from("login_activity")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false});


if(error)throw error;


if(!data || data.length===0){

list.innerHTML="Belum ada aktivitas login";

return;

}



if(totalEl)
totalEl.textContent=data.length;


if(lastLoginEl)
lastLoginEl.textContent=formatDate(data[0].created_at);


if(lastDeviceEl)
lastDeviceEl.textContent=data[0].device||"-";



list.innerHTML=data.map(item=>`

<div class="activity-item">


<div class="activity-left">

<i class="fa-solid fa-laptop"></i>

</div>


<div class="activity-content">


<div class="activity-top">

<strong>
${escapeHTML(item.device||"Unknown")}
</strong>


<span>
${formatDate(item.created_at)}
</span>


</div>


<div class="activity-bottom">

${escapeHTML(item.city||"-")},
${escapeHTML(item.country||"-")}

<br>

IP:
${escapeHTML(item.ip||"-")}

</div>


</div>


</div>


`).join("");



}catch(e){

console.error(
"LOAD ACTIVITY ERROR",
e
);

list.innerHTML="❌ Gagal memuat aktivitas";


}


}


// =========================
// TRACK LOGIN
// =========================

async function trackLoginActivity(userId){


if(!userId)return;


if(
sessionStorage.getItem("login_tracked") ||
window.__loginTracking
){

return;

}


window.__loginTracking=true;



try{


const ipData=await getIP();



const {error}=await window.database.supabase
.from("login_activity")
.insert({

user_id:userId,

device:getDevice(),

user_agent:navigator.userAgent,

ip:ipData.ip,

city:ipData.city,

region:ipData.region,

country:ipData.country,

org:ipData.org,

latitude:ipData.lat,

longitude:ipData.lon

});



if(error)throw error;



sessionStorage.setItem(
"login_tracked",
"true"
);



console.log(
"✅ Login activity saved"
);



}catch(e){


console.warn(
"Activity tracking gagal",
e
);


window.__loginTracking=false;


}


}


// =========================
// DEVICE
// =========================

function getDevice(){

const ua=navigator.userAgent;


if(/android/i.test(ua))
return "Android";


if(/iphone|ipad/i.test(ua))
return "iPhone";


if(/windows/i.test(ua))
return "Windows";


if(/mac/i.test(ua))
return "Mac";


return "Unknown";


}


// =========================
// IP
// =========================


function getIP(){


if(!ipPromise){

ipPromise=getIPInfo();

}


return ipPromise;


}



async function getIPInfo(){


try{


const res=await fetch(
"https://ipapi.co/json/"
);


const data=await res.json();



return {

ip:data.ip||"Unknown",

city:data.city||"-",

region:data.region||"-",

country:data.country_name||"-",

org:data.org||"-",

lat:data.latitude||null,

lon:data.longitude||null


};



}catch(e){


return {

ip:"Unknown",

city:"-",

region:"-",

country:"-",

org:"-",

lat:null,

lon:null

};


}



}


// =========================
// DATE
// =========================


function formatDate(date){


return new Date(date)
.toLocaleString(
"id-ID",
{
dateStyle:"medium",
timeStyle:"short"
}
);


}


// =========================
// SECURITY
// =========================


function escapeHTML(str){

return String(str)
.replace(/[&<>"']/g,m=>({

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

}[m]));


}
