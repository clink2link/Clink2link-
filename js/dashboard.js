//======================================================
// CLICK2PAY DASHBOARD
// DATABASE VERSION
//======================================================

let adsChartInstance = null;
let sellChartInstance = null;
let marketChartInstance = null;
let marketData = [];

//======================================================
// HELPERS
//======================================================

function formatRupiah(value) {
    return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("id-ID");
}

function getJakartaDate(dateValue = new Date()) {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

function getJakartaMonth(dateValue = new Date()) {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return null;
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit"
    }).formatToParts(date);

    const year = parts.find(
        item => item.type === "year"
    )?.value;

    const month = parts.find(
        item => item.type === "month"
    )?.value;

    return `${year}-${month}`;
}

function isSameJakartaDay(dateValue) {
    if (!dateValue) {
        return false;
    }

    const date = getJakartaDate(dateValue);
    const today = getJakartaDate(new Date());

    return date && today && date === today;
}

function isSameJakartaMonth(dateValue) {
    if (!dateValue) {
        return false;
    }

    const dateMonth = getJakartaMonth(dateValue);
    const currentMonth = getJakartaMonth(new Date());

    return (
        dateMonth &&
        currentMonth &&
        dateMonth === currentMonth
    );
}

function isPaidStatus(status) {
    return [
        "paid",
        "success",
        "completed",
        "settled"
    ].includes(
        String(status || "").toLowerCase()
    );
}

function getDateTimestamp(dateValue) {
    if (!dateValue) {
        return 0;
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return 0;
    }

    return date.getTime();
}

//======================================================
// CHART OPTIONS
//======================================================

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
        mode: "index",
        intersect: false
    },

    plugins: {
        legend: {
            display: false
        },

        tooltip: {
            backgroundColor: "#0f172a",
            padding: 12,

            callbacks: {
                label(context) {
                    const value =
                        Number(
                            context.parsed?.y || 0
                        );

                    if (
                        context.dataset.label ===
                            "Pendapatan" ||
                        context.dataset.label ===
                            "Sell Earnings"
                    ) {
                        return (
                            "Rp " +
                            value.toLocaleString(
                                "id-ID"
                            )
                        );
                    }

                    return value.toLocaleString(
                        "id-ID"
                    );
                }
            }
        }
    },

    scales: {
        x: {
            grid: {
                display: false
            }
        },

        y: {
            beginAtZero: true,

            ticks: {
                callback(value) {
                    return Number(
                        value
                    ).toLocaleString("id-ID");
                }
            }
        }
    }
};

//======================================================
// LOAD DASHBOARD
//======================================================

