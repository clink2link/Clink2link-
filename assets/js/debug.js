(function(){

"use strict";


// ============================
// DEBUG SECRET KEY
// ============================

const DEBUG_KEY = "click2pay123";

const params = new URLSearchParams(
    window.location.search
);


if(params.get("debug") !== DEBUG_KEY){
    return;
}



// ============================
// START DEBUG
// ============================


function startDebug(){


const panel = document.createElement("div");

panel.id="debugBox";


panel.innerHTML=`

<div class="debug-header">

<span>🐞 DEBUG MODE</span>

<button id="clearDebug">
CLEAR
</button>

</div>

<div id="debugList"></div>

`;

document.body.appendChild(panel);




// CSS

const style=document.createElement("style");


style.innerHTML=`

#debugBox{

position:fixed;

bottom:10px;

left:10px;

right:10px;

max-height:350px;

overflow:auto;

background:#020617;

color:#22c55e;

font-family:monospace;

font-size:12px;

z-index:999999;

border-radius:14px;

border:1px solid #334155;

box-shadow:0 10px 30px rgba(0,0,0,.4);

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

padding:5px 10px;

border-radius:8px;

cursor:pointer;

}



.debug{

padding:8px;

border-bottom:1px solid #334155;

word-break:break-word;

}



.debug pre{

white-space:pre-wrap;

margin:5px 0;

color:#93c5fd;

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


`;

document.head.appendChild(style);



const list=document.getElementById("debugList");





function formatData(data){


if(data instanceof Error){

return `

<b>${data.message}</b>

<pre>${data.stack || ""}</pre>

`;

}



if(typeof data==="object"){

try{

return `

<pre>

${JSON.stringify(data,null,2)}

</pre>

`;

}catch{

return String(data);

}

}



return String(data);

}






function add(type,data){


if(!list) return;


const item=document.createElement("div");


item.className="debug "+type;


item.innerHTML=`

[${new Date().toLocaleTimeString()}]

<b>${type.toUpperCase()}</b>

<br>

${formatData(data)}

`;


list.prepend(item);


}







// ============================
// GLOBAL ERROR
// ============================


const oldError = window.onerror;


window.onerror=function(
message,
source,
line,
column,
error
){


add(
"err",
{
message,
file:source,
line,
column,
error
}
);



if(oldError){

oldError(
message,
source,
line,
column,
error
);

}


};








// ============================
// PROMISE ERROR
// ============================


window.addEventListener(
"unhandledrejection",
(e)=>{


add(
"err",
e.reason
);


});









// ============================
// FETCH ERROR
// ============================


const oldFetch=window.fetch;


window.fetch=function(...args){


return oldFetch(...args)

.then(res=>{


if(!res.ok){


add(
"err",
{

type:"FETCH ERROR",

url:args[0],

status:res.status,

statusText:res.statusText

}

);

}


return res;


})


.catch(err=>{


add(
"err",
{

type:"FETCH FAILED",

url:args[0],

message:err.message

}

);


throw err;


});


};








// ============================
// CONSOLE TRACK
// ============================


["log","warn","error"].forEach(type=>{


const old=console[type];


console[type]=function(...args){



let mode =

type==="error"
?
"err"

:

type==="warn"
?
"warn"

:

"log";



add(
mode,
args.length===1 ? args[0] : args
);



old.apply(console,args);


};


});









// ============================
// CLEAR
// ============================


document
.getElementById("clearDebug")
.onclick=function(){

list.innerHTML="";

};







// manual debug

window.debug=function(data){

add(
"log",
data
);

};





add(
"log",
"Debug aktif"
);



}





// tunggu halaman siap

if(document.body){

startDebug();

}else{

document.addEventListener(
"DOMContentLoaded",
startDebug
);

}



})();
