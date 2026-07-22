(function () {
"use strict";

const DEBUG_KEY = "click2pay123";
const params = new URLSearchParams(location.search);

if (params.get("debug") !== DEBUG_KEY) return;

// ======================
// CONFIG
// ======================

const VERSION = "2.0.0";

let debugList = null;

function now() {
    return new Date().toLocaleTimeString("id-ID");
}

function stringify(data) {
    try {
        if (typeof data === "string") return data;
        return JSON.stringify(data, null, 2);
    } catch (e) {
        return String(data);
    }
}

function add(type, data) {

    if (!debugList) return;

    const item = document.createElement("div");

    item.className = "debug " + type;

    item.innerHTML = `
<b>[${now()}]</b>
<pre>${stringify(data)}</pre>
`;

    debugList.prepend(item);
}

window.debug = function(data){
    add("log", data);
};

// ======================
// CREATE PANEL
// ======================

function createPanel(){

const panel = document.createElement("div");

panel.id = "debugBox";

panel.innerHTML = `
<div class="debug-header">
<div>
🐞 CLICK2PAY DEBUG
<small style="opacity:.7;">v${VERSION}</small>
</div>

<div>

<button id="clearDebug">
CLEAR
</button>

</div>

</div>

<div id="debugList"></div>
`;

document.body.appendChild(panel);

debugList = document.getElementById("debugList");

const style = document.createElement("style");

style.innerHTML = `
#debugBox{
position:fixed;
left:10px;
right:10px;
bottom:10px;
height:420px;
background:#020617;
color:#22c55e;
font-family:monospace;
font-size:12px;
z-index:999999999;
border-radius:12px;
overflow:auto;
border:1px solid #334155;
box-shadow:0 0 20px rgba(0,0,0,.5);
}

.debug-header{
position:sticky;
top:0;
display:flex;
justify-content:space-between;
align-items:center;
padding:10px;
background:#111827;
color:#fff;
font-weight:bold;
}

.debug-header button{
background:#ef4444;
border:0;
color:#fff;
padding:6px 12px;
border-radius:6px;
cursor:pointer;
}

#debugList{
padding-bottom:20px;
}

.debug{
padding:8px;
border-bottom:1px solid #334155;
word-break:break-word;
}

.log{
color:#22c55e;
}

.warn{
color:#facc15;
}

.err{
color:#f87171;
}

pre{
margin:0;
white-space:pre-wrap;
color:#93c5fd;
}
`;

document.head.appendChild(style);

document
.getElementById("clearDebug")
.onclick=()=>{

debugList.innerHTML="";

};

add("log","Click2Pay Debug Aktif");

add("log",{
version:VERSION,
url:location.href,
title:document.title,
userAgent:navigator.userAgent
});

}

if(document.body){
createPanel();
}else{
window.addEventListener("DOMContentLoaded",createPanel);
}

//======================
// JAVASCRIPT ERROR
//======================

window.onerror=function(message,source,line,column,error){

add("err",{
type:"JAVASCRIPT ERROR",
message,
source,
line,
column,
stack:error?.stack||null
});

return false;

};

window.addEventListener("error",e=>{

if(e.target instanceof HTMLScriptElement){

add("err",{
type:"SCRIPT LOAD FAILED",
src:e.target.src
});

return;

}

if(e.target instanceof HTMLLinkElement){

add("err",{
type:"CSS LOAD FAILED",
href:e.target.href
});

return;

}

},true);


//======================
// PROMISE ERROR
//======================

window.addEventListener("unhandledrejection",e=>{

add("err",{
type:"UNHANDLED PROMISE",
reason:e.reason?.message||e.reason,
stack:e.reason?.stack||null
});

});


//======================
// CONSOLE
//======================

["log","warn","error","info"].forEach(type=>{

const old=console[type];

console[type]=function(...args){

add(
type==="error"
?"err"
:type==="warn"
?"warn"
:"log",
{
type:"CONSOLE "+type.toUpperCase(),
data:args
}
);

old.apply(console,args);

};

});


//======================
// FETCH
//======================

const oldFetch=window.fetch;

window.fetch=async function(...args){

const url=args[0];

add("log",{
type:"FETCH",
url
});

try{

const res=await oldFetch.apply(this,args);

add(
res.ok?"log":"err",
{
type:"FETCH RESPONSE",
url,
status:res.status,
statusText:res.statusText
}
);

return res;

}catch(err){

add("err",{
type:"FETCH FAILED",
url,
message:err.message,
stack:err.stack
});

throw err;

}

};


//======================
// XHR
//======================

const oldOpen=XMLHttpRequest.prototype.open;
const oldSend=XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open=function(method,url){

this._url=url;
this._method=method;

return oldOpen.apply(this,arguments);

};

XMLHttpRequest.prototype.send=function(){

this.addEventListener("load",()=>{

add(
this.status>=200&&this.status<300
?"log"
:"err",
{
type:"XHR",
method:this._method,
url:this._url,
status:this.status
}
);

});

this.addEventListener("error",()=>{

add("err",{
type:"XHR FAILED",
method:this._method,
url:this._url
});

});

return oldSend.apply(this,arguments);

};

//======================
// SCRIPT & CSS LOADED
//======================

window.addEventListener("DOMContentLoaded",()=>{

document.querySelectorAll("script").forEach(script=>{

add("log",{
type:"SCRIPT",
src:script.src||"INLINE"
});

script.addEventListener("load",()=>{

add("log",{
type:"SCRIPT LOADED",
src:script.src
});

});

script.addEventListener("error",()=>{

add("err",{
type:"SCRIPT FAILED",
src:script.src
});

});

});

document.querySelectorAll('link[rel="stylesheet"]').forEach(css=>{

add("log",{
type:"CSS",
href:css.href
});

css.addEventListener("load",()=>{

add("log",{
type:"CSS LOADED",
href:css.href
});

});

css.addEventListener("error",()=>{

add("err",{
type:"CSS FAILED",
href:css.href
});

});

});

});


//======================
// IMAGE ERROR
//======================

window.addEventListener("error",e=>{

if(e.target instanceof HTMLImageElement){

add("err",{
type:"IMAGE FAILED",
src:e.target.currentSrc||e.target.src
});

}

},true);


//======================
// DOM ERROR
//======================

const oldGet=document.getElementById;

document.getElementById=function(id){

const el=oldGet.call(document,id);

if(!el){

add("warn",{
type:"ELEMENT NOT FOUND",
method:"getElementById",
id
});

}

return el;

};

const oldQuery=document.querySelector;

document.querySelector=function(selector){

const el=oldQuery.call(document,selector);

if(!el){

add("warn",{
type:"ELEMENT NOT FOUND",
method:"querySelector",
selector
});

}

return el;

};


//======================
// CLICK
//======================

document.addEventListener("click",e=>{

const target=e.target.closest("button,a");

if(!target)return;

add("log",{
type:"CLICK",
text:target.innerText||"",
id:target.id||"",
class:target.className||"",
href:target.href||null
});

},true);


//======================
// FORM SUBMIT
//======================

document.addEventListener("submit",e=>{

add("log",{
type:"FORM SUBMIT",
id:e.target.id||"",
action:e.target.action||"",
method:e.target.method||"GET"
});

},true);


//======================
// ONLINE / OFFLINE
//======================

window.addEventListener("online",()=>{

add("log",{
type:"NETWORK",
status:"ONLINE"
});

});

window.addEventListener("offline",()=>{

add("err",{
type:"NETWORK",
status:"OFFLINE"
});

});

//======================
// LOCAL STORAGE
//======================

try{

const storage={};

for(let i=0;i<localStorage.length;i++){

const key=localStorage.key(i);

storage[key]=localStorage.getItem(key);

}

add("log",{
type:"LOCAL STORAGE",
data:storage
});

}catch(err){

add("err",{
type:"LOCAL STORAGE ERROR",
message:err.message
});

}


//======================
// SESSION STORAGE
//======================

try{

const storage={};

for(let i=0;i<sessionStorage.length;i++){

const key=sessionStorage.key(i);

storage[key]=sessionStorage.getItem(key);

}

add("log",{
type:"SESSION STORAGE",
data:storage
});

}catch(err){

add("err",{
type:"SESSION STORAGE ERROR",
message:err.message
});

}


//======================
// COOKIE
//======================

add("log",{
type:"COOKIE",
cookie:document.cookie||"(empty)"
});


//======================
// DEVICE
//======================

add("log",{
type:"DEVICE",
language:navigator.language,
platform:navigator.platform,
online:navigator.onLine,
cookieEnabled:navigator.cookieEnabled,
hardware:navigator.hardwareConcurrency,
memory:navigator.deviceMemory||"unknown",
touch:navigator.maxTouchPoints
});


//======================
// SCREEN
//======================

add("log",{
type:"SCREEN",
width:screen.width,
height:screen.height,
pixelRatio:window.devicePixelRatio
});


//======================
// PERFORMANCE
//======================

window.addEventListener("load",()=>{

setTimeout(()=>{

const nav=performance.getEntriesByType("navigation")[0];

if(nav){

add("log",{
type:"PAGE LOAD",
duration:Math.round(nav.duration)+" ms",
dom:Math.round(nav.domContentLoadedEventEnd)+" ms",
load:Math.round(nav.loadEventEnd)+" ms"
});

}

},500);

});


//======================
// RESOURCE
//======================

window.addEventListener("load",()=>{

setTimeout(()=>{

performance.getEntriesByType("resource").forEach(res=>{

add("log",{
type:"RESOURCE",
name:res.name,
duration:Math.round(res.duration)+" ms",
size:res.transferSize||0
});

});

},1000);

});


//======================
// DATABASE
//======================

setInterval(()=>{

if(window.database){

add("log",{
type:"DATABASE READY",
keys:Object.keys(window.database)
});

}else{

add("err",{
type:"DATABASE NOT READY"
});

}

},5000);


//======================
// SUPABASE
//======================

setInterval(()=>{

try{

if(window.database?.supabase){

add("log",{
type:"SUPABASE READY"
});

}else{

add("warn",{
type:"SUPABASE NULL"
});

}

}catch(err){

add("err",{
type:"SUPABASE ERROR",
message:err.message
});

}

},5000);

//======================
// DOM READY
//======================

document.addEventListener("DOMContentLoaded",()=>{

add("log",{
type:"DOM READY",
elements:document.querySelectorAll("*").length
});

});

window.addEventListener("load",()=>{

add("log",{
type:"WINDOW LOAD FINISHED"
});

});


//======================
// VISIBILITY
//======================

document.addEventListener("visibilitychange",()=>{

add("log",{
type:"VISIBILITY",
state:document.visibilityState
});

});


//======================
// RESIZE
//======================

window.addEventListener("resize",()=>{

add("log",{
type:"RESIZE",
width:window.innerWidth,
height:window.innerHeight
});

});


//======================
// HASH CHANGE
//======================

window.addEventListener("hashchange",()=>{

add("log",{
type:"HASH CHANGE",
hash:location.hash
});

});


//======================
// HISTORY
//======================

window.addEventListener("popstate",()=>{

add("log",{
type:"POPSTATE",
url:location.href
});

});


//======================
// MUTATION OBSERVER
//======================

const observer=new MutationObserver(list=>{

list.forEach(m=>{

add("log",{
type:"DOM MUTATION",
mutation:m.type,
target:m.target?.tagName||null
});

});

});

observer.observe(document.documentElement,{
childList:true,
subtree:true,
attributes:true
});


//======================
// MEMORY (jika didukung browser)
//======================

if(performance.memory){

setInterval(()=>{

add("log",{
type:"MEMORY",
used:Math.round(performance.memory.usedJSHeapSize/1024/1024)+" MB",
total:Math.round(performance.memory.totalJSHeapSize/1024/1024)+" MB",
limit:Math.round(performance.memory.jsHeapSizeLimit/1024/1024)+" MB"
});

},15000);

}


//======================
// SUMMARY
//======================

setInterval(()=>{

const logs=document.querySelectorAll(".debug.log").length;
const warns=document.querySelectorAll(".debug.warn").length;
const errs=document.querySelectorAll(".debug.err").length;

const header=document.querySelector(".debug-header span");

if(header){

header.innerHTML=`🐞 CLICK2PAY DEBUG | LOG ${logs} | WARN ${warns} | ERR ${errs}`;

}

},1000);


//======================
// MANUAL TEST
//======================

window.debugTest=function(){

console.log("Debug Test Log");
console.warn("Debug Test Warn");
console.error("Debug Test Error");

fetch("404-test-file");

};


//======================
// START
//======================

add("log","DEBUG ENGINE READY");

})();
