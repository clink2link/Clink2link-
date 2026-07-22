(function(){
"use strict";

const KEY="click2pay123";

if(new URLSearchParams(location.search).get("debug")!==KEY)return;

function log(type,data){

let box=document.getElementById("debugBox");

if(!box){

box=document.createElement("div");
box.id="debugBox";

box.style.cssText=`
position:fixed;
left:10px;
right:10px;
bottom:10px;
max-height:250px;
overflow:auto;
background:#000;
color:#0f0;
font:12px monospace;
padding:10px;
z-index:999999;
border-radius:10px;
`;

document.body.appendChild(box);

}

const item=document.createElement("div");

item.style.marginBottom="8px";

item.innerHTML=
`<b>[${type}]</b><br><pre>${typeof data==="object"
?JSON.stringify(data,null,2)
:data}</pre>`;

box.prepend(item);

}

window.debug=log;

// JS ERROR
window.onerror=(m,s,l,c,e)=>{

log("JS ERROR",{
message:m,
file:s,
line:l,
column:c,
stack:e?.stack
});

};

// PROMISE
window.addEventListener("unhandledrejection",e=>{

log("PROMISE",e.reason);

});

// SCRIPT/CSS ERROR
window.addEventListener("error",e=>{

if(e.target instanceof HTMLScriptElement){

log("SCRIPT FAILED",e.target.src);

}

if(e.target instanceof HTMLLinkElement){

log("CSS FAILED",e.target.href);

}

},true);

// FETCH ERROR
const oldFetch=window.fetch;

window.fetch=async(...args)=>{

try{

const res=await oldFetch(...args);

if(!res.ok){

log("FETCH",{
url:args[0],
status:res.status
});

}

return res;

}catch(err){

log("FETCH ERROR",{
url:args[0],
message:err.message
});

throw err;

}

};

// PAGE INFO
log("PAGE",{
url:location.href,
title:document.title
});

log("BROWSER",navigator.userAgent);

// ONLINE / OFFLINE
window.addEventListener("online",()=>{
log("NETWORK","ONLINE");
});

window.addEventListener("offline",()=>{
log("NETWORK","OFFLINE");
});

// CONSOLE
["log","warn","error"].forEach(type=>{

const old=console[type];

console[type]=(...args)=>{

log("CONSOLE "+type.toUpperCase(),args);

old.apply(console,args);

};

});

// SCRIPT & CSS LOADED
window.addEventListener("DOMContentLoaded",()=>{

document.querySelectorAll("script").forEach(script=>{

log("SCRIPT",script.src||"INLINE");

});

document.querySelectorAll('link[rel="stylesheet"]').forEach(css=>{

log("CSS",css.href);

});

});

// DATABASE
setTimeout(()=>{

log("DATABASE",window.database?"READY":"NULL");

},1000);

// USER
setTimeout(()=>{

log("USER_ID",localStorage.getItem("user_id"));

},1200);

})();
