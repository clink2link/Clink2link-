/* =========================================
   CLICK2PAY DEBUG PANEL v2.0
   File : assets/js/debug.js
   Author : ChatGPT
========================================= */

(function(){

"use strict";

/* =========================================
   CONFIG
========================================= */

const DEBUG_KEY="debug111";

if(new URLSearchParams(location.search).get("debug")!==DEBUG_KEY){
    return;
}

/* =========================================
   STORAGE
========================================= */

const logs=[];

const stats={
    info:0,
    warn:0,
    error:0,
    fetch:0
};

/* =========================================
   STYLE
========================================= */

const css=document.createElement("style");

css.textContent=`

#c2pDebug{

position:fixed;

top:10px;

right:10px;

width:420px;

height:650px;

background:#111;

color:#fff;

border-radius:16px;

overflow:hidden;

font-family:monospace;

font-size:12px;

z-index:999999999;

box-shadow:0 0 30px rgba(0,0,0,.4);

display:flex;

flex-direction:column;

}

#c2pHeader{

background:#191919;

padding:12px;

display:flex;

justify-content:space-between;

align-items:center;

cursor:move;

font-weight:bold;

}

#c2pToolbar{

display:flex;

gap:6px;

}

#c2pToolbar button{

background:#222;

color:#fff;

border:none;

padding:4px 8px;

border-radius:8px;

cursor:pointer;

}

#c2pToolbar button:hover{

background:#333;

}

#c2pStats{

display:grid;

grid-template-columns:repeat(4,1fr);

gap:4px;

padding:10px;

background:#161616;

text-align:center;

}

#c2pStats div{

background:#202020;

padding:8px;

border-radius:8px;

}

#c2pSearch{

padding:10px;

background:#111;

}

#c2pSearch input{

width:100%;

padding:8px;

border:none;

border-radius:8px;

outline:none;

background:#222;

color:#fff;

}

#c2pLog{

flex:1;

overflow:auto;

padding:10px;

background:#000;

}

.c2pItem{

margin-bottom:10px;

padding:8px;

border-radius:8px;

word-break:break-word;

}

.c2pInfo{

background:#14213d;

}

.c2pWarn{

background:#7a4b00;

}

.c2pError{

background:#6b0000;

}

.c2pFetch{

background:#003b2e;

}

.c2pTime{

color:#aaa;

font-size:11px;

margin-bottom:5px;

}

.c2pTitle{

font-weight:bold;

margin-bottom:5px;

}

.c2pBody{

white-space:pre-wrap;

color:#ddd;

}

`;

document.head.appendChild(css);

/* =========================================
   CREATE PANEL
========================================= */

const panel=document.createElement("div");

panel.id="c2pDebug";

panel.innerHTML=`

<div id="c2pHeader">

<span>🐞 CLICK2PAY DEBUG</span>

<div id="c2pToolbar">

<button id="dbgClear">Clear</button>

<button id="dbgCopy">Copy</button>

<button id="dbgHide">Hide</button>

</div>

</div>

<div id="c2pStats">

<div>

<b id="dbgInfo">0</b><br>

INFO

</div>

<div>

<b id="dbgWarn">0</b><br>

WARN

</div>

<div>

<b id="dbgError">0</b><br>

ERROR

</div>

<div>

<b id="dbgFetch">0</b><br>

FETCH

</div>

</div>

<div id="c2pSearch">

<input
id="dbgSearch"
placeholder="Cari log...">

</div>

<div id="c2pLog"></div>

`;

document.body.appendChild(panel);

/* =========================================
   ELEMENT
========================================= */

const logBox=document.getElementById("c2pLog");

const search=document.getElementById("dbgSearch");

/* =========================================
   HELPER
========================================= */

function stringify(data){

    try{

        if(typeof data==="object"){

            return JSON.stringify(data,null,2);

        }

        return String(data);

    }catch(e){

        return String(data);

    }

}

function now(){

    return new Date().toLocaleTimeString();

}

/* =========================================
   UPDATE STATS
========================================= */

function updateStats(){

    document.getElementById("dbgInfo").textContent=
    stats.info;

    document.getElementById("dbgWarn").textContent=
    stats.warn;

    document.getElementById("dbgError").textContent=
    stats.error;

    document.getElementById("dbgFetch").textContent=
    stats.fetch;

}


/* =========================================
   CREATE LOG
========================================= */

function addLog(type,title,data=null){

    const item={

        time:now(),

        type,

        title,

        data

    };

    logs.push(item);

    switch(type){

        case "info":
            stats.info++;
            break;

        case "warn":
            stats.warn++;
            break;

        case "error":
            stats.error++;
            break;

        case "fetch":
            stats.fetch++;
            break;

    }

    updateStats();

    renderItem(item);

}


/* =========================================
   RENDER ITEM
========================================= */

function renderItem(item){

    const div=document.createElement("div");

    div.className="c2pItem c2p"+(
        item.type.charAt(0).toUpperCase()+
        item.type.slice(1)
    );

    div.dataset.search=(

        item.title+

        stringify(item.data)

    ).toLowerCase();

    div.innerHTML=`

<div class="c2pTime">

${item.time}

</div>

<div class="c2pTitle">

${item.title}

</div>

<div class="c2pBody">

${stringify(item.data)}

</div>

`;

    logBox.prepend(div);

}


/* =========================================
   SEARCH
========================================= */

search.addEventListener("input",()=>{

    const keyword=
    search.value
    .toLowerCase()
    .trim();

    logBox
    .querySelectorAll(".c2pItem")
    .forEach(item=>{

        item.style.display=

        item.dataset.search
        .includes(keyword)

        ?

        ""

        :

        "none";

    });

});


/* =========================================
   CLEAR
========================================= */

document
.getElementById("dbgClear")
.onclick=()=>{

    logs.length=0;

    logBox.innerHTML="";

    stats.info=0;
    stats.warn=0;
    stats.error=0;
    stats.fetch=0;

    updateStats();

};


/* =========================================
   COPY
========================================= */

document
.getElementById("dbgCopy")
.onclick=async()=>{

    try{

        await navigator.clipboard.writeText(

            JSON.stringify(
                logs,
                null,
                2
            )

        );

        alert("Debug berhasil disalin.");

    }catch(e){

        alert("Gagal copy debug.");

    }

};


/* =========================================
   HIDE
========================================= */

document
.getElementById("dbgHide")
.onclick=()=>{

    panel.style.display="none";

};


/* =========================================
   GLOBAL DEBUG
========================================= */

window.debug=function(

title,

data=null,

type="info"

){

    addLog(

        type,

        title,

        data

    );

};


/* =========================================
   START
========================================= */

debug(
"CLICK2PAY DEBUG",
"Panel berhasil dimuat"
);

debug(
"URL",
location.href
);

debug(
"USER AGENT",
navigator.userAgent
);

debug(
"ONLINE",
navigator.onLine
);


/* =========================================
   CONSOLE MONITOR
========================================= */

["log","warn","error","info"].forEach(type=>{

    const original=console[type];

    console[type]=function(...args){

        if(type==="warn"){

            addLog(
                "warn",
                "CONSOLE WARN",
                args
            );

        }

        else if(type==="error"){

            addLog(
                "error",
                "CONSOLE ERROR",
                args
            );

        }

        else{

            addLog(
                "info",
                "CONSOLE "+type.toUpperCase(),
                args
            );

        }

        original.apply(
            console,
            args
        );

    };

});


/* =========================================
   JAVASCRIPT ERROR
========================================= */

window.addEventListener(
"error",
e=>{

    addLog(

        "error",

        "JAVASCRIPT ERROR",

        {

            message:e.message,

            file:e.filename,

            line:e.lineno,

            column:e.colno,

            stack:e.error?.stack

        }

    );

});


/* =========================================
   PROMISE ERROR
========================================= */

window.addEventListener(
"unhandledrejection",
e=>{

    addLog(

        "error",

        "PROMISE ERROR",

        e.reason

    );

});


/* =========================================
   NETWORK
========================================= */

window.addEventListener(
"online",
()=>{

    addLog(
        "info",
        "NETWORK",
        "ONLINE"
    );

});

window.addEventListener(
"offline",
()=>{

    addLog(
        "warn",
        "NETWORK",
        "OFFLINE"
    );

});


/* =========================================
   PAGE LOAD
========================================= */

window.addEventListener(
"load",
()=>{

    addLog(
        "info",
        "WINDOW",
        "LOAD COMPLETE"
    );

});


document.addEventListener(
"DOMContentLoaded",
()=>{

    addLog(
        "info",
        "DOM",
        "READY"
    );

});


/* =========================================
   LOCAL STORAGE
========================================= */

try{

    addLog(

        "info",

        "LOCAL STORAGE",

        {

            user_id:
            localStorage.getItem("user_id"),

            total_key:
            localStorage.length

        }

    );

}catch(e){

    addLog(
        "warn",
        "LOCAL STORAGE",
        e.message
    );

}


/* =========================================
   PAGE INFO
========================================= */

addLog(

    "info",

    "PAGE INFO",

    {

        title:document.title,

        path:location.pathname,

        search:location.search,

        hash:location.hash,

        language:navigator.language,

        platform:navigator.platform

    }

);


/* =========================================
   FETCH MONITOR
========================================= */

const originalFetch=window.fetch;

window.fetch=async function(...args){

    const started=performance.now();

    const url=String(args[0]);

    const options=args[1]||{};

    const method=options.method||"GET";

    addLog(
        "fetch",
        "FETCH START",
        {
            method,
            url,
            body:options.body||null
        }
    );

    try{

        const response=
        await originalFetch(...args);

        const ended=
        performance.now();

        let body="";

        try{

            body=
            await response.clone().text();

            if(body.length>1000){

                body=
                body.substring(0,1000)+
                "\n...(dipotong)...";

            }

        }catch(e){

            body=
            "[Response tidak bisa dibaca]";

        }

        addLog(

            response.ok
            ?"fetch"
            :"error",

            "FETCH RESPONSE",

            {

                url,

                method,

                status:
                response.status,

                statusText:
                response.statusText,

                time:
                (
                    ended-started
                ).toFixed(0)+" ms",

                response:body

            }

        );

        return response;

    }

    catch(err){

        addLog(

            "error",

            "FETCH FAILED",

            {

                url,

                method,

                error:err.message,

                stack:err.stack

            }

        );

        throw err;

    }

};


/* =========================================
   XMLHTTPREQUEST MONITOR
========================================= */

(function(){

const open=
XMLHttpRequest.prototype.open;

const send=
XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open=function(

method,

url

){

this._debugMethod=method;

this._debugUrl=url;

return open.apply(

this,

arguments

);

};

XMLHttpRequest.prototype.send=function(body){

const start=
performance.now();

this.addEventListener(

"load",

()=>{

addLog(

this.status>=200&&this.status<300
?"fetch"
:"error",

"XHR",

{

method:
this._debugMethod,

url:
this._debugUrl,

status:
this.status,

time:
(
performance.now()-start
).toFixed(0)+" ms"

}

);

}

);

return send.apply(

this,

arguments

);

};

})();


/* =========================================
   PERFORMANCE
========================================= */

setInterval(()=>{

if(performance.memory){

addLog(

"info",

"MEMORY",

{

used:
Math.round(

performance.memory.usedJSHeapSize
/1024/1024

)+" MB",

total:
Math.round(

performance.memory.totalJSHeapSize
/1024/1024

)+" MB"

}

);

}

},30000);

/* =========================================
   DATABASE MONITOR
========================================= */

setTimeout(async()=>{

    if(!window.database){

        addLog(
            "error",
            "DATABASE",
            "window.database belum tersedia"
        );

        return;

    }

    addLog(
        "info",
        "DATABASE",
        "READY"
    );

    if(!window.database.supabase){

        addLog(
            "error",
            "SUPABASE",
            "Client NULL"
        );

        return;

    }

    try{

        const {data,error}=await window.database
        .supabase
        .from("profiles")
        .select("id")
        .limit(1);

        if(error){

            addLog(
                "error",
                "SUPABASE QUERY",
                error
            );

        }else{

            addLog(
                "info",
                "SUPABASE QUERY",
                data
            );

        }

    }catch(e){

        addLog(
            "error",
            "SUPABASE FAILED",
            e.message
        );

    }

},1000);


/* =========================================
   CLICK2PAY USER
========================================= */

setTimeout(async()=>{

    if(!window.database) return;

    try{

        const user=
        await window.database.getUser();

        addLog(
            user
            ?"info"
            :"warn",
            "CURRENT USER",
            user
        );

        if(user){

            const profile=
            await window.database.getProfile(
                user.id
            );

            addLog(
                profile
                ?"info"
                :"warn",
                "CURRENT PROFILE",
                profile
            );

        }

    }catch(e){

        addLog(
            "error",
            "LOAD USER",
            e
        );

    }

},1500);


/* =========================================
   ELEMENT CHECK
========================================= */

setTimeout(()=>{

    const ids=[

        "sellTotalLink",
        "sellTotalPrice",
        "sellTotalView",
        "sellTotalSold",
        "sellList",
        "generatedBox",
        "createSellBtn"

    ];

    ids.forEach(id=>{

        addLog(

            document.getElementById(id)
            ?"info"
            :"warn",

            "ELEMENT",

            {

                id,

                exists:
                !!document.getElementById(id)

            }

        );

    });

},2000);

/* =========================================
   DATABASE FUNCTION MONITOR
========================================= */

setTimeout(()=>{

    if(!window.database){

        addLog(
            "warn",
            "DATABASE MONITOR",
            "window.database belum tersedia"
        );

        return;

    }

    const functions=[

        "getUser",
        "getProfile",
        "getProfiles",
        "getLinks",
        "getLinkByCode",
        "createLink",
        "updateLink",
        "deleteLink",
        "createPayment",
        "getPaymentStatus",
        "checkSellPayment",
        "createSellOrder",
        "getSellOrders",
        "getDashboardReport",
        "getReports"

    ];

    functions.forEach(name=>{

        if(typeof window.database[name]!=="function"){
            return;
        }

        const original=
        window.database[name];

        window.database[name]=async function(...args){

            const start=
            performance.now();

            addLog(
                "info",
                "DATABASE CALL",
                {
                    function:name,
                    arguments:args
                }
            );

            try{

                const result=
                await original.apply(
                    this,
                    args
                );

                addLog(
                    "info",
                    "DATABASE RESULT",
                    {
                        function:name,
                        time:
                        (
                            performance.now()-start
                        ).toFixed(0)+" ms",
                        result
                    }
                );

                return result;

            }catch(e){

                addLog(
                    "error",
                    "DATABASE ERROR",
                    {
                        function:name,
                        error:e.message,
                        stack:e.stack
                    }
                );

                throw e;

            }

        };

    });

    addLog(
        "info",
        "DATABASE MONITOR",
        "Semua fungsi database dipasang"
    );

},2500);

/* =========================================
   DOM WATCHER
========================================= */

setTimeout(()=>{

    const watchIds=[

        "sellTotalLink",
        "sellTotalPrice",
        "sellTotalView",
        "sellTotalSold",
        "sellList",
        "generatedBox",
        "createResult",
        "sellStatus"

    ];

    watchIds.forEach(id=>{

        const element=
        document.getElementById(id);

        if(!element){

            addLog(
                "warn",
                "DOM WATCH",
                {
                    id,
                    status:"ELEMENT TIDAK DITEMUKAN"
                }
            );

            return;

        }

        addLog(
            "info",
            "DOM WATCH",
            {
                id,
                status:"AKTIF"
            }
        );

        const observer=
        new MutationObserver(()=>{

            addLog(
                "info",
                "DOM UPDATE",
                {
                    id,
                    text:
                    element.innerText
                    .substring(0,500),

                    html:
                    element.innerHTML
                    .substring(0,500)
                }
            );

        });

        observer.observe(

            element,

            {

                childList:true,

                subtree:true,

                characterData:true,

                attributes:true

            }

        );

    });

},3000);

/* =========================================
   EVENT MONITOR
========================================= */

setTimeout(()=>{

    const events=[

        "click",
        "change",
        "input",
        "submit",
        "keydown"

    ];

    events.forEach(eventName=>{

        document.addEventListener(

            eventName,

            e=>{

                const target=e.target;

                addLog(

                    "info",

                    "EVENT "+eventName.toUpperCase(),

                    {

                        tag:
                        target.tagName,

                        id:
                        target.id||null,

                        class:
                        target.className||null,

                        name:
                        target.name||null,

                        value:
                        typeof target.value!=="undefined"
                        ?target.value
                        :null,

                        text:
                        (
                            target.innerText||
                            target.textContent||
                            ""
                        )
                        .trim()
                        .substring(0,100)

                    }

                );

            },

            true

        );

    });

    addLog(
        "info",
        "EVENT MONITOR",
        "Semua event aktif"
    );

},3500);

/* =========================================
   LOCAL STORAGE MONITOR
========================================= */

(function(){

    const originalSet=
    Storage.prototype.setItem;

    const originalGet=
    Storage.prototype.getItem;

    const originalRemove=
    Storage.prototype.removeItem;

    const originalClear=
    Storage.prototype.clear;

    Storage.prototype.setItem=function(key,value){

        addLog(

            "info",

            "LOCAL STORAGE SET",

            {

                key,

                value

            }

        );

        return originalSet.apply(
            this,
            arguments
        );

    };

    Storage.prototype.getItem=function(key){

        const value=
        originalGet.apply(
            this,
            arguments
        );

        addLog(

            "info",

            "LOCAL STORAGE GET",

            {

                key,

                value

            }

        );

        return value;

    };

    Storage.prototype.removeItem=function(key){

        addLog(

            "warn",

            "LOCAL STORAGE REMOVE",

            {

                key

            }

        );

        return originalRemove.apply(
            this,
            arguments
        );

    };

    Storage.prototype.clear=function(){

        addLog(

            "warn",

            "LOCAL STORAGE CLEAR",

            "Semua data dihapus"

        );

        return originalClear.apply(
            this,
            arguments
        );

    };

    addLog(
        "info",
        "LOCAL STORAGE MONITOR",
        "Aktif"
    );

})();

/* =========================================
   PERFORMANCE MONITOR
========================================= */

(function(){

    const startTime=Date.now();

    let frame=0;

    let last=performance.now();

    function fpsLoop(now){

        frame++;

        if(now-last>=1000){

            addLog(

                "info",

                "PERFORMANCE",

                {

                    uptime:
                    Math.floor(
                        (Date.now()-startTime)/1000
                    )+" detik",

                    fps:frame,

                    dom:
                    document
                    .getElementsByTagName("*")
                    .length,

                    memory:
                    performance.memory
                    ?{

                        used:
                        Math.round(
                            performance.memory.usedJSHeapSize
                            /1024/1024
                        )+" MB",

                        total:
                        Math.round(
                            performance.memory.totalJSHeapSize
                            /1024/1024
                        )+" MB",

                        limit:
                        Math.round(
                            performance.memory.jsHeapSizeLimit
                            /1024/1024
                        )+" MB"

                    }
                    :"Tidak didukung"

                }

            );

            frame=0;

            last=now;

        }

        requestAnimationFrame(fpsLoop);

    }

    requestAnimationFrame(fpsLoop);

})();

/* =========================================
   RESOURCE MONITOR
========================================= */

window.addEventListener("load",()=>{

    const resources=
    performance.getEntriesByType("resource");

    resources.forEach(item=>{

        addLog(

            "info",

            "RESOURCE",

            {

                name:item.name,

                type:item.initiatorType,

                duration:
                item.duration.toFixed(0)+" ms",

                size:
                item.transferSize||0

            }

        );

    });

});

/* =========================================
   NAVIGATION TIMING
========================================= */

window.addEventListener("load",()=>{

    const nav=
    performance.getEntriesByType("navigation")[0];

    if(!nav) return;

    addLog(

        "info",

        "PAGE SPEED",

        {

            dns:
            nav.domainLookupEnd-
            nav.domainLookupStart,

            connect:
            nav.connectEnd-
            nav.connectStart,

            request:
            nav.responseStart-
            nav.requestStart,

            response:
            nav.responseEnd-
            nav.responseStart,

            dom:
            nav.domComplete-
            nav.domInteractive,

            total:
            nav.loadEventEnd-
            nav.startTime

        }

    );

});

/* =========================================
   COOKIE MONITOR
========================================= */

setInterval(()=>{

    addLog(

        "info",

        "COOKIE",

        document.cookie||

        "Tidak ada cookie"

    );

},60000);


/* =========================================
   SCREEN INFO
========================================= */

addLog(

    "info",

    "SCREEN",

    {

        width:
        screen.width,

        height:
        screen.height,

        colorDepth:
        screen.colorDepth,

        pixelRatio:
        window.devicePixelRatio

    }

);

/* =========================================
   GEOLOCATION
========================================= */

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(

position=>{

addLog(

"info",

"GEOLOCATION",

{

latitude:
position.coords.latitude,

longitude:
position.coords.longitude,

accuracy:
position.coords.accuracy

}

);

},

error=>{

addLog(

"warn",

"GEOLOCATION",

error.message

);

}

);

}

/* =========================================
   BATTERY
========================================= */

if(navigator.getBattery){

navigator.getBattery()

.then(battery=>{

addLog(

"info",

"BATTERY",

{

level:
Math.round(
battery.level*100
)+"%",

charging:
battery.charging

}

);

});

}


/* =========================================
   WINDOW SIZE
========================================= */

window.addEventListener(

"resize",

()=>{

addLog(

"info",

"WINDOW RESIZE",

{

width:
window.innerWidth,

height:
window.innerHeight

}

);

}

);

/* =========================================
   VISIBILITY
========================================= */

document.addEventListener(

"visibilitychange",

()=>{

addLog(

"info",

"PAGE VISIBILITY",

document.hidden
?"HIDDEN"
:"VISIBLE"

);

}
);


/* =========================================
   FINAL
========================================= */

addLog(

"info",

"DEBUG READY",

{

version:"2.0",

time:new Date(),

url:location.href

}

);

})();

