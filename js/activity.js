"use strict";

let ipPromise=null;

window.trackLoginActivity=trackLoginActivity;

document.addEventListener("DOMContentLoaded",()=>{
loadLoginActivity();
});


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

if(!data||data.length===0){
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

<div class="login-item">

<div class="login-left">

<i class="fa-solid fa-laptop"></i>

<div>

<div class="login-device">
${escapeHTML(item.device||"Unknown")}
</div>

<div class="login-time">
${formatDate(item.created_at)}
</div>

</div>

</div>


<div>

<div class="login-time">
${escapeHTML(item.city||"-")},
${escapeHTML(item.country||"-")}
<br>
IP: ${escapeHTML(item.ip||"-")}
</div>


${item.device!==getDevice()?`

<button class="logout-device"
onclick="logoutDevice('${item.id}')">
Logout
</button>

`:`

<span style="font-size:12px;color:#16a34a">
Device Aktif
</span>

`}

</div>


</div>

`).join("");


}catch(e){

console.error("LOAD ACTIVITY ERROR",e);

list.innerHTML="❌ Gagal memuat aktivitas";

}

}




async function trackLoginActivity(userId){

if(!userId)return;

if(window.__loginTracking)return;

window.__loginTracking=true;


try{

const ipData=await getIP();

const device=getDevice();


const {data:old}=await window.database.supabase
.from("login_activity")
.select("id")
.eq("user_id",userId)
.eq("device",device)
.maybeSingle();



if(old){

await window.database.supabase
.from("login_activity")
.update({

created_at:new Date().toISOString(),

ip:ipData.ip,

city:ipData.city,

region:ipData.region,

country:ipData.country,

org:ipData.org

})
.eq("id",old.id);


}else{


await window.database.supabase
.from("login_activity")
.insert({

user_id:userId,

device:device,

user_agent:navigator.userAgent,

ip:ipData.ip,

city:ipData.city,

region:ipData.region,

country:ipData.country,

org:ipData.org,

latitude:ipData.lat,

longitude:ipData.lon

});


}


console.log("✅ Login activity saved");


}catch(e){

console.warn("Activity tracking gagal",e);

}

window.__loginTracking=false;

}




async function logoutDevice(id){

if(!confirm("Logout perangkat ini?"))
return;


try{


const {error}=await window.database.supabase
.from("login_activity")
.delete()
.eq("id",id);


if(error)throw error;


alert("Device berhasil logout");


loadLoginActivity();


}catch(e){

console.error(e);

alert("Gagal logout device");

}

}





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




function getIP(){

if(!ipPromise)
ipPromise=getIPInfo();

return ipPromise;

}



async function getIPInfo(){

try{

const res=await fetch("https://ipapi.co/json/");

const data=await res.json();

return{

ip:data.ip||"Unknown",
city:data.city||"-",
region:data.region||"-",
country:data.country_name||"-",
org:data.org||"-",
lat:data.latitude||null,
lon:data.longitude||null

};

}catch(e){

return{

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




function formatDate(date){

return new Date(date)
.toLocaleString("id-ID",{
dateStyle:"medium",
timeStyle:"short"
});

}



function escapeHTML(str){

return String(str).replace(/[&<>"']/g,m=>({

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

}[m]));

}
