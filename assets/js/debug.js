(function () {
"use strict";

const KEY = "click2pay123";

if (new URLSearchParams(location.search).get("debug") !== KEY) return;

// =========================================
// UTIL
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

    item.innerHTML=`
<b>[${type}]</b>
<pre style="white-space:pre-wrap">${safeJSON(data)}</pre>
`;

    box.prepend(item);

}

window.debug=log;

// =========================================
// PAGE
// =========================================

log("PAGE",{
    url:location.href,
    title:document.title,
    time:new Date().toString()
});

log("DEVICE",navigator.userAgent);

log("NETWORK",navigator.onLine?"ONLINE":"OFFLINE");

// =========================================
// ERROR
// =========================================

window.onerror=function(msg,src,line,col,err){

    log("JS ERROR",{
        message:msg,
        file:src,
        line,
        column:col,
        stack:err?.stack
    });

};

window.addEventListener("unhandledrejection",e=>{
    log("PROMISE ERROR",e.reason);
});

// =========================================
// FETCH
// =========================================

const oldFetch=window.fetch;

window.fetch=async(...args)=>{

    try{

        const res=await oldFetch(...args);

        log(
            res.ok?"FETCH OK":"FETCH ERROR",
            {
                url:String(args[0]),
                status:res.status
            }
        );

        return res;

    }catch(err){

        log("FETCH FAILED",err.message);

        throw err;

    }

};

// =========================================
// CONSOLE
// =========================================

["log","warn","error"].forEach(type=>{

    const old=console[type];

    console[type]=function(...args){

        log("CONSOLE "+type.toUpperCase(),args);

        old.apply(console,args);

    };

});

// =========================================
// DOM READY
// =========================================

document.addEventListener("DOMContentLoaded",()=>{

    log("DOM","READY");

    // SCRIPT

    const scripts=[...document.scripts];

    log("SCRIPT COUNT",scripts.length);

    scripts.forEach((s,i)=>{

        log("SCRIPT "+i,{
            src:s.src||"INLINE",
            async:s.async,
            defer:s.defer
        });

    });

    // CSS

    const css=[...document.querySelectorAll('link[rel="stylesheet"]')];

    log("CSS LINK COUNT",css.length);

    css.forEach((c,i)=>{

        log("CSS "+i,{
            href:c.href,
            disabled:c.disabled
        });

    });

    // INLINE STYLE

    const styles=[...document.querySelectorAll("style")];

    log("INLINE STYLE",styles.length);

    // data-debug

    const debugElements=document.querySelectorAll("[data-debug]");

    log("DEBUG ELEMENT COUNT",debugElements.length);

    debugElements.forEach(el=>{

        log("ELEMENT",{
            id:el.id,
            tag:el.tagName
        });

    });

});

// =========================================
// DATABASE
// =========================================

setTimeout(()=>{

    log("DATABASE",window.database?"READY":"NULL");

    if(window.database){

        log(
            "SUPABASE",
            window.database.supabase?"READY":"NULL"
        );

    }

},1500);

// =========================================
// USER
// =========================================

setTimeout(()=>{

    log(
        "USER_ID",
        localStorage.getItem("user_id")||"KOSONG"
    );

},2000);

// =========================================
// CSS ACTIVE
// =========================================

setTimeout(()=>{

    [...document.styleSheets].forEach((sheet,i)=>{

        try{

            log("CSS ACTIVE "+i,{
                href:sheet.href||"INLINE",
                rules:sheet.cssRules.length
            });

        }catch(e){

            log("CSS BLOCKED",sheet.href);

        }

    });

},3000);

// =========================================
// SUPABASE TEST
// =========================================

setTimeout(async()=>{

    if(!window.database)return;

    try{

        const {error}=await window.database.supabase
        .from("profiles")
        .select("id")
        .limit(1);

        log(
            error?"SUPABASE ERROR":"SUPABASE QUERY",
            error||"OK"
        );

    }catch(e){

        log("SUPABASE FAILED",e.message);

    }

},5000);

})();
