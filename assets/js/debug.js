(function(){

"use strict";


const KEY="click2pay123";


if(new URLSearchParams(location.search).get("debug")!==KEY){
    return;
}


// =========================================
// BASIC
// =========================================

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

max-height:400px;

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


    item.style.marginBottom="12px";


    item.innerHTML=`

<b>[${type}]</b>

<pre style="white-space:pre-wrap">${safeJSON(data)}</pre>

`;


    box.prepend(item);

}



window.debug=log;



// =========================================
// CURRENT PAGE
// =========================================


const PAGE=
location.pathname
.replace(/^\/+/,"")
.split("/")[0]
||"index";



log("CURRENT PAGE",PAGE);




// =========================================
// PAGE INFO
// =========================================


log("PAGE INFO",{

url:location.href,

title:document.title,

time:new Date().toString()

});



log("DEVICE",navigator.userAgent);



log(
"NETWORK",
navigator.onLine
?"ONLINE"
:"OFFLINE"
);



// =========================================
// NETWORK STATUS
// =========================================


window.addEventListener(
"offline",
()=>log("NETWORK","OFFLINE")
);


window.addEventListener(
"online",
()=>log("NETWORK","ONLINE")
);




// =========================================
// JAVASCRIPT ERROR
// =========================================


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

line,

column:col,

stack:err?.stack

});


};




// =========================================
// PROMISE ERROR
// =========================================


window.addEventListener(
"unhandledrejection",
e=>{

log(
"PROMISE ERROR",
e.reason
);

});




// =========================================
// FILE ERROR
// =========================================


window.addEventListener(
"error",
e=>{


const target=e.target;



if(target?.tagName==="SCRIPT"){

log(
"JS FILE ERROR",
target.src
);

}



if(target?.tagName==="LINK"){

log(
"CSS FILE ERROR",
target.href
);

}



},
true
);




// =========================================
// FETCH MONITOR
// =========================================


const oldFetch=window.fetch;


window.fetch=async function(...args){


try{


const res=await oldFetch(...args);



log(
res.ok
?"FETCH OK"
:"FETCH ERROR",
{

url:String(args[0]),

status:res.status

}

);



return res;



}catch(err){


log(
"FETCH FAILED",
{

url:String(args[0]),

error:err.message

}

);



throw err;


}



};



// =========================================
// CONSOLE MONITOR
// =========================================


["log","warn","error"]
.forEach(type=>{


const old=console[type];


console[type]=function(...args){


log(
"CONSOLE "+type.toUpperCase(),
args
);



old.apply(
console,
args
);



};


});


// =========================================
// DOM READY
// =========================================


document.addEventListener(
"DOMContentLoaded",
()=>{


log(
"DOM",
"READY"
);



// =========================================
// SCRIPT CHECK
// =========================================


const scripts=[
...document.scripts
];


log(
"SCRIPT COUNT",
scripts.length
);



scripts.forEach((s,i)=>{


log(
"SCRIPT "+i,
{

src:s.src||"INLINE",

async:s.async,

defer:s.defer

}

);


});




// =========================================
// CSS CHECK
// =========================================


const css=[
...document.querySelectorAll(
'link[rel="stylesheet"]'
)
];



log(
"CSS LINK COUNT",
css.length
);



css.forEach((c,i)=>{


log(
"CSS "+i,
{

href:c.href,

disabled:c.disabled

}

);


});




// =========================================
// INLINE STYLE
// =========================================


const styles=[
...document.querySelectorAll("style")
];



log(
"INLINE STYLE COUNT",
styles.length
);




// =========================================
// PAGE ELEMENT CONFIG
// =========================================


const PAGE_ELEMENTS={


dashboard:[

"adsToday",

"adsMonth",

"currentCpm",

"adsChart",

"sellChart",

"reportTable",

"announcementBox",

"cpmMarketList"

],



payment:[

"balance",

"withdrawService",

"manualWithdrawBtn",

"instantWithdrawBtn",

"paymentWarning"

],



profile:[

"profileName",

"profileEmail",

"saveProfile"

],



withdraw:[

"withdrawAmount",

"withdrawBtn",

"withdrawHistory"

],



buy:[

"productList",

"buyButton"

]



};




// =========================================
// CHECK PAGE ONLY
// =========================================


const ids=
PAGE_ELEMENTS[PAGE]||[];



if(ids.length===0){


log(
"PAGE CONFIG",
"Tidak ada konfigurasi untuk "+PAGE
);


}else{


let found=0;



ids.forEach(id=>{


const element=
document.getElementById(id);



if(element){

found++;

}



log(
"ELEMENT "+id,
element
?"FOUND"
:"MISSING"
);



});




log(
"PAGE RESULT",
{

page:PAGE,

found,

total:ids.length,

status:
found===ids.length
?"READY"
:"INCOMPLETE"

}

);



}



// =========================================
// DEBUG ELEMENT
// =========================================


const debugElements=
document.querySelectorAll(
"[data-debug]"
);



log(
"DEBUG ELEMENT COUNT",
debugElements.length
);



debugElements.forEach(el=>{


log(
"DEBUG ELEMENT",
{

id:el.id,

tag:el.tagName

}

);



});



});


// =========================================
// DATABASE CHECK
// =========================================


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




// =========================================
// USER CHECK
// =========================================


setTimeout(()=>{


log(
"USER_ID",
localStorage.getItem("user_id")
||"KOSONG"
);



},2000);




// =========================================
// CSS ACTIVE CHECK
// =========================================


setTimeout(()=>{


const sheets=[
...document.styleSheets
];



log(
"CSS ACTIVE COUNT",
sheets.length
);



sheets.forEach((sheet,i)=>{


try{


log(
"CSS ACTIVE "+i,
{

href:
sheet.href||"INLINE",

rules:
sheet.cssRules.length

}

);



}catch(e){


log(
"CSS BLOCKED",
{

href:sheet.href,

reason:e.message

}

);



}



});



},3000);




// =========================================
// SUPABASE TEST
// =========================================


setTimeout(async()=>{


if(!window.database){

log(
"SUPABASE TEST",
"DATABASE NOT READY"
);

return;

}



if(!window.database.supabase){


log(
"SUPABASE TEST",
"CLIENT NULL"
);


return;


}



try{


const {error}=

await window.database.supabase

.from("profiles")

.select("id")

.limit(1);




if(error){


log(
"SUPABASE ERROR",
error
);


}else{


log(
"SUPABASE QUERY",
"OK"
);


}



}catch(e){


log(
"SUPABASE FAILED",
e.message
);



}



},5000);




// =========================================
// FINAL INFO
// =========================================


setTimeout(()=>{


log(
"DEBUG COMPLETE",
{

page:PAGE,

url:location.href,

time:new Date().toISOString()

}

);



},6000);



})();
