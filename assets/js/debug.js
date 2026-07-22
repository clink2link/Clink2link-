(function(){
"use strict";

const DEBUG_KEY="click2pay123";
const params=new URLSearchParams(location.search);

if(params.get("debug")!==DEBUG_KEY)return;

function startDebug(){

const panel=document.createElement("div");
panel.id="debugBox";
panel.innerHTML=`
<div class="debug-header">
<span>🐞 CLICK2PAY DEBUG</span>
<button id="clearDebug">CLEAR</button>
</div>
<div id="debugList"></div>
`;

document.body.appendChild(panel);

const style=document.createElement("style");
style.innerHTML=`
#debugBox{
position:fixed;
bottom:10px;
left:10px;
right:10px;
max-height:400px;
overflow:auto;
background:#020617;
color:#22c55e;
font-family:monospace;
font-size:12px;
z-index:999999;
border-radius:14px;
border:1px solid #334155;
}
.debug-header{
position:sticky;
top:0;
display:flex;
justify-content:space-between;
padding:10px;
background:#111827;
color:white;
}
.debug-header button{
background:#ef4444;
border:0;
color:white;
border-radius:8px;
padding:5px 10px;
}
.debug{
padding:8px;
border-bottom:1px solid #334155;
word-break:break-word;
}
.log{color:#22c55e}
.warn{color:#facc15}
.err{color:#f87171}
pre{
white-space:pre-wrap;
color:#93c5fd;
}
`;
document.head.appendChild(style);

const list=document.getElementById("debugList");

function add(type,data){

const item=document.createElement("div");
item.className="debug "+type;

let text;

try{
text=typeof data==="object"
?JSON.stringify(data,null,2)
:String(data);
}catch{
text=String(data);
}

item.innerHTML=`
[${new Date().toLocaleTimeString()}]
<b>${type.toUpperCase()}</b>
<pre>${text}</pre>
`;

list.prepend(item);
}


// ERROR JS
window.onerror=function(message,source,line,column,error){
add("err",{
type:"JAVASCRIPT ERROR",
message,
file:source,
line,
column,
error
});
};


// PROMISE
window.addEventListener("unhandledrejection",e=>{
add("err",{
type:"PROMISE ERROR",
error:e.reason
});
});


// FETCH
const oldFetch=window.fetch;

window.fetch=function(...args){

add("log",{
type:"FETCH",
url:args[0]
});

return oldFetch(...args)
.then(res=>{

add(
res.ok?"log":"err",
{
type:"FETCH RESPONSE",
url:args[0],
status:res.status
}
);

return res;

})
.catch(err=>{

add("err",{
type:"FETCH FAILED",
message:err.message
});

throw err;

});

};


// CONSOLE
["log","warn","error"].forEach(type=>{

const old=console[type];

console[type]=function(...args){

add(
type==="error"?"err":type,
args
);

old.apply(console,args);

};

});


// CLICK ERROR
document.addEventListener("click",e=>{

try{

let target=e.target.closest("button,a");

if(target){

add("log",{
type:"CLICK",
element:target.innerText||target.href||target.id
});

}

}catch(err){

add("err",err);

}

},true);


// LOAD JS ERROR
window.addEventListener("error",e=>{

if(e.target.tagName==="SCRIPT"){

add("err",{
type:"SCRIPT LOAD ERROR",
file:e.target.src
});

}

},true);


// LOCAL STORAGE

add("log",{
type:"LOCAL STORAGE",
user_id:localStorage.getItem("user_id"),
theme:localStorage.getItem("theme")
});


// PAGE INFO

add("log",{
type:"PAGE",
url:location.href,
title:document.title
});


// SUPABASE CHECK

setTimeout(()=>{

if(window.database){

add("log",{
type:"DATABASE READY",
database:Object.keys(window.database)
});

}else{

add("warn","DATABASE BELUM READY");

}

},1000);


// CLEAR

document.getElementById("clearDebug").onclick=()=>{
list.innerHTML="";
};


// MANUAL

window.debug=function(data){
add("log",data);
};


add("log","Click2Pay Debug Aktif");

}

if(document.body){
startDebug();
}else{
document.addEventListener("DOMContentLoaded",startDebug);
}

})();
