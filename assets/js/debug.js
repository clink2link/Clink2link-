(function(){

const panel=document.createElement("div");

panel.id="debugBox";

panel.innerHTML=`
<div style="
background:#111827;
color:white;
padding:8px;
font-weight:bold;
display:flex;
justify-content:space-between;
">
🐞 DEBUG
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
max-height:300px;
overflow:auto;
background:#020617;
color:#22c55e;
font-family:monospace;
font-size:12px;
z-index:999999;
border-radius:12px;
border:1px solid #334155;
}

.debug{
padding:6px;
border-bottom:1px solid #334155;
}

.err{
color:#f87171;
}

.warn{
color:#facc15;
}

`;

document.head.appendChild(style);



const list=document.getElementById("debugList");


function add(type,msg){

let div=document.createElement("div");

div.className="debug "+type;

div.innerHTML=
`
[${new Date().toLocaleTimeString()}]
${type.toUpperCase()}
<br>
${msg}
`;

list.prepend(div);

}


// tangkap semua error

window.onerror=function(
msg,
url,
line,
col
){

add(
"err",
`
${msg}
<br>
${url}
<br>
Line ${line}:${col}
`
);

};


// tangkap promise

window.addEventListener(
"unhandledrejection",
e=>{

add(
"err",
e.reason
);

});


// console otomatis

["log","warn","error"].forEach(type=>{

const old=console[type];

console[type]=function(...args){

add(
type==="error"?"err":
type==="warn"?"warn":"debug",
args.join(" ")
);

old.apply(console,args);

};

});



document
.getElementById("clearDebug")
.onclick=()=>{

list.innerHTML="";

};


add(
"debug",
"Debug aktif"
);


})();
