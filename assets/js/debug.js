/* =========================================================
   CLICK2PAY CONSOLE DEBUGGER
   File : assets/js/debug.js
   Version : 3.0
   Fokus :
   LOGIN ↔ DASHBOARD ↔ SELL LINK
========================================================= */
(function () {
"use strict";
/* =========================================================
   CONFIG
========================================================= */
const DEBUG_KEY = "debug111";
const params = new URLSearchParams(location.search);
if (params.get("debug") !== DEBUG_KEY) {
    return;
}
/* =========================================================
   CONFIG
========================================================= */
const PREFIX = "[CLICK2PAY DEBUG]";
const logs = [];
const stats = {
    info: 0,
    warn: 0,
    error: 0,
    db: 0,
    auth: 0,
    redirect: 0
};
/* =========================================================
   SAFE STRINGIFY
========================================================= */
function safeStringify(value) {
    try {
        if (value === undefined) {
            return "undefined";
        }
        if (value === null) {
            return "null";
        }
        if (typeof value === "string") {
            return value;
        }
        return JSON.stringify(
            value,
            null,
            2
        );
    } catch (error) {
        return String(value);
    }
}
/* =========================================================
   TIME
========================================================= */
function timestamp() {
    return new Date()
        .toLocaleTimeString(
            "id-ID",
            {
                hour12: false
            }
        );
}
/* =========================================================
   CORE LOGGER
========================================================= */
function addLog(
    type,
    title,
    data = null
) {
    const item = {
        time: timestamp(),
        type,
        title,
        data
    };
    logs.push(item);
    if (stats[type] !== undefined) {
        stats[type]++;
    }
    const prefix =
        `${PREFIX} ${title}`;
    if (type === "error") {
        console.error(
            prefix,
            data
        );
    }
    else if (type === "warn") {
        console.warn(
            prefix,
            data
        );
    }
    else if (type === "db") {
        console.log(
            "🗄️",
            prefix,
            data
        );
    }
    else if (type === "auth") {
        console.log(
            "🔐",
            prefix,
            data
        );
    }
    else if (type === "redirect") {
        console.log(
            "🔀",
            prefix,
            data
        );
    }
    else {
        console.log(
            prefix,
            data
        );
    }
}
/* =========================================================
   GLOBAL DEBUG
========================================================= */
window.c2pDebug = function (
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
   BASIC PAGE INFO
========================================================= */
addLog(
    "info",
    "DEBUG START",
    {
        url: location.href,
        pathname: location.pathname,
        search: location.search,
        referrer: document.referrer,
        online: navigator.onLine,
        time: new Date().toISOString()
    }
);
/* =========================================================
   LOCAL STORAGE SNAPSHOT
========================================================= */
function getStorageSnapshot() {
    const result = {};
    try {
        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {
            const key =
                localStorage.key(i);
            result[key] =
                localStorage.getItem(key);
        }
    } catch (error) {
        result.error =
            error.message;
    }
    return result;
}
addLog(
    "info",
    "LOCAL STORAGE SNAPSHOT",
    getStorageSnapshot()
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
            ),
        session:
            localStorage.getItem(
                "session_token"
            )
    }
);
/* =========================================================
   REDIRECT MONITOR
========================================================= */
(function monitorNavigation() {
    const originalAssign =
        window.location.assign;
    const originalReplace =
        window.location.replace;
    window.location.assign =
        function (url) {
            addLog(
                "redirect",
                "LOCATION.ASSIGN",
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
                "LOCATION.REPLACE",
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
    const originalPushState =
        history.pushState;
    history.pushState =
        function (
            state,
            title,
            url
        ) {
            addLog(
                "redirect",
                "HISTORY.PUSHSTATE",
                {
                    url
                }
            );
            return originalPushState.apply(
                history,
                arguments
            );
        };
    const originalReplaceState =
        history.replaceState;
    history.replaceState =
        function (
            state,
            title,
            url
        ) {
            addLog(
                "redirect",
                "HISTORY.REPLACESTATE",
                {
                    url
                }
            );
            return originalReplaceState.apply(
                history,
                arguments
            );
        };
})();
/* =========================================================
   PAGE HIDDEN / VISIBLE
========================================================= */
document.addEventListener(
    "visibilitychange",
    function () {
        addLog(
            "info",
            "PAGE VISIBILITY",
            document.hidden
                ? "HIDDEN"
                : "VISIBLE"
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
   UNHANDLED PROMISE
========================================================= */
window.addEventListener(
    "unhandledrejection",
    function (event) {
        addLog(
            "error",
            "UNHANDLED PROMISE",
            {
                reason:
                    event.reason,
                message:
                    event.reason?.message,
                stack:
                    event.reason?.stack
            }
        );
    }
);
/* =========================================================
   LOCAL STORAGE MONITOR
========================================================= */
(function monitorStorage() {
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
    Storage.prototype.removeItem =
        function (key) {
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
    Storage.prototype.clear =
        function () {
            addLog(
                "warn",
                "LOCAL STORAGE CLEAR",
                "SEMUA STORAGE DIHAPUS"
            );
            return originalClear.apply(
                this,
                arguments
            );
        };
})();
/* =========================================================
   FETCH MONITOR
========================================================= */
(function monitorFetch() {
    if (!window.fetch) {
        return;
    }
    const originalFetch =
        window.fetch;
    window.fetch =
        async function (...args) {
            const started =
                performance.now();
            const url =
                String(args[0]);
            const options =
                args[1] || {};
            const method =
                options.method || "GET";
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
                const duration =
                    (
                        performance.now()
                        -
                        started
                    ).toFixed(0);
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
                        statusText:
                            response.statusText,
                        duration:
                            duration + " ms"
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
                        error:
                            error.message,
                        stack:
                            error.stack
                    }
                );
                throw error;
            }
        };
})();
/* =========================================================
   DATABASE STATUS
========================================================= */
function checkDatabase() {
    addLog(
        window.database
            ? "db"
            : "error",
        "DATABASE STATUS",
        {
            exists:
                !!window.database,
            supabase:
                !!window.database?.supabase,
            methods:
                window.database
                    ? Object.keys(
                        window.database
                    ).filter(
                        key =>
                            typeof
                            window.database[key]
                            ===
                            "function"
                    )
                    : []
        }
    );
}
setTimeout(
    checkDatabase,
    1000
);
/* =========================================================
   DATABASE FUNCTION MONITOR
========================================================= */
function monitorDatabaseFunctions() {
    if (!window.database) {
        addLog(
            "warn",
            "DATABASE MONITOR",
            "window.database belum tersedia"
        );
        return;
    }
    const functions = [
        "getUser",
        "getCurrentUser",
        "getProfile",
        "getCurrentProfile",
        "getProfiles",
        "getLinks",
        "getSellOrders",
        "getReports",
        "getDashboardReport",
        "getCPMMarket",
        "getAnnouncements",
        "createSellOrder",
        "updateLink",
        "createLink",
        "deleteLink"
    ];
    functions.forEach(
        function (name) {
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
                            arguments:
                                args,
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
    addLog(
        "db",
        "DATABASE MONITOR",
        "Database function monitor aktif"
    );
}
setTimeout(
    monitorDatabaseFunctions,
    1800
);
/* =========================================================
   SUPABASE AUTH MONITOR
========================================================= */
async function monitorAuth() {
    const supabase =
        window.database?.supabase;
    if (!supabase) {
        addLog(
            "error",
            "SUPABASE AUTH",
            "Supabase client tidak tersedia"
        );
        return;
    }
    try {
        const {
            data,
            error
        } =
            await supabase.auth.getSession();
        if (error) {
            addLog(
                "error",
                "SUPABASE SESSION ERROR",
                error
            );
            return;
        }
        const session =
            data?.session;
        addLog(
            "auth",
            "SUPABASE SESSION",
            {
                exists:
                    !!session,
                user_id:
                    session?.user?.id ||
                    null,
                email:
                    session?.user?.email ||
                    null,
                expires_at:
                    session?.expires_at ||
                    null
            }
        );
    }
    catch (error) {
        addLog(
            "error",
            "SUPABASE AUTH FAILED",
            error
        );
    }
}
setTimeout(
    monitorAuth,
    1200
);
/* =========================================================
   CURRENT USER / PROFILE
========================================================= */
async function inspectCurrentUser() {
    if (!window.database) {
        return;
    }
    addLog(
        "auth",
        "CHECK CURRENT USER",
        "Mulai"
    );
    try {
        let user = null;
        let profile = null;
        if (
            typeof
            window.database.getUser
            ===
            "function"
        ) {
            user =
                await window.database.getUser();
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
            window.database.getProfile
            ===
            "function"
        ) {
            profile =
                await window.database.getProfile(
                    user.id
                );
        }
        if (
            !profile &&
            typeof
            window.database.getCurrentProfile
            ===
            "function"
        ) {
            profile =
                await window.database.getCurrentProfile();
        }
        addLog(
            profile
                ? "auth"
                : "warn",
            "CURRENT PROFILE",
            profile
        );
        if (profile) {
            inspectSellAccess(
                profile
            );
        }
    }
    catch (error) {
        addLog(
            "error",
            "USER PROFILE ERROR",
            {
                message:
                    error.message,
                stack:
                    error.stack
            }
        );
    }
}
setTimeout(
    inspectCurrentUser,
    2500
);
/* =========================================================
   SELL LINK ACCESS CHECK
========================================================= */
function inspectSellAccess(profile) {
    if (!profile) {
        addLog(
            "error",
            "SELL ACCESS",
            "PROFILE TIDAK ADA"
        );
        return;
    }
    const status =
        String(
            profile.status ||
            "active"
        ).toLowerCase();
    const sellLinkEnabled =
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
    const withdrawRequirement =
        withdrawCount >= 3;
    const enabled =
        sellLinkEnabled
        ||
        sellUnlocked
        ||
        withdrawRequirement;
    addLog(
        enabled
            ? "auth"
            : "warn",
        enabled
            ? "SELL LINK ACCESS: UNLOCKED"
            : "SELL LINK ACCESS: LOCKED",
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
                withdrawRequirement,
            FINAL_RESULT:
                enabled
                    ? "UNLOCKED"
                    : "LOCKED"
        }
    );
    /* -----------------------------------------
       DOM CHECK
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
                "SELL CARD DOM",
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
                            locked:
                                card.classList.contains(
                                    "locked"
                                ),
                            class:
                                card.className
                        }
                    );
                }
            );
        },
        500
    );
}
/* =========================================================
   SELL STATUS FUNCTION MONITOR
========================================================= */
setTimeout(
    function () {
        if (
            typeof
            window.checkSellStatus
            !==
            "function"
        ) {
            addLog(
                "warn",
                "CHECK SELL STATUS",
                "Function belum tersedia"
            );
            return;
        }
        addLog(
            "info",
            "CHECK SELL STATUS",
            "Function tersedia"
        );
    },
    3000
);
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
        const loginForm =
            document.getElementById(
                "loginForm"
            );
        if (loginForm) {
            addLog(
                "auth",
                "LOGIN FORM",
                "Ditemukan"
            );
        }
        const loginBtn =
            document.getElementById(
                "loginBtn"
            );
        if (loginBtn) {
            addLog(
                "auth",
                "LOGIN BUTTON",
                "Ditemukan"
            );
        }
    }
);
/* =========================================================
   LOGIN FORM MONITOR
========================================================= */
document.addEventListener(
    "submit",
    function (event) {
        const form =
            event.target;
        if (
            form?.id !==
            "loginForm"
        ) {
            return;
        }
        addLog(
            "auth",
            "LOGIN SUBMIT",
            {
                action:
                    form.action,
                method:
                    form.method,
                url:
                    location.href
            }
        );
    },
    true
);
/* =========================================================
   BUTTON CLICK MONITOR
========================================================= */
document.addEventListener(
    "click",
    function (event) {
        const target =
            event.target.closest(
                "button,a"
            );
        if (!target) {
            return;
        }
        const text =
            (
                target.innerText ||
                target.textContent ||
                ""
            )
            .trim()
            .substring(
                0,
                100
            );
        if (
            text.toLowerCase()
            .includes("sell")
            ||
            target.classList.contains(
                "sell-card"
            )
        ) {
            addLog(
                "info",
                "SELL CLICK",
                {
                    text,
                    id:
                        target.id ||
                        null,
                    class:
                        target.className ||
                        null
                }
            );
        }
        if (
            text.toLowerCase()
            .includes("login")
            ||
            target.id ===
                "loginBtn"
        ) {
            addLog(
                "auth",
                "LOGIN CLICK",
                {
                    text,
                    id:
                        target.id ||
                        null
                }
            );
        }
    },
    true
);
/* =========================================================
   STORAGE EVENT
========================================================= */
window.addEventListener(
    "storage",
    function (event) {
        addLog(
            "info",
            "STORAGE EVENT",
            {
                key:
                    event.key,
                oldValue:
                    event.oldValue,
                newValue:
                    event.newValue
            }
        );
    }
);
/* =========================================================
   SUPABASE AUTH STATE CHANGE
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
                        "SUPABASE AUTH STATE",
                        {
                            event,
                            user_id:
                                session
                                ?.user
                                ?.id ||
                                null,
                            email:
                                session
                                ?.user
                                ?.email ||
                                null,
                            session:
                                !!session
                        }
                    );
                }
            );
            addLog(
                "auth",
                "AUTH STATE MONITOR",
                "Aktif"
            );
        }
        catch (error) {
            addLog(
                "error",
                "AUTH STATE MONITOR ERROR",
                error
            );
        }
    },
    1500
);
/* =========================================================
   CONSOLE COMMANDS
========================================================= */
window.c2p = {
    logs,
    stats,
    storage() {
        console.table(
            getStorageSnapshot()
        );
    },
    async auth() {
        await monitorAuth();
    },
    async profile() {
        await inspectCurrentUser();
    },
    sell(profile) {
        if (!profile) {
            console.warn(
                "Gunakan c2p.sell(profile)"
            );
            return;
        }
        inspectSellAccess(
            profile
        );
    },
    page() {
        console.table({
            href:
                location.href,
            pathname:
                location.pathname,
            referrer:
                document.referrer,
            title:
                document.title
        });
    },
    clear() {
        logs.length = 0;
        console.clear();
        console.log(
            PREFIX,
            "LOG CLEARED"
        );
    },
    summary() {
        console.table(
            stats
        );
    }
};
/* =========================================================
   FINAL
========================================================= */
addLog(
    "info",
    "DEBUG READY",
    {
        version:
            "3.0",
        commands: [
            "c2p.storage()",
            "c2p.auth()",
            "c2p.profile()",
            "c2p.page()",
            "c2p.summary()",
            "c2p.clear()"
        ]
    }
);
console.log(
    "%c CLICK2PAY DEBUG MODE ",
    "background:#2563eb;color:white;padding:6px 10px;border-radius:6px;font-weight:bold;"
);
console.log(
    "Gunakan:",
    "c2p.profile()"
);
console.log(
    "Untuk cek Sell Link:",
    "c2p.sell(profile)"
);
})();