async function loadDashboard() {

    try {

        //==================================================
        // PROFILE
        //==================================================

        const profile =
            await database.getCurrentProfile();

        if (!profile) {

            console.error(
                "DASHBOARD: USER TIDAK TERDETEKSI"
            );

            return;
        }

        const authId = profile.id;

        console.log(
            "================================"
        );

        console.log(
            "CLICK2PAY DASHBOARD"
        );

        console.log(
            "PROFILE:",
            profile
        );

        console.log(
            "USER ID:",
            authId
        );

        console.log(
            "================================"
        );

        //==================================================
        // COUNTRY
        //==================================================

        window.currentUserCountry =
            profile.country || "Indonesia";

        const countryNotice =
            document.getElementById(
                "countryNotice"
            );

        if (countryNotice) {

            countryNotice.textContent =
                `Data CPM berdasarkan negara ${window.currentUserCountry}`;

        }

        //==================================================
        // ELEMENT
        //==================================================

        const adsToday =
            document.getElementById("adsToday");

        const adsMonth =
            document.getElementById("adsMonth");

        const adsViewsMonth =
            document.getElementById("adsViewsMonth");

        const sellToday =
            document.getElementById("sellToday");

        const sellMonth =
            document.getElementById("sellMonth");

        const todayDate =
            document.getElementById("todayDate");

        const todayDateSell =
            document.getElementById("todayDateSell");

        const adsMonthSelect =
            document.getElementById("adsMonthSelect");

        const sellMonthSelect =
            document.getElementById("sellMonthSelect");

        //==================================================
        // DATE DISPLAY
        //==================================================

        const now = new Date();

        const dateText =
            now.toLocaleString(
                "id-ID",
                {
                    timeZone: "Asia/Jakarta",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        if (todayDate) {
            todayDate.textContent =
                dateText;
        }

        if (todayDateSell) {
            todayDateSell.textContent =
                dateText;
        }

        const monthText =
            now.toLocaleString(
                "id-ID",
                {
                    timeZone: "Asia/Jakarta",
                    month: "long",
                    year: "numeric"
                }
            );

        if (adsMonthSelect) {
            adsMonthSelect.innerHTML =
                `<option>${monthText}</option>`;
        }

        if (sellMonthSelect) {
            sellMonthSelect.innerHTML =
                `<option>${monthText}</option>`;
        }

        //==================================================
        // ADS PROFILE SUMMARY
        //==================================================

        if (adsToday) {
            adsToday.textContent =
                formatRupiah(
                    profile.ads_earning_today
                );
        }

        if (adsMonth) {
            adsMonth.textContent =
                formatRupiah(
                    profile.ads_earning_month
                );
        }

        //==================================================
        // LOAD LINKS
        //==================================================

        const links =
            await database.getLinks(authId) || [];

        //==================================================
        // LOAD SELL ORDERS
        //==================================================

        const sellOrders =
            await database.getSellOrders(authId) || [];

        console.log(
            "LINKS:",
            links
        );

        console.log(
            "SELL ORDERS:",
            sellOrders
        );

        //==================================================
        // VARIABLES
        //==================================================

        let adsViews = 0;
        let adsClicks = 0;

        let totalSellLinks = 0;
        let totalSellViews = 0;
        let totalSellClicks = 0;

        let totalSold = 0;

        let sellTodayEarn = 0;
        let sellMonthEarn = 0;
        let sellTotalEarn = 0;

        //==================================================
        // PROCESS LINKS
        //==================================================

        for (const link of links) {

            const type =
                String(
                    link.type ??
                    link.link_type ??
                    ""
                ).toLowerCase();

            const views =
                Number(
                    link.total_views ??
                    link.views ??
                    0
                );

            const clicks =
                Number(
                    link.total_clicks ??
                    link.clicks ??
                    0
                );

            //==============================================
            // ADS
            //==============================================

            if (type === "ads") {

                adsViews += views;
                adsClicks += clicks;

            }

            //==============================================
            // SELL
            //==============================================

            if (
                type === "sell" ||
                type === "sell_link"
            ) {

                totalSellLinks++;

                totalSellViews += views;

                totalSellClicks += clicks;

            }
        }

        //==================================================
        // PROCESS SELL ORDERS
        //==================================================

        for (const order of sellOrders) {

            const quantity =
                Number(
                    order.quantity ?? 1
                );

            const receive =
                Number(
                    order.seller_receive ?? 0
                );

            const status =
                String(
                    order.status ?? ""
                ).toLowerCase();

            //==============================================
            // ONLY PAID
            //==============================================

            if (!isPaidStatus(status)) {
                continue;
            }

            //==============================================
            // TOTAL SOLD
            //==============================================

            totalSold += quantity;

            sellTotalEarn += receive;

            //==============================================
            // PAYMENT DATE
            //==============================================

            const paidDate =
                order.paid_at ||
                order.created_at;

            if (!paidDate) {
                continue;
            }

            //==============================================
            // TODAY
            //==============================================

            if (
                isSameJakartaDay(
                    paidDate
                )
            ) {

                sellTodayEarn +=
                    receive;

            }

            //==============================================
            // MONTH
            //==============================================

            if (
                isSameJakartaMonth(
                    paidDate
                )
            ) {

                sellMonthEarn +=
                    receive;

            }
        }

        //==================================================
        // DISPLAY ADS
        //==================================================

        const adsViewsEl =
            document.getElementById(
                "adsViews"
            );

        const adsClicksEl =
            document.getElementById(
                "adsClicks"
            );

        if (adsViewsEl) {
            adsViewsEl.textContent =
                formatNumber(
                    adsViews
                );
        }

        if (adsClicksEl) {
            adsClicksEl.textContent =
                formatNumber(
                    adsClicks
                );
        }

        if (adsViewsMonth) {
            adsViewsMonth.textContent =
                formatNumber(
                    adsViews
                );
        }

        //==================================================
        // DISPLAY SELL
        //==================================================

        const sellViewsEl =
            document.getElementById(
                "sellViews"
            );

        const sellClicksEl =
            document.getElementById(
                "sellClicks"
            );

        const sellTotalLink =
            document.getElementById(
                "sellTotalLink"
            );

        const sellTotalSold =
            document.getElementById(
                "sellTotalSold"
            );

        if (sellViewsEl) {

            sellViewsEl.textContent =
                formatNumber(
                    totalSellViews
                );

        }

        if (sellClicksEl) {

            sellClicksEl.textContent =
                formatNumber(
                    totalSellClicks
                );

        }

        if (sellTotalLink) {

            sellTotalLink.textContent =
                formatNumber(
                    totalSellLinks
                );

        }

        if (sellTotalSold) {

            sellTotalSold.textContent =
                formatNumber(
                    totalSold
                );

        }

        if (sellToday) {

            sellToday.textContent =
                formatRupiah(
                    sellTodayEarn
                );

        }

        if (sellMonth) {

            sellMonth.textContent =
                formatRupiah(
                    sellMonthEarn
                );

        }

        //==================================================
        // CURRENT ADS CPM
        //==================================================

        const currentCpm =
            document.getElementById(
                "currentCpm"
            );

        if (currentCpm) {

            const totalAdsEarn =
                Number(
                    profile.ads_earning_total ??
                    0
                );

            const cpm =
                adsViews > 0
                    ? Math.round(
                        (
                            totalAdsEarn *
                            1000
                        ) /
                        adsViews
                    )
                    : 0;

            currentCpm.textContent =
                formatRupiah(
                    cpm
                );
        }

        //==================================================
        // DAILY REPORT
        //==================================================

        let reports = [];

        try {

            const existingReports =
                await database.getReports(
                    authId
                ) || [];

            if (
                Array.isArray(
                    existingReports
                )
            ) {

                reports =
                    existingReports.slice();

            }

        } catch (reportError) {

            console.error(
                "GET DAILY REPORTS ERROR:",
                reportError
            );

            reports = [];

        }

        //==================================================
        // TODAY JAKARTA
        //==================================================

        const todayJakarta =
            getJakartaDate(
                new Date()
            );

        //==================================================
        // CURRENT ADS DATA
        //==================================================

        let currentAdsViews = 0;
        let currentAdsClicks = 0;

        for (const link of links) {

            const type =
                String(
                    link.type ??
                    link.link_type ??
                    ""
                ).toLowerCase();

            if (type !== "ads") {
                continue;
            }

            currentAdsViews +=
                Number(
                    link.total_views ??
                    link.views ??
                    0
                );

            currentAdsClicks +=
                Number(
                    link.total_clicks ??
                    link.clicks ??
                    0
                );
        }

        //==================================================
        // CURRENT ADS EARNING TODAY
        //==================================================

        const currentAdsEarning =
            Number(
                profile.ads_earning_today ??
                0
            );

        //==================================================
        // CURRENT SELL DATA
        //==================================================

        let currentSellViews = 0;
        let currentSellClicks = 0;

        for (const link of links) {

            const type =
                String(
                    link.type ??
                    link.link_type ??
                    ""
                ).toLowerCase();

            if (
                type !== "sell" &&
                type !== "sell_link"
            ) {
                continue;
            }

            currentSellViews +=
                Number(
                    link.total_views ??
                    link.views ??
                    0
                );

            currentSellClicks +=
                Number(
                    link.total_clicks ??
                    link.clicks ??
                    0
                );
        }

        //==================================================
        // CURRENT SELL EARNING TODAY
        //==================================================

        let currentSellEarning = 0;

        for (
            const order
            of sellOrders
        ) {

            const status =
                String(
                    order.status ??
                    ""
                ).toLowerCase();

            if (!isPaidStatus(status)) {
                continue;
            }

            const receive =
                Number(
                    order.seller_receive ??
                    0
                );

            const paidDate =
                order.paid_at ??
                order.created_at ??
                null;

            if (!paidDate) {
                continue;
            }

            if (
                isSameJakartaDay(
                    paidDate
                )
            ) {

                currentSellEarning +=
                    receive;

            }
        }

        //==================================================
        // CURRENT REPORT
        //==================================================

        const currentReport = {

            id:
                `current-${todayJakarta}`,

            user_id:
                authId,

            // IMPORTANT:
            // gunakan tanggal ISO valid
            report_date:
                todayJakarta,

            ads_views:
                currentAdsViews,

            ads_clicks:
                currentAdsClicks,

            ads_earnings:
                currentAdsEarning,

            sell_views:
                currentSellViews,

            sell_clicks:
                currentSellClicks,

            sell_earnings:
                currentSellEarning
        };

        //==================================================
        // FIND TODAY REPORT
        //==================================================

        const todayReportIndex =
            reports.findIndex(
                row => {

                    if (
                        !row ||
                        !row.report_date
                    ) {
                        return false;
                    }

                    return (
                        getJakartaDate(
                            row.report_date
                        ) ===
                        todayJakarta
                    );
                }
            );

        //==================================================
        // CREATE / UPDATE TODAY
        //==================================================

        if (
            todayReportIndex >= 0
        ) {

            reports[
                todayReportIndex
            ] = {

                ...reports[
                    todayReportIndex
                ],

                report_date:
                    todayJakarta,

                ads_views:
                    currentAdsViews,

                ads_clicks:
                    currentAdsClicks,

                ads_earnings:
                    currentAdsEarning,

                sell_views:
                    currentSellViews,

                sell_clicks:
                    currentSellClicks,

                sell_earnings:
                    currentSellEarning
            };

        } else {

            reports.push(
                currentReport
            );

        }

        //==================================================
        // NORMALIZE REPORT
        //==================================================

        reports =
            reports
                .filter(
                    row =>
                        row &&
                        row.report_date &&
                        getJakartaDate(
                            row.report_date
                        )
                )
                .map(
                    row => {

                        return {

                            ...row,

                            report_date:
                                getJakartaDate(
                                    row.report_date
                                ),

                            ads_views:
                                Number(
                                    row.ads_views ??
                                    0
                                ),

                            ads_clicks:
                                Number(
                                    row.ads_clicks ??
                                    0
                                ),

                            ads_earnings:
                                Number(
                                    row.ads_earnings ??
                                    0
                                ),

                            sell_views:
                                Number(
                                    row.sell_views ??
                                    0
                                ),

                            sell_clicks:
                                Number(
                                    row.sell_clicks ??
                                    0
                                ),

                            sell_earnings:
                                Number(
                                    row.sell_earnings ??
                                    0
                                )
                        };
                    }
                );

        //==================================================
        // REMOVE DUPLICATE DATE
        //==================================================

        const uniqueReports =
            new Map();

        for (
            const row
            of reports
        ) {

            const dateKey =
                getJakartaDate(
                    row.report_date
                );

            if (!dateKey) {
                continue;
            }

            // Current report harus menang
            // karena merupakan data terbaru

            if (
                dateKey ===
                todayJakarta
            ) {

                uniqueReports.set(
                    dateKey,
                    row
                );

                continue;
            }

            if (
                !uniqueReports.has(
                    dateKey
                )
            ) {

                uniqueReports.set(
                    dateKey,
                    row
                );

            }
        }

        reports =
            Array.from(
                uniqueReports.values()
            );

        //==================================================
        // SORT TERBARU → TERLAMA
        //==================================================

        reports.sort(
            (a, b) => {

                return (
                    getDateTimestamp(
                        b.report_date
                    ) -
                    getDateTimestamp(
                        a.report_date
                    )
                );

            }
        );

        //==================================================
        // DEBUG REPORT
        //==================================================

        console.log(
            "================================"
        );

        console.log(
            "FINAL DAILY REPORT"
        );

        console.log(
            "TODAY:",
            todayJakarta
        );

        console.log(
            "TOTAL REPORT:",
            reports.length
        );

        console.table(
            reports
        );

        console.log(
            "CURRENT TODAY DATA:",
            currentReport
        );

        console.log(
            "================================"
        );

        //==================================================
        // LAST 7 DAYS
        //==================================================

        const chartData =
            reports
                .slice()
                .sort(
                    (a, b) =>
                        getDateTimestamp(
                            a.report_date
                        ) -
                        getDateTimestamp(
                            b.report_date
                        )
                )
                .slice(-7);

        let labels = [];
        let earnings = [];
        let sellEarnings = [];

        //==================================================
        // CHART DATA
        //==================================================

        if (chartData.length) {

            labels =
                chartData.map(
                    row => {

                        return new Date(
                            row.report_date +
                            "T00:00:00+07:00"
                        ).toLocaleDateString(
                            "id-ID",
                            {
                                timeZone:
                                    "Asia/Jakarta",
                                day:
                                    "2-digit",
                                month:
                                    "short"
                            }
                        );

                    }
                );

            earnings =
                chartData.map(
                    row =>
                        Number(
                            row.ads_earnings ??
                            0
                        )
                );

            sellEarnings =
                chartData.map(
                    row =>
                        Number(
                            row.sell_earnings ??
                            0
                        )
                );

        } else {

            for (
                let i = 6;
                i >= 0;
                i--
            ) {

                const date =
                    new Date();

                date.setDate(
                    date.getDate() - i
                );

                labels.push(
                    date.toLocaleDateString(
                        "id-ID",
                        {
                            timeZone:
                                "Asia/Jakarta",
                            day:
                                "2-digit",
                            month:
                                "short"
                        }
                    )
                );

                earnings.push(0);
                sellEarnings.push(0);
            }
        }

        //==================================================
        // ADS CHART
        //==================================================

        const adsCanvas =
            document.getElementById(
                "adsChart"
            );

        if (adsCanvas) {

            if (adsChartInstance) {

                adsChartInstance.destroy();

                adsChartInstance =
                    null;
            }

            adsChartInstance =
                new Chart(
                    adsCanvas,
                    {

                        type:
                            "line",

                        data: {

                            labels,

                            datasets: [

                                {

                                    label:
                                        "Pendapatan",

                                    data:
                                        earnings,

                                    borderColor:
                                        "#2563eb",

                                    backgroundColor:
                                        "rgba(37,99,235,.12)",

                                    borderWidth:
                                        3,

                                    fill:
                                        true,

                                    tension:
                                        0.45,

                                    pointRadius:
                                        4,

                                    pointHoverRadius:
                                        7
                                }

                            ]
                        },

                        options:
                            commonOptions
                    }
                );
        }

        //==================================================
        // SELL CHART
        //==================================================

        const sellCanvas =
            document.getElementById(
                "sellChart"
            );

        if (sellCanvas) {

            if (sellChartInstance) {

                sellChartInstance.destroy();

                sellChartInstance =
                    null;
            }

            sellChartInstance =
                new Chart(
                    sellCanvas,
                    {

                        type:
                            "line",

                        data: {

                            labels,

                            datasets: [

                                {

                                    label:
                                        "Sell Earnings",

                                    data:
                                        sellEarnings,

                                    borderColor:
                                        "#8b5cf6",

                                    backgroundColor:
                                        "rgba(139,92,246,.12)",

                                    borderWidth:
                                        3,

                                    fill:
                                        true,

                                    tension:
                                        0.45,

                                    pointRadius:
                                        4,

                                    pointHoverRadius:
                                        7
                                }

                            ]
                        },

                        options:
                            commonOptions
                    }
                );
        }

        //==================================================
        // LAST REPORT
        //==================================================

        const lastReport =
            reports.length
                ? reports[0]
                : null;

        //==================================================
        // ADS CPM
        //==================================================

        const adsCpm =
            document.getElementById(
                "adsCpm"
            );

        if (adsCpm) {

            const views =
                Number(
                    lastReport?.ads_views ??
                    0
                );

            const earning =
                Number(
                    lastReport?.ads_earnings ??
                    0
                );

            const cpm =
                views > 0
                    ? Math.round(
                        (
                            earning *
                            1000
                        ) /
                        views
                    )
                    : 0;

            adsCpm.textContent =
                formatRupiah(
                    cpm
                );
        }

        //==================================================
        // SELL CPM
        //==================================================

        const sellCpm =
            document.getElementById(
                "sellCpm"
            );

        if (sellCpm) {

            const views =
                Number(
                    lastReport?.sell_views ??
                    0
                );

            const earning =
                Number(
                    lastReport?.sell_earnings ??
                    0
                );

            const cpm =
                views > 0
                    ? Math.round(
                        (
                            earning *
                            1000
                        ) /
                        views
                    )
                    : 0;

            sellCpm.textContent =
                formatRupiah(
                    cpm
                );
        }

        //==================================================
        // ADS DETAIL REPORT TABLE
        //==================================================

        const reportTable =
            document.getElementById(
                "reportTable"
            );

        if (reportTable) {

            if (reports.length) {

                reportTable.innerHTML =
                    reports.map(
                        row => {

                            const views =
                                Number(
                                    row.ads_views ??
                                    0
                                );

                            const clicks =
                                Number(
                                    row.ads_clicks ??
                                    0
                                );

                            const earning =
                                Number(
                                    row.ads_earnings ??
                                    0
                                );

                            const cpm =
                                views > 0
                                    ? Math.round(
                                        (
                                            earning *
                                            1000
                                        ) /
                                        views
                                    )
                                    : 0;

                            const date =
                                row.report_date
                                    ? new Date(
                                        row.report_date +
                                        "T00:00:00+07:00"
                                    ).toLocaleDateString(
                                        "id-ID",
                                        {
                                            timeZone:
                                                "Asia/Jakarta",
                                            day:
                                                "2-digit",
                                            month:
                                                "short",
                                            year:
                                                "numeric"
                                        }
                                    )
                                    : "-";

                            return `

<tr>

    <td>
        ${date}
    </td>

    <td>
        ${views.toLocaleString("id-ID")}
    </td>

    <td>
        ${clicks.toLocaleString("id-ID")}
    </td>

    <td class="earning">
        Rp ${earning.toLocaleString("id-ID")}
    </td>

    <td>
        Rp ${cpm.toLocaleString("id-ID")}
    </td>

</tr>

`;

                        }
                    ).join("");

            } else {

                reportTable.innerHTML = `

<tr>

    <td colspan="5">
        Belum ada data report ADS.
    </td>

</tr>

`;

            }
        }

        //==================================================
        // SELL DETAIL REPORT TABLE
        //==================================================

        const sellReportTable =
            document.getElementById(
                "sellReportTable"
            );

        if (sellReportTable) {

            if (reports.length) {

                sellReportTable.innerHTML =
                    reports.map(
                        row => {

                            const views =
                                Number(
                                    row.sell_views ??
                                    0
                                );

                            const clicks =
                                Number(
                                    row.sell_clicks ??
                                    0
                                );

                            const earning =
                                Number(
                                    row.sell_earnings ??
                                    0
                                );

                            const cpm =
                                views > 0
                                    ? Math.round(
                                        (
                                            earning *
                                            1000
                                        ) /
                                        views
                                    )
                                    : 0;

                            const date =
                                row.report_date
                                    ? new Date(
                                        row.report_date +
                                        "T00:00:00+07:00"
                                    ).toLocaleDateString(
                                        "id-ID",
                                        {
                                            timeZone:
                                                "Asia/Jakarta",
                                            day:
                                                "2-digit",
                                            month:
                                                "short",
                                            year:
                                                "numeric"
                                        }
                                    )
                                    : "-";

                            return `

<tr>

    <td>
        ${date}
    </td>

    <td>
        ${views.toLocaleString("id-ID")}
    </td>

    <td>
        ${clicks.toLocaleString("id-ID")}
    </td>

    <td class="earning">
        Rp ${earning.toLocaleString("id-ID")}
    </td>

    <td>
        Rp ${cpm.toLocaleString("id-ID")}
    </td>

</tr>

`;

                        }
                    ).join("");

            } else {

                sellReportTable.innerHTML = `

<tr>

    <td colspan="5">
        Belum ada laporan SELL.
    </td>

</tr>

`;

            }
        }

        //==================================================
        // CPM MARKET
        //==================================================

        const marketList =
            document.getElementById(
                "cpmMarketList"
            );

        const market =
            await database.getCPMMarket();

        marketData =
            Array.isArray(market)
                ? market
                : [];

        if (marketList) {

            if (marketData.length) {

                marketList.innerHTML =
                    marketData.map(
                        item => {

                            const trend =
                                Math.min(
                                    Math.max(
                                        Number(
                                            item.trend ??
                                            50
                                        ),
                                        0
                                    ),
                                    100
                                );

                            const change =
                                Number(
                                    item.change ??
                                    0
                                );

                            return `

<div
    class="market-row"
    onclick="selectCountry(${item.id})"
>

    <div class="flag">
        ${item.flag || "🌍"}
    </div>

    <div>

        <div class="country">
            ${item.country || "-"}
        </div>

        <div class="spark">

            <span
                style="width:${trend}%"
            ></span>

        </div>

    </div>

    <div class="market-price">

        <b>
            Rp ${Number(
                item.cpm || 0
            ).toLocaleString("id-ID")}
        </b>

        <div class="market-change ${
            change >= 0
                ? "up"
                : "down"
        }">

            ${change >= 0 ? "▲" : "▼"}

            ${Math.abs(
                change
            ).toFixed(2)}%

        </div>

    </div>

</div>

`;

                        }
                    ).join("");

                selectCountry(
                    marketData[0].id
                );

            } else {

                marketList.innerHTML =
                    "Belum ada data CPM.";

            }
        }

        //==================================================
        // ANNOUNCEMENT
        //==================================================

        const news =
            await database.getAnnouncements();

        const announcementBox =
            document.getElementById(
                "announcementBox"
            );

        if (announcementBox) {

            if (
                Array.isArray(news) &&
                news.length
            ) {

                announcementBox.innerHTML =
                    news.map(
                        item => `

<div class="announcement-item">

    <b>
        ${item.title || "Pengumuman"}
    </b>

    <p>
        ${item.content || ""}
    </p>

</div>

`
                    ).join("");

            } else {

                announcementBox.innerHTML =
                    "Belum ada pengumuman.";

            }
        }

        //==================================================
        // REPORT READY
        //==================================================

        console.log(
            "================================"
        );

        console.log(
            "DETAIL REPORT HARIAN READY"
        );

        console.log(
            "REPORT COUNT:",
            reports.length
        );

        console.log(
            "ADS TABLE:",
            !!reportTable
        );

        console.log(
            "SELL TABLE:",
            !!sellReportTable
        );

        console.log(
            "================================"
        );

    } catch (error) {

        console.group(
            "🚨 Dashboard Error"
        );

        console.error(
            error
        );

        console.log(
            "Message:",
            error?.message
        );

        console.log(
            "Stack:",
            error?.stack
        );

        console.groupEnd();

    }
}

//======================================================
// AUTO THEME
//======================================================

function getJakartaHour() {

    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    "Asia/Jakarta",
                hour:
                    "2-digit",
                hour12:
                    false
            }
        ).formatToParts(
            new Date()
        );

    return Number(
        parts.find(
            item =>
                item.type === "hour"
        )?.value || 0
    );
}

