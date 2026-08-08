/* =========================================================
   CLICK2PAY MOBILE DEBUGGER
   File : assets/js/debug.js
   Version : 5.0 PAGE FOCUS
   =========================================================
   DEBUGGER HANYA FOKUS PADA HALAMAN AKTIF

   Contoh:
   /dashboard.html?debug=debug111
        -> DASHBOARD SAJA

   /sell-link.html?debug=debug111
        -> SELL LINK SAJA

   /create-link.html?debug=debug111
        -> CREATE LINK SAJA
========================================================= */

(function () {

"use strict";


/* =========================================================
   DEBUG ACCESS
========================================================= */

const DEBUG_KEY = "debug111";

const params =
    new URLSearchParams(
        window.location.search
    );

if (
    params.get("debug") !==
    DEBUG_KEY
) {
    return;
}


/* =========================================================
   PAGE FOCUS
========================================================= */

function detectPage() {

    let path =
        window.location.pathname
            .replace(/\/+$/, "")
            .split("/")
            .pop()
            .toLowerCase();

    if (!path) {
        return "index";
    }

    path =
        path
            .replace(".html", "")
            .replace(".htm", "");

    return path;
}


const DEBUG_PAGE =
    detectPage();


/* =========================================================
   PAGE CONFIGURATION
========================================================= */

const PAGE_FOCUS = {

    dashboard: {
        name: "DASHBOARD",

        keywords: [
            "dashboard",
            "announcement",
            "statistics",
            "stat",
            "report",
            "cpm",
            "balance",
            "earning",
            "withdraw",
            "link"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile",
            "getLinks",
            "getReports",
            "getDashboardReport",
            "getCPMMarket",
            "getAnnouncements"
        ]

    },


    "sell-link": {
        name: "SELL LINK",

        keywords: [
            "sell",
            "sell-link",
            "sell link",
            "order",
            "payment",
            "invoice",
            "seller",
            "profile",
            "withdraw"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile",
            "getSellOrders"
        ]

    },


    "create-link": {
        name: "CREATE LINK",

        keywords: [
            "create",
            "link",
            "shortlink",
            "ads",
            "advertiser",
            "cpm"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile",
            "getLinks"
        ]

    },


    login: {
        name: "LOGIN",

        keywords: [
            "login",
            "auth",
            "session",
            "user",
            "signin",
            "password"
        ],

        database: [
            "getUser",
            "getCurrentUser"
        ]

    },


    register: {
        name: "REGISTER",

        keywords: [
            "register",
            "auth",
            "user",
            "profile",
            "signup",
            "username"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile"
        ]

    },


    history: {
        name: "HISTORY",

        keywords: [
            "history",
            "payment",
            "withdraw",
            "transaction",
            "invoice",
            "order"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile"
        ]

    },


    profile: {
        name: "PROFILE",

        keywords: [
            "profile",
            "user",
            "account",
            "username",
            "email",
            "payment"
        ],

        database: [
            "getUser",
            "getCurrentUser",
            "getProfile",
            "getCurrentProfile"
        ]

    }

};


const ACTIVE_PAGE =
    PAGE_FOCUS[DEBUG_PAGE] || {

        name:
            DEBUG_PAGE
                .toUpperCase(),

        keywords: [],

        database: []

    };


/* =========================================================
   PAGE RELATED CHECK
========================================================= */

function isPageRelated(
    title,
    data = null
) {

    /*
     * Error global selalu dianggap
     * penting untuk halaman aktif.
     */

    const titleText =
        String(
            title || ""
        ).toLowerCase();


    if (
        titleText.includes(
            "javascript error"
        ) ||
        titleText.includes(
            "promise error"
        ) ||
        titleText.includes(
            "fetch failed"
        ) ||
        titleText.includes(
            "database error"
        ) ||
        titleText.includes(
            "auth check error"
        )
    ) {

        return true;

    }


    /*
     * Kalau halaman tidak punya
     * keyword khusus, tampilkan semua.
     */

    if (
        !ACTIVE_PAGE.keywords ||
        ACTIVE_PAGE.keywords.length === 0
    ) {

        return true;

    }


    const text = (

        String(title || "") +
        " " +
        stringify(data)

    ).toLowerCase();


    return ACTIVE_PAGE.keywords.some(
        function (keyword) {

            return text.includes(
                keyword.toLowerCase()
            );

        }
    );

}


/* =========================================================
   STATE
========================================================= */

const logs = [];

let panelVisible = true;

let currentProfile = null;


/* =========================================================
   STATS
========================================================= */

const stats = {

    info: 0,
    warn: 0,
    error: 0,
    auth: 0,
    db: 0,
    redirect: 0

};


/* =========================================================
   HELPERS
========================================================= */

function now() {

    return new Date()
        .toLocaleTimeString(
            "id-ID",
            {
                hour12: false
            }
        );

}


function stringify(data) {

    try {

        if (
            data === undefined
        ) {

            return "undefined";

        }


        if (
            data === null
        ) {

            return "null";

        }


        if (
            typeof data ===
            "string"
        ) {

            return data;

        }


        return JSON.stringify(
            data,
            null,
            2
        );

    }

    catch (error) {

        return String(
            data
        );

    }

}


/* =========================================================
   CREATE STYLE
========================================================= */

const style =
    document.createElement(
        "style"
    );

style.id =
    "c2pMobileDebugStyle";


style.textContent = `

#c2pMobileDebug{

position:fixed;

left:10px;
right:10px;
bottom:10px;

height:65vh;

max-height:650px;
min-height:300px;

background:#0f172a;

color:#fff;

border-radius:18px;

overflow:hidden;

z-index:2147483647;

box-shadow:
0 15px 50px
rgba(0,0,0,.45);

font-family:
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;

display:flex;
flex-direction:column;

border:1px solid
rgba(255,255,255,.12);

}


#c2pMobileHeader{

height:52px;
min-height:52px;

background:#111827;

display:flex;

align-items:center;
justify-content:space-between;

padding:0 12px;

border-bottom:
1px solid
rgba(255,255,255,.08);

}


#c2pMobileTitle{

font-size:13px;

font-weight:800;

display:flex;

align-items:center;

gap:7px;

}


#c2pMobileActions{

display:flex;

gap:5px;

}


.c2pMobileBtn{

border:0;

background:#1e293b;

color:#fff;

border-radius:9px;

height:32px;

padding:
0 9px;

font-size:11px;

font-weight:700;

cursor:pointer;

}


.c2pMobileBtn:active{

transform:scale(.95);

}


.c2pMobileBtn.primary{

background:#2563eb;

}


.c2pMobileBtn.danger{

background:#dc2626;

}


#c2pMobileStats{

display:grid;

grid-template-columns:
repeat(6,1fr);

gap:4px;

padding:7px;

background:#0b1220;

}


.c2pStat{

background:#172033;

border-radius:8px;

padding:5px 2px;

text-align:center;

font-size:8px;

color:#94a3b8;

}


.c2pStat b{

display:block;

font-size:13px;

color:#fff;

margin-bottom:1px;

}


#c2pMobileSearch{

padding:7px;

background:#0f172a;

}


#c2pMobileSearch input{

width:100%;

height:34px;

box-sizing:border-box;

border:1px solid
#263449;

border-radius:9px;

outline:none;

padding:
0 10px;

background:#111827;

color:#fff;

font-size:12px;

}


#c2pMobileLogs{

flex:1;

overflow-y:auto;

-webkit-overflow-scrolling:touch;

padding:7px;

background:#020617;

}


.c2pLog{

margin-bottom:7px;

padding:9px;

border-radius:10px;

border-left:
3px solid #64748b;

background:#111827;

word-break:break-word;

}


.c2pLog.info{

border-left-color:#3b82f6;

}


.c2pLog.auth{

border-left-color:#8b5cf6;

}


.c2pLog.db{

border-left-color:#06b6d4;

}


.c2pLog.warn{

border-left-color:#f59e0b;

background:#241b0a;

}


.c2pLog.error{

border-left-color:#ef4444;

background:#2a0d0d;

}


.c2pLog.redirect{

border-left-color:#22c55e;

background:#0a2114;

}


.c2pLogTime{

font-size:9px;

color:#64748b;

margin-bottom:3px;

}


.c2pLogTitle{

font-size:11px;

font-weight:800;

margin-bottom:5px;

color:#e2e8f0;

}


.c2pLogBody{

font-family:
ui-monospace,
SFMono-Regular,
Menlo,
monospace;

font-size:10px;

line-height:1.45;

color:#cbd5e1;

white-space:pre-wrap;

}


#c2pMobileHandle{

position:fixed;

right:12px;

bottom:12px;

width:52px;
height:52px;

border-radius:50%;

background:#2563eb;

color:#fff;

z-index:2147483646;

display:none;

align-items:center;
justify-content:center;

font-size:21px;

font-weight:bold;

box-shadow:
0 8px 25px
rgba(0,0,0,.35);

border:0;

}


#c2pMobileStatus{

padding:5px 9px;

font-size:9px;

color:#94a3b8;

background:#020617;

border-top:
1px solid
rgba(255,255,255,.06);

}


.c2pSuccess{

color:#22c55e;

}


.c2pDanger{

color:#ef4444;

}

`;

document.head.appendChild(
    style
);


/* =========================================================
   PANEL
========================================================= */

const panel =
    document.createElement(
        "div"
    );

panel.id =
    "c2pMobileDebug";


panel.innerHTML = `

<div id="c2pMobileHeader">

    <div id="c2pMobileTitle">

        🐞 C2P —
        ${escapeHtml(
            ACTIVE_PAGE.name
        )}

    </div>

    <div id="c2pMobileActions">

        <button
            class="c2pMobileBtn primary"
            id="c2pCopy"
        >
            Copy
        </button>

        <button
            class="c2pMobileBtn"
            id="c2pRefresh"
        >
            Check
        </button>

        <button
            class="c2pMobileBtn danger"
            id="c2pClear"
        >
            Clear
        </button>

        <button
            class="c2pMobileBtn"
            id="c2pHide"
        >
            ×
        </button>

    </div>

</div>


<div id="c2pMobileStats">

    <div class="c2pStat">
        <b id="c2pInfo">0</b>
        INFO
    </div>

    <div class="c2pStat">
        <b id="c2pWarn">0</b>
        WARN
    </div>

    <div class="c2pStat">
        <b id="c2pError">0</b>
        ERROR
    </div>

    <div class="c2pStat">
        <b id="c2pAuth">0</b>
        AUTH
    </div>

    <div class="c2pStat">
        <b id="c2pDb">0</b>
        DB
    </div>

    <div class="c2pStat">
        <b id="c2pRedirect">0</b>
        REDIR
    </div>

</div>


<div id="c2pMobileSearch">

    <input
        id="c2pSearch"
        placeholder="Cari log..."
    >

</div>


<div id="c2pMobileLogs"></div>


<div id="c2pMobileStatus">

    DEBUG AKTIF —
    ${escapeHtml(
        ACTIVE_PAGE.name
    )}

</div>

`;


/*
 * Body mungkin belum tersedia
 * jika script berada di <head>.
 */

function mountPanel() {

    if (
        !document.body
    ) {

        return;

    }

    if (
        !document.getElementById(
            "c2pMobileDebug"
        )
    ) {

        document.body.appendChild(
            panel
        );

    }

}


mountPanel();


/* =========================================================
   HANDLE BUTTON
========================================================= */

const handle =
    document.createElement(
        "button"
    );

handle.id =
    "c2pMobileHandle";

handle.innerHTML =
    "🐞";

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (
            !document.body.contains(
                handle
            )
        ) {

            document.body.appendChild(
                handle
            );

        }

    }
);


