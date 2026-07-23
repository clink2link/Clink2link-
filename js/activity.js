// =========================
// ACTIVITY TRACKING MODULE
// =========================

// 🚀 Ambil IP lebih awal (langsung jalan saat file load)
const ipPromise = getIPInfo();

// =========================
// MAIN TRACK FUNCTION
// =========================

async function trackLoginActivity(userId) {

  // ❌ cegah double insert
  if (!userId) return;

  if (sessionStorage.getItem("login_tracked") || window.__loginTracking) {
    return;
  }

  window.__loginTracking = true;

  try {

    // ambil hasil IP (yang sudah jalan dari awal)
    const ipData = await ipPromise;

    if (!window.database) {
      console.warn("Database belum siap");
      return;
    }

    await database.supabase
      .from("login_activity")
      .insert({
        user_id: userId,

        device: getDevice(),
        user_agent: navigator.userAgent,

        ip: ipData.ip,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country,
        org: ipData.org,

        latitude: ipData.lat,
        longitude: ipData.lon
      });

    // tandai sudah tracking
    sessionStorage.setItem("login_tracked", "true");

    console.log("✅ Login activity saved");

  } catch (e) {
    console.warn("⚠️ Activity tracking gagal:", e);
  }
}

// =========================
// DEVICE DETECT
// =========================

function getDevice() {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iPhone";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "Mac";

  return "Unknown Device";
}

// =========================
// GET IP INFO
// =========================

async function getIPInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      org: data.org,
      lat: data.latitude,
      lon: data.longitude
    };

  } catch (e) {
    return {
      ip: "Unknown",
      city: "-",
      region: "-",
      country: "-",
      org: "-",
      lat: null,
      lon: null
    };
  }
}
