(function(){
"use strict";

const KEY="click2pay123";

if(new URLSearchParams(location.search).get("debug")!==KEY)return;


function safeJSON(data){
try{
if(typeof data==="object"){
return JSON.stringify(data,null,2);
}
return String(data);
}catch(e){
return String(data);
}
}


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
max-height:350px;
overflow:auto;
background:#000;
color:#00ff00;
font:12px monospace;
padding:12px;
z-index:999999;
border-radius:12px;
`;

document.body.appendChild(box);

}


const item=document.createElement("div");

item.style.marginBottom="10px";

item.innerHTML=
`
<b>[${type}]</b>
<pre style="white-space:pre-wrap">${safeJSON(data)}</pre>
`;

box.prepend(item);

}


window.debug=log;



// PAGE

log("PAGE",{
url:location.href,
title:document.title,
time:new Date().toString()
});



// DEVICE

log("DEVICE",navigator.userAgent);



// ONLINE

log("NETWORK",
navigator.onLine?"ONLINE":"OFFLINE"
);



window.addEventListener("offline",()=>{
log("NETWORK","OFFLINE");
});


window.addEventListener("online",()=>{
log("NETWORK","ONLINE");
});



// JS ERROR

window.onerror=function(
msg,
src,
line,
col,
err
){

log("JS ERROR",{
message:msg,
file:src,
line:line,
column:col,
stack:err?.stack
});

};



// PROMISE ERROR

window.addEventListener(
"unhandledrejection",
e=>{

log("PROMISE ERROR",{
error:e.reason
});

});



// FILE ERROR

window.addEventListener(
"error",
e=>{


const target=e.target;


if(target?.tagName==="SCRIPT"){

log("JS FILE ERROR",{
file:target.src
});

}


if(target?.tagName==="LINK"){

log("CSS FILE ERROR",{
file:target.href
});

}


},
true
);



// FETCH MONITOR

const oldFetch=window.fetch;


window.fetch=async function(...args){

try{

const res=await oldFetch(...args);


if(!res.ok){

log("FETCH ERROR",{
url:String(args[0]),
status:res.status
});

}else{

log("FETCH OK",{
url:String(args[0]),
status:res.status
});

}


return res;


}catch(err){

log("FETCH FAILED",{
url:String(args[0]),
message:err.message
});

throw err;

}

};




// CONSOLE MONITOR

["log","warn","error"].forEach(type=>{


const old=console[type];


console[type]=function(...args){

log(
"CONSOLE "+type.toUpperCase(),
args
);

old.apply(console,args);

};


});




// DOM READY

document.addEventListener(
"DOMContentLoaded",
()=>{


log("DOM","READY");



// CHECK SCRIPT

document.querySelectorAll("script")
.forEach(s=>{

log("SCRIPT",{
src:s.src||"INLINE"
});

});



// CHECK CSS

document.querySelectorAll(
'link[rel="stylesheet"]'
)
.forEach(c=>{

log("CSS",{
src:c.href
});

});



});




// DATABASE CHECK

setTimeout(()=>{


log(
"DATABASE",
window.database
?"READY"
:"NULL"
);



if(window.database){

log(
"SUPABASE",
window.database.supabase
?"READY"
:"NULL"
);

}


},1500);




// USER CHECK

setTimeout(()=>{


log(
"USER_ID",
localStorage.getItem("user_id")||"KOSONG"
);


},2000);




// PAYMENT CHECK

setTimeout(()=>{


log(
"PAYMENT JS",
typeof window.savePayment
);



const ids=[
"withdrawService",
"balance",
"paymentWarning",
"manualWithdrawBtn",
"instantWithdrawBtn"
];


ids.forEach(id=>{

log(
"HTML "+id,
document.getElementById(id)
?"FOUND"
:"MISSING"
);

});


},3000);




// CSS CHECK

setTimeout(()=>{


const sheets=[...document.styleSheets];


log(
"CSS COUNT",
sheets.length
);


sheets.forEach((css,i)=>{

try{

log(
"CSS ACTIVE "+i,
css.href||"INLINE"
);


}catch(e){

log(
"CSS BLOCKED",
css.href
);

}


});


},4000);




// SUPABASE TABLE TEST

setTimeout(async()=>{


if(!window.database)return;


try{


const {data,error}=await window.database.supabase
.from("profiles")
.select("id")
.limit(1);


if(error){

log("SUPABASE ERROR",error);

}else{

log("SUPABASE QUERY","OK");

}


}catch(e){

log("SUPABASE FAILED",e.message);

}


},5000);



})();