/* =========================================================
   ELEMENT
========================================================= */

function getElement(id) {

    return document.getElementById(
        id
    );

}


const logBox =
    getElement(
        "c2pMobileLogs"
    );

const search =
    getElement(
        "c2pSearch"
    );

const statusBox =
    getElement(
        "c2pMobileStatus"
    );


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStats() {

    const info =
        getElement(
            "c2pInfo"
        );

    const warn =
        getElement(
            "c2pWarn"
        );

    const error =
        getElement(
            "c2pError"
        );

    const auth =
        getElement(
            "c2pAuth"
        );

    const db =
        getElement(
            "c2pDb"
        );

    const redirect =
        getElement(
            "c2pRedirect"
        );


    if (info)
        info.textContent =
            stats.info;

    if (warn)
        warn.textContent =
            stats.warn;

    if (error)
        error.textContent =
            stats.error;

    if (auth)
        auth.textContent =
            stats.auth;

    if (db)
        db.textContent =
            stats.db;

    if (redirect)
        redirect.textContent =
            stats.redirect;

}


/* =========================================================
   ADD LOG
========================================================= */

function addLog(
    type,
    title,
    data = null,
    force = false
) {

    /*
     * PAGE FOCUS
     */

    if (
        !force &&
        !isPageRelated(
            title,
            data
        )
    ) {

        return;

    }


    const item = {

        time:
            now(),

        type,

        title,

        data

    };


    logs.push(
        item
    );


    if (
        stats[type] !==
        undefined
    ) {

        stats[type]++;

    }


    updateStats();

    renderLog(
        item
    );

}


