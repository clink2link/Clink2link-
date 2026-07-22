(function(){

"use strict";


function formatData(data){

    if(data instanceof Error){

        return `
        ${data.message}
        <br>
        <pre>${data.stack || ""}</pre>
        `;

    }


    if(typeof data === "object"){

        try{

            return `
            <pre>
${JSON.stringify(data,null,2)}
            </pre>
            `;

        }catch(e){

            return String(data);

        }

    }


    return String(data);

}



const panel=document.createElement("div");

panel.id="debugBox";


panel.innerHTML=`

<div class="debug-header">

<span>🐞 DEBUG</span>

<button id="clearDebug">
CLEAR
</button>

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

max-height:350px;

overflow:auto;

background:#020617;

color:#22c55e;

font-family:monospace;

font-size:12px;

z-index:999999;

border-radius:14px;

border:1px solid #334155;

box-shadow:0 10px 30px rgba(0,0,0,.3);

}


.debug-header{

display:flex;

justify-content:space-between;

align-items:center;

padding:10px;

background:#111827;

color:white;

font-weight:bold;

position:sticky;

top:0;

}


.debug-header button{

background:#ef4444;

color:white;

border:0;

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

color:#93c5fd;

}


.err{

color:#f87171;

}


.warn{

color:#facc15;

}


.log{

color:#22c55e;

}


`;

document.head.appendChild(style);



const list=document.getElementById("debugList");



function add(type,data){


if(!list) return;


const div=document.createElement("div");


div.className="debug "+type;


div.innerHTML=`

[${new Date().toLocaleTimeString()}]

<b>${type.toUpperCase()}</b>

<br>

${formatData(data)}

`;


list.prepend(div);


}




// ERROR JAVASCRIPT GLOBAL

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
error:error
}
);


};





// PROMISE ERROR

window.addEventListener(
"unhandledrejection",
function(event){


add(
"err",
event.reason
);


});






// FETCH ERROR

const oldFetch=window.fetch;


window.fetch=function(...args){


return oldFetch(...args)

.then(response=>{


if(!response.ok){

add(
"err",
{
type:"FETCH ERROR",
url:args[0],
status:response.status,
statusText:response.statusText
}
);

}


return response;


})


.catch(error=>{


add(
"err",
{
type:"FETCH FAILED",
url:args[0],
error:error.message
}
);


throw error;


});


};






// CONSOLE TRACKER


["log","warn","error"].forEach(type=>{


const old=console[type];


console[type]=function(...args){



let debugType=
type==="error"
?"err"
:
type==="warn"
?"warn"
:
"log";



add(
debugType,
args.length===1
?
args[0]
:
args
);



old.apply(console,args);


};



});






// CLEAR BUTTON


document
.getElementById("clearDebug")
.onclick=function(){


list.innerHTML="";


};






// TEST

add(
"log",
"Debug aktif"
);



window.debug=function(data){

add(
"log",
data
);

};



})();
