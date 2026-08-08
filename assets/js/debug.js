/* =========================================================
   CLICK2PAY MOBILE DEBUGGER
   File : assets/js/debug.js
   Version : 4.0 MOBILE
   Focus :
   LOGIN ↔ DASHBOARD ↔ SELL LINK
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
        return String(data);
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
font-size:14px;
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
        🐞 CLICK2PAY DEBUG
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
        placeholder="Cari: SELL / PROFILE / ERROR..."
    >
</div>
<div id="c2pMobileLogs"></div>
<div id="c2pMobileStatus">
    DEBUG AKTIF
</div>
`;
document.body.appendChild(
    panel
);
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
document.body.appendChild(
    handle
);
/* =========================================================
   ELEMENT
========================================================= */
const logBox =
    document.getElementById(
        "c2pMobileLogs"
    );
const search =
    document.getElementById(
        "c2pSearch"
    );
const statusBox =
    document.getElementById(
        "c2pMobileStatus"
    );
/* =========================================================
   UPDATE STATS
========================================================= */
function updateStats() {
    document.getElementById(
        "c2pInfo"
    ).textContent =
        stats.info;
    document.getElementById(
        "c2pWarn"
    ).textContent =
        stats.warn;
    document.getElementById(
        "c2pError"
    ).textContent =
        stats.error;
    document.getElementById(
        "c2pAuth"
    ).textContent =
        stats.auth;
    document.getElementById(
        "c2pDb"
    ).textContent =
        stats.db;
    document.getElementById(
        "c2pRedirect"
    ).textContent =
        stats.redirect;
}
/* =========================================================
   ADD LOG
========================================================= */
function addLog(
    type,
    title,
    data = null
) {
    const item = {
        time:
            now(),
        type,
        title,
        data
    };
    logs.push(item);
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
    const div =
        document.createElement(
            "div"
        );
    div.className =
        "c2pLog " +
        item.type;
    div.dataset.search =
        (
            item.title +
            " " +
            stringify(
                item.data
            )
        )
        .toLowerCase();
    div.innerHTML = `
        <div class="c2pLogTime">
            ${item.time}
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
    return String(value)
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
/* =========================================================
   HIDE / SHOW
========================================================= */
document.getElementById(
    "c2pHide"
).onclick = function () {
    panelVisible =
        false;
    panel.style.display =
        "none";
    handle.style.display =
        "flex";
};
handle.onclick =
    function () {
        panelVisible =
            true;
        panel.style.display =
            "flex";
        handle.style.display =
            "none";
    };
/* =========================================================
   CLEAR
========================================================= */
document.getElementById(
    "c2pClear"
).onclick =
    function () {
        logs.length = 0;
        logBox.innerHTML =
            "";
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
            "Log dibersihkan"
        );
    };
/* =========================================================
   COPY DEBUG
========================================================= */
document.getElementById(
    "c2pCopy"
).onclick =
    async function () {
        const text =
            logs.map(
                item => {
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
            ).join(
                "\n\n--------------------\n\n"
            );
        try {
            await navigator
                .clipboard
                .writeText(
                    text
                );
            statusBox.innerHTML =
                `<span class="c2pSuccess">
                    ✓ DEBUG BERHASIL DICOPY
                </span>`;
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
            statusBox.innerHTML =
                `<span class="c2pSuccess">
                    ✓ DEBUG BERHASIL DICOPY
                </span>`;
        }
        setTimeout(
            function () {
                statusBox.textContent =
                    "DEBUG AKTIF";
            },
            2000
        );
    };
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
    }
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
            }
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
            }
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
            "ONLINE"
        );
    }
);
window.addEventListener(
    "offline",
    function () {
        addLog(
            "warn",
            "NETWORK",
            "OFFLINE"
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
            function (url) {
                addLog(
                    "redirect",
                    "REDIRECT ASSIGN",
                    {
                        from:
                            location.href,
                        to:
                            url
                    }
                );
                return originalAssign.call(
                    window.location,
                    url
                );
            };
        window.location.replace =
            function (url) {
                addLog(
                    "redirect",
                    "REDIRECT REPLACE",
                    {
                        from:
                            location.href,
                        to:
                            url
                    }
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
            "Browser membatasi monitoring location"
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
                    }
                );
                throw error;
            }
        };
})();
/* =========================================================
   DATABASE FUNCTION MONITOR
========================================================= */
function monitorDatabase() {
    if (!window.database) {
        addLog(
            "error",
            "DATABASE",
            "window.database BELUM TERSEDIA"
        );
        return;
    }
    addLog(
        "db",
        "DATABASE READY",
        {
            supabase:
                !!window.database.supabase
        }
    );
    const methods = [
        "getUser",
        "getCurrentUser",
        "getProfile",
        "getCurrentProfile",
        "getLinks",
        "getSellOrders",
        "getReports",
        "getDashboardReport",
        "getCPMMarket",
        "getAnnouncements"
    ];
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
                    }
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
                        }
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
                        }
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
            "Database belum tersedia"
        );
        return;
    }
    try {
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
                    result.error
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
                    }
                );
            }
        }
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
            user
        );
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
            profile
        );
        if (profile) {
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
            }
        );
    }
}
/* =========================================================
   SELL ACCESS
========================================================= */
function checkSellAccess(
    profile
) {
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
        }
    );
    /* -----------------------------------------
       CHECK SELL CARD
    ----------------------------------------- */
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
                }
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
                        }
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
        "Memulai pemeriksaan ulang..."
    );
    await checkAuth();
    if (
        typeof
        window.checkSellStatus ===
        "function"
    ) {
        try {
            await window.checkSellStatus();
            addLog(
                "info",
                "CHECK SELL STATUS",
                "Function berhasil dijalankan"
            );
        }
        catch (error) {
            addLog(
                "error",
                "CHECK SELL STATUS ERROR",
                error
            );
        }
    }
    addLog(
        "info",
        "MANUAL CHECK",
        "Selesai"
    );
}
/* =========================================================
   CHECK BUTTON
========================================================= */
document.getElementById(
    "c2pRefresh"
).onclick =
    refreshCheck;
/* =========================================================
   GLOBAL C2P OBJECT
========================================================= */
window.c2p = {
    logs,
    stats,
    getProfile:
        () =>
            currentProfile,
    checkSell:
        () => {
            if (
                currentProfile
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
                storageSnapshot()
            );
        },
    clear:
        () => {
            document.getElementById(
                "c2pClear"
            ).click();
        }
};
/* =========================================================
   DOM READY
========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    function () {
        addLog(
            "info",
            "DOM READY",
            {
                url:
                    location.href,
                title:
                    document.title
            }
        );
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
            }
        );
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
                        }
                    );
                }
            );
        }
        catch (error) {
            addLog(
                "error",
                "AUTH STATE ERROR",
                error
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
            "4.0",
        url:
            location.href,
        usage:
            "Panel ini khusus monitoring Login, Dashboard dan Sell Link"
    }
);
})();