/* =========================================================
   RENDER LOG
========================================================= */

function renderLog(
    item
) {

    if (!logBox) {

        return;

    }


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "c2pLog " +
        item.type;


    div.dataset.search = (

        item.title +
        " " +
        stringify(
            item.data
        )

    )
        .toLowerCase();


    div.innerHTML = `

        <div class="c2pLogTime">

            ${escapeHtml(
                item.time
            )}

        </div>


        <div class="c2pLogTitle">

            ${escapeHtml(
                item.title
            )}

        </div>


        <div class="c2pLogBody">

            ${escapeHtml(
                stringify(
                    item.data
                )
            )}

        </div>

    `;


    logBox.prepend(
        div
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SEARCH
========================================================= */

if (search) {

    search.addEventListener(
        "input",
        function () {

            const keyword =
                search.value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(
                    "#c2pMobileLogs .c2pLog"
                )
                .forEach(
                    function (
                        item
                    ) {

                        item.style.display =
                            item.dataset.search
                                .includes(
                                    keyword
                                )
                                ? ""
                                : "none";

                    }
                );

        }
    );

}


/* =========================================================
   HIDE / SHOW
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.id ===
            "c2pHide"
        ) {

            panelVisible =
                false;

            const p =
                getElement(
                    "c2pMobileDebug"
                );

            if (p) {

                p.style.display =
                    "none";

            }

            handle.style.display =
                "flex";

        }


        if (
            event.target ===
            handle
        ) {

            panelVisible =
                true;

            const p =
                getElement(
                    "c2pMobileDebug"
                );

            if (p) {

                p.style.display =
                    "flex";

            }

            handle.style.display =
                "none";

        }

    }
);


/* =========================================================
   CLEAR
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.id !==
            "c2pClear"
        ) {

            return;

        }


        logs.length = 0;

        if (logBox) {

            logBox.innerHTML =
                "";

        }


        stats.info = 0;
        stats.warn = 0;
        stats.error = 0;
        stats.auth = 0;
        stats.db = 0;
        stats.redirect = 0;


        updateStats();


        addLog(
            "info",
            "DEBUG CLEARED",
            {
                page:
                    ACTIVE_PAGE.name,
                message:
                    "Log halaman dibersihkan"
            },
            true
        );

    }
);


/* =========================================================
   COPY DEBUG
========================================================= */

document.addEventListener(
    "click",
    async function (event) {

        if (
            event.target.id !==
            "c2pCopy"
        ) {

            return;

        }


        const text =
            logs
                .map(
                    function (
                        item
                    ) {

                        return [

                            `[${item.time}]`,

                            `[${item.type.toUpperCase()}]`,

                            item.title,

                            stringify(
                                item.data
                            )

                        ].join(
                            "\n"
                        );

                    }
                )
                .join(
                    "\n\n--------------------\n\n"
                );


        try {

            await navigator
                .clipboard
                .writeText(
                    text
                );

        }

        catch (error) {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text;

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        }


        if (statusBox) {

            statusBox.innerHTML = `

                <span class="c2pSuccess">

                    ✓ DEBUG
                    ${escapeHtml(
                        ACTIVE_PAGE.name
                    )}
                    BERHASIL DICOPY

                </span>

            `;

        }


        setTimeout(
            function () {

                if (statusBox) {

                    statusBox.textContent =
                        "DEBUG AKTIF — " +
                        ACTIVE_PAGE.name;

                }

            },
            2000
        );

    }
);


/* =========================================================
   GLOBAL DEBUG
========================================================= */

window.c2pDebug =
    function (
        title,
        data = null,
        type = "info"
    ) {

        addLog(
            type,
            title,
            data
        );

    };


/* =========================================================
   LOCAL STORAGE
========================================================= */

function storageSnapshot() {

    const data = {};

    try {

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(
                    i
                );

            data[key] =
                localStorage.getItem(
                    key
                );

        }

    }

    catch (error) {

        data.error =
            error.message;

    }

    return data;

}


/*
 * Hanya tampilkan storage
 * jika memang relevan dengan
 * halaman aktif.
 */

addLog(
    "info",
    "LOCAL STORAGE",
    storageSnapshot()
);


/* =========================================================
   AUTH STORAGE
========================================================= */

addLog(
    "auth",
    "AUTH STORAGE",
    {

        user_id:
            localStorage.getItem(
                "user_id"
            ),

        username:
            localStorage.getItem(
                "username"
            )

    }
);


/* =========================================================
   PAGE INFO
========================================================= */

addLog(
    "info",
    "PAGE INFO",
    {

        debug_page:
            DEBUG_PAGE,

        active_page:
            ACTIVE_PAGE.name,

        url:
            location.href,

        path:
            location.pathname,

        referrer:
            document.referrer,

        title:
            document.title,

        online:
            navigator.onLine,

        screen:
            `${screen.width}x${screen.height}`

    },
    true
);


/* =========================================================
   JAVASCRIPT ERROR
========================================================= */

window.addEventListener(
    "error",
    function (event) {

        addLog(
            "error",
            "JAVASCRIPT ERROR",
            {

                message:
                    event.message,

                file:
                    event.filename,

                line:
                    event.lineno,

                column:
                    event.colno,

                stack:
                    event.error?.stack

            },
            true
        );

    }
);


/* =========================================================
   PROMISE ERROR
========================================================= */

window.addEventListener(
    "unhandledrejection",
    function (event) {

        addLog(
            "error",
            "PROMISE ERROR",
            {

                message:
                    event.reason?.message,

                reason:
                    event.reason,

                stack:
                    event.reason?.stack

            },
            true
        );

    }
);


/* =========================================================
   ONLINE / OFFLINE
========================================================= */

window.addEventListener(
    "online",
    function () {

        addLog(
            "info",
            "NETWORK",
            "ONLINE",
            true
        );

    }
);


window.addEventListener(
    "offline",
    function () {

        addLog(
            "warn",
            "NETWORK",
            "OFFLINE",
            true
        );

    }
);


/* =========================================================
   STORAGE MONITOR
========================================================= */

(function () {

    const originalSet =
        Storage.prototype.setItem;

    const originalRemove =
        Storage.prototype.removeItem;

    const originalClear =
        Storage.prototype.clear;


    Storage.prototype.setItem =
        function (
            key,
            value
        ) {

            addLog(
                "info",
                "STORAGE SET",
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


    Storage.prototype.removeItem =
        function (
            key
        ) {

            addLog(
                "warn",
                "STORAGE REMOVE",
                {
                    key
                }
            );

            return originalRemove.apply(
                this,
                arguments
            );

        };


    Storage.prototype.clear =
        function () {

            addLog(
                "warn",
                "STORAGE CLEAR",
                "Semua localStorage dihapus"
            );

            return originalClear.apply(
                this,
                arguments
            );

        };

})();


/* =========================================================
   REDIRECT MONITOR
========================================================= */

(function () {

    const originalAssign =
        window.location.assign;

    const originalReplace =
        window.location.replace;


    try {

        window.location.assign =
            function (
                url
            ) {

                addLog(
                    "redirect",
                    "REDIRECT ASSIGN",
                    {

                        from:
                            location.href,

                        to:
                            url

                    },
                    true
                );


                return originalAssign.call(
                    window.location,
                    url
                );

            };


        window.location.replace =
            function (
                url
            ) {

                addLog(
                    "redirect",
                    "REDIRECT REPLACE",
                    {

                        from:
                            location.href,

                        to:
                            url

                    },
                    true
                );


                return originalReplace.call(
                    window.location,
                    url
                );

            };

    }

    catch (error) {

        addLog(
            "warn",
            "REDIRECT MONITOR",
            "Browser membatasi monitoring location",
            true
        );

    }

})();


/* =========================================================
   FETCH MONITOR
========================================================= */

(function () {

    if (
        typeof window.fetch !==
        "function"
    ) {

        return;

    }


    const originalFetch =
        window.fetch;


    window.fetch =
        async function (
            ...args
        ) {

            const started =
                performance.now();


            const url =
                String(
                    args[0]
                );


            const options =
                args[1] || {};


            const method =
                options.method ||
                "GET";


            /*
             * FETCH harus relevan
             * dengan halaman aktif.
             */

            addLog(
                "db",
                "FETCH START",
                {
                    method,
                    url
                }
            );


            try {

                const response =
                    await originalFetch.apply(
                        this,
                        args
                    );


                addLog(
                    response.ok
                        ? "db"
                        : "error",

                    "FETCH RESPONSE",

                    {

                        method,

                        url,

                        status:
                            response.status,

                        duration:
                            (
                                performance.now()
                                -
                                started
                            ).toFixed(0)
                            +
                            " ms"

                    }
                );


                return response;

            }

            catch (error) {

                addLog(
                    "error",
                    "FETCH FAILED",
                    {

                        method,

                        url,

                        message:
                            error.message

                    },
                    true
                );


                throw error;

            }

        };

})();


/* =========================================================
   DATABASE FUNCTION MONITOR
========================================================= */

function monitorDatabase() {

    if (
        !window.database
    ) {

        addLog(
            "error",
            "DATABASE",
            "window.database BELUM TERSEDIA",
            true
        );

        return;

    }


    addLog(
        "db",
        "DATABASE READY",
        {

            page:
                ACTIVE_PAGE.name,

            supabase:
                !!window.database.supabase

        },
        true
    );


    const methods =
        ACTIVE_PAGE.database || [];


    methods.forEach(
        function (
            name
        ) {

            if (
                typeof
                window.database[name]
                !==
                "function"
            ) {

                return;

            }


            const original =
                window.database[name];


            if (
                original.__c2pWrapped
            ) {

                return;

            }


            async function wrapped(
                ...args
            ) {

                const started =
                    performance.now();


                addLog(
                    "db",
                    "DATABASE CALL",
                    {

                        function:
                            name,

                        arguments:
                            args

                    },
                    true
                );


                try {

                    const result =
                        await original.apply(
                            this,
                            args
                        );


                    addLog(
                        "db",
                        "DATABASE RESULT",
                        {

                            function:
                                name,

                            duration:
                                (
                                    performance.now()
                                    -
                                    started
                                ).toFixed(0)
                                +
                                " ms",

                            result

                        },
                        true
                    );


                    return result;

                }

                catch (error) {

                    addLog(
                        "error",
                        "DATABASE ERROR",
                        {

                            function:
                                name,

                            message:
                                error.message,

                            stack:
                                error.stack

                        },
                        true
                    );


                    throw error;

                }

            }


            wrapped.__c2pWrapped =
                true;


            window.database[name] =
                wrapped;

        }
    );

}


/* =========================================================
   CHECK AUTH
========================================================= */

async function checkAuth() {

    if (
        !window.database
    ) {

        addLog(
            "error",
            "AUTH CHECK",
            "Database belum tersedia",
            true
        );

        return;

    }


    try {

        /*
         * SUPABASE SESSION
         */

        if (
            window.database.supabase
        ) {

            const result =
                await window.database
                    .supabase
                    .auth
                    .getSession();


            if (
                result.error
            ) {

                addLog(
                    "error",
                    "SUPABASE SESSION",
                    result.error,
                    true
                );

            }

            else {

                const session =
                    result.data?.session;


                addLog(
                    session
                        ? "auth"
                        : "warn",

                    "SUPABASE SESSION",

                    {

                        exists:
                            !!session,

                        user_id:
                            session
                                ?.user
                                ?.id ||
                            null,

                        email:
                            session
                                ?.user
                                ?.email ||
                            null

                    },
                    true
                );

            }

        }


        /*
         * CURRENT USER
         */

        let user = null;

        let profile = null;


        if (
            typeof
            window.database
                .getUser ===
            "function"
        ) {

            user =
                await window.database
                    .getUser();

        }


        addLog(
            user
                ? "auth"
                : "warn",

            "CURRENT USER",

            user,

            true
        );


        /*
         * PROFILE
         */

        if (
            user &&
            typeof
            window.database
                .getProfile ===
            "function"
        ) {

            profile =
                await window.database
                    .getProfile(
                        user.id
                    );

        }


        if (
            !profile &&
            typeof
            window.database
                .getCurrentProfile ===
            "function"
        ) {

            profile =
                await window.database
                    .getCurrentProfile();

        }


        currentProfile =
            profile;


        addLog(
            profile
                ? "auth"
                : "warn",

            "CURRENT PROFILE",

            profile,

            true
        );


        /*
         * SELL ACCESS
         *
         * HANYA DI SELL LINK
         */

        if (
            profile &&
            DEBUG_PAGE ===
                "sell-link"
        ) {

            checkSellAccess(
                profile
            );

        }

    }

    catch (error) {

        addLog(
            "error",
            "AUTH CHECK ERROR",
            {

                message:
                    error.message,

                stack:
                    error.stack

            },
            true
        );

    }

}


/* =========================================================
   SELL ACCESS
   HANYA SELL LINK
========================================================= */

function checkSellAccess(
    profile
) {

    if (
        DEBUG_PAGE !==
        "sell-link"
    ) {

        return;

    }


    const status =
        String(
            profile.status ||
            "active"
        ).toLowerCase();


    const sellEnabled =
        profile.sell_link_enabled
        === true;


    const sellUnlocked =
        profile.sell_unlocked
        === true;


    const withdrawCount =
        Number(
            profile.withdraw_count ||
            0
        );


    const withdrawPassed =
        withdrawCount >= 3;


    const enabled =
        sellEnabled ||
        sellUnlocked ||
        withdrawPassed;


    addLog(
        enabled
            ? "auth"
            : "warn",

        enabled
            ? "🔓 SELL LINK UNLOCKED"
            : "🔒 SELL LINK LOCKED",

        {

            account_status:
                status,

            sell_link_enabled:
                profile.sell_link_enabled,

            sell_unlocked:
                profile.sell_unlocked,

            withdraw_count:
                withdrawCount,

            withdraw_requirement:
                "withdraw_count >= 3",

            requirement_pass:
                withdrawPassed,

            FINAL_RESULT:
                enabled
                    ? "UNLOCKED"
                    : "LOCKED"

        },

        true
    );


    /*
     * SELL CARD
     */

    setTimeout(
        function () {

            const cards =
                document.querySelectorAll(
                    ".sell-card"
                );


            addLog(
                cards.length
                    ? "info"
                    : "warn",

                "SELL CARD",

                {

                    total:
                        cards.length,

                    locked:
                        Array.from(
                            cards
                        ).filter(
                            card =>
                                card.classList
                                    .contains(
                                        "locked"
                                    )
                        ).length

                },

                true
            );


            cards.forEach(
                function (
                    card,
                    index
                ) {

                    addLog(
                        card.classList.contains(
                            "locked"
                        )
                            ? "warn"
                            : "info",

                        `SELL CARD #${index + 1}`,

                        {

                            class:
                                card.className,

                            locked:
                                card.classList.contains(
                                    "locked"
                                )

                        },

                        true
                    );

                }
            );

        },
        300
    );

}


/* =========================================================
   REFRESH CHECK
========================================================= */

async function refreshCheck() {

    addLog(
        "info",
        "MANUAL CHECK",
        {

            page:
                ACTIVE_PAGE.name,

            message:
                "Memulai pemeriksaan ulang..."

        },
        true
    );


    await checkAuth();


    /*
     * Hanya SELL LINK
     */

    if (
        DEBUG_PAGE ===
            "sell-link" &&
        typeof
        window.checkSellStatus ===
            "function"
    ) {

        try {

            await window.checkSellStatus();


            addLog(
                "info",
                "CHECK SELL STATUS",
                "Function berhasil dijalankan",
                true
            );

        }

        catch (error) {

            addLog(
                "error",
                "CHECK SELL STATUS ERROR",
                error,
                true
            );

        }

    }


    addLog(
        "info",
        "MANUAL CHECK",
        "Selesai",
        true
    );

}


/* =========================================================
   CHECK BUTTON
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.id ===
            "c2pRefresh"
        ) {

            refreshCheck();

        }

    }
);


/* =========================================================
   GLOBAL C2P OBJECT
========================================================= */

window.c2p = {

    logs,

    stats,


    page:
        DEBUG_PAGE,


    pageName:
        ACTIVE_PAGE.name,


    getProfile:
        () =>
            currentProfile,


    checkSell:
        () => {

            if (
                currentProfile &&
                DEBUG_PAGE ===
                    "sell-link"
            ) {

                checkSellAccess(
                    currentProfile
                );

            }

        },


    refresh:
        refreshCheck,


    storage:
        () => {

            addLog(
                "info",
                "STORAGE",
                storageSnapshot(),
                true
            );

        },


    clear:
        () => {

            const button =
                getElement(
                    "c2pClear"
                );

            if (button) {

                button.click();

            }

        }

    };



/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        mountPanel();


        addLog(
            "info",
            "DOM READY",
            {

                page:
                    ACTIVE_PAGE.name,

                url:
                    location.href,

                title:
                    document.title

            },
            true
        );


        /*
         * SELL CARD hanya diperiksa
         * di halaman SELL LINK
         */

        if (
            DEBUG_PAGE ===
            "sell-link"
        ) {

            const sellCards =
                document.querySelectorAll(
                    ".sell-card"
                );


            addLog(
                sellCards.length
                    ? "info"
                    : "warn",

                "SELL CARD DETECTION",

                {

                    count:
                        sellCards.length

                },

                true
            );

        }

    }
);


/* =========================================================
   AUTH STATE MONITOR
========================================================= */

setTimeout(
    function () {

        const supabase =
            window.database?.supabase;


        if (!supabase) {

            return;

        }


        try {

            supabase.auth.onAuthStateChange(
                function (
                    event,
                    session
                ) {

                    addLog(
                        "auth",

                        "AUTH STATE CHANGE",

                        {

                            event,

                            session:
                                !!session,

                            user_id:
                                session
                                    ?.user
                                    ?.id ||
                                null,

                            email:
                                session
                                    ?.user
                                    ?.email ||
                                null

                        },

                        true
                    );

                }
            );

        }

        catch (error) {

            addLog(
                "error",
                "AUTH STATE ERROR",
                error,
                true
            );

        }

    },
    2000
);


/* =========================================================
   INITIAL DATABASE CHECK
========================================================= */

setTimeout(
    monitorDatabase,
    1800
);


/* =========================================================
   INITIAL AUTH CHECK
========================================================= */

setTimeout(
    checkAuth,
    2800
);


/* =========================================================
   READY
========================================================= */

addLog(
    "info",

    "🐞 MOBILE DEBUG READY",

    {

        version:
            "5.0",

        debug_page:
            DEBUG_PAGE,

        active_page:
            ACTIVE_PAGE.name,

        url:
            location.href,

        usage:
            "Debugger hanya monitoring halaman aktif"

    },

    true
);


})();