function autoTheme() {

    const theme =
        localStorage.getItem(
            "theme"
        );

    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        return;
    }

    if (theme === "light") {

        document.body.classList.remove(
            "dark"
        );

        return;
    }

    const hour =
        getJakartaHour();

    if (
        hour >= 18 ||
        hour < 6
    ) {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );

    }
}

autoTheme();

setInterval(
    autoTheme,
    60000
);

//======================================================
// DOM LOAD
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        while (
            !window.database
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

        }

        await loadDashboard();

        await checkSellStatus();

        const params =
            new URLSearchParams(
                location.search
            );

        if (
            params.get("tab") ===
            "statistics"
        ) {

            setTimeout(
                () => {

                    const section =
                        document.getElementById(
                            "statistics"
                        );

                    if (section) {

                        section.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }

                },
                700
            );
        }

    }
);

//======================================================
// MARKET DETAIL
//======================================================

function selectCountry(id) {

    const item =
        marketData.find(
            x => x.id == id
        );

    if (!item) {
        return;
    }

    const history =
        Array.isArray(
            item.history
        )
            ? item.history
            : [];

    const country =
        document.getElementById(
            "marketCountry"
        );

    const price =
        document.getElementById(
            "marketPrice"
        );

    const change =
        document.getElementById(
            "marketChange"
        );

    if (country) {

        country.textContent =
            item.country || "-";

    }

    if (price) {

        price.textContent =
            formatRupiah(
                item.cpm
            );

    }

    if (change) {

        const changeValue =
            Number(
                item.change || 0
            );

        change.textContent =
            (
                changeValue >= 0
                    ? "▲ "
                    : "▼ "
            ) +
            Math.abs(
                changeValue
            ).toFixed(2) +
            "%";

        change.classList.toggle(
            "up",
            changeValue >= 0
        );

        change.classList.toggle(
            "down",
            changeValue < 0
        );
    }

    const canvas =
        document.getElementById(
            "marketChart"
        );

    if (!canvas) {
        return;
    }

    const chartLabels =
        history.map(
            (_, index) =>
                index + 1
        );

    const chartValues =
        history.map(
            value =>
                Number(
                    value || 0
                )
        );

    //==================================================
    // CREATE CHART
    //==================================================

    if (!marketChartInstance) {

        marketChartInstance =
            new Chart(
                canvas,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [

                            {

                                data:
                                    chartValues,

                                borderColor:
                                    "#2563eb",

                                backgroundColor:
                                    "rgba(37,99,235,.12)",

                                fill:
                                    true,

                                tension:
                                    0.4,

                                pointRadius:
                                    0
                            }

                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {
                                display:
                                    false
                            }

                        },

                        scales: {

                            x: {
                                display:
                                    false
                            },

                            y: {
                                display:
                                    false
                            }

                        }
                    }
                }
            );

    } else {

        marketChartInstance
            .data
            .labels =
            chartLabels;

        marketChartInstance
            .data
            .datasets[0]
            .data =
            chartValues;

        marketChartInstance.update();

    }
}

//======================================================
// TOGGLE GUIDE
//======================================================

function toggleGuide() {

    const content =
        document.getElementById(
            "guideContent"
        );

    const arrow =
        document.getElementById(
            "guideArrow"
        );

    if (content) {

        content.classList.toggle(
            "show"
        );

    }

    if (arrow) {

        arrow.classList.toggle(
            "active"
        );

    }
}

//======================================================
// TOGGLE MARKET
//======================================================

function toggleMarket() {

    const content =
        document.getElementById(
            "marketContent"
        );

    const arrow =
        document.getElementById(
            "marketArrow"
        );

    if (content) {

        content.classList.toggle(
            "show"
        );

    }

    if (arrow) {

        arrow.classList.toggle(
            "active"
        );

    }
}

//======================================================
// CHECK SELL STATUS
// PREMIUM USER = SELL LINK UNLOCK
//======================================================

async function checkSellStatus() {

    try {

        //==================================================
        // PROFILE
        //==================================================

        const profile =
            await database.getCurrentProfile();

        if (!profile) {
            return;
        }

        //==================================================
        // PREMIUM
        //==================================================

        let premiumActive =
            profile.is_premium === true;

        //==================================================
        // PREMIUM EXPIRATION
        //==================================================

        if (
            premiumActive &&
            profile.premium_expires_at
        ) {

            const expires =
                new Date(
                    profile.premium_expires_at
                );

            if (
                isNaN(
                    expires.getTime()
                ) ||
                expires <= new Date()
            ) {

                premiumActive =
                    false;

            }
        }

        //==================================================
        // SELL ACCESS
        //==================================================

        const enabled =
            premiumActive ||
            profile.sell_link_enabled === true ||
            profile.sell_unlocked === true ||
            Number(
                profile.withdraw_count || 0
            ) >= 3;

        //==================================================
        // APPLY LOCK
        //==================================================

        document
            .querySelectorAll(
                ".sell-card"
            )
            .forEach(
                card => {

                    card.classList.toggle(
                        "locked",
                        !enabled
                    );

                }
            );

        //==================================================
        // DEBUG
        //==================================================

        console.log(
            "================================"
        );

        console.log(
            "SELL ACCESS"
        );

        console.log({

            username:
                profile.username,

            is_premium:
                profile.is_premium,

            premium_expires_at:
                profile.premium_expires_at,

            premiumActive,

            sell_link_enabled:
                profile.sell_link_enabled,

            sell_unlocked:
                profile.sell_unlocked,

            withdraw_count:
                profile.withdraw_count,

            enabled

        });

        console.log(
            "================================"
        );

    } catch (error) {

        console.error(
            "CHECK SELL ERROR:",
            error
        );

    }
}
