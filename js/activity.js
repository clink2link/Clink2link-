// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", () => {
  loadLoginActivity();
});

// =========================
// LOAD DATA
// =========================

async function loadLoginActivity() {

  const list = document.getElementById("loginList");
  const totalEl = document.getElementById("totalLogin");
  const lastLoginEl = document.getElementById("lastLogin");
  const lastDeviceEl = document.getElementById("lastDevice");

  if (!list) return;

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    list.innerHTML = "❌ User tidak ditemukan.";
    return;
  }

  if (!window.database) {
    list.innerHTML = "❌ Database belum siap.";
    return;
  }

  try {

    const { data, error } = await database.supabase
      .from("login_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      list.innerHTML = "Belum ada aktivitas login.";
      return;
    }

    // =========================
    // STATISTIK
    // =========================

    totalEl.textContent = data.length;

    const last = data[0];

    lastLoginEl.textContent = formatDate(last.created_at);
    lastDeviceEl.textContent = last.device || "-";

    // =========================
    // RENDER LIST
    // =========================

    list.innerHTML = data.map(item => {

      return `
      <div class="activity-item">

        <div class="activity-left">
          <i class="fa-solid fa-laptop"></i>
        </div>

        <div class="activity-content">
          <div class="activity-top">
            <strong>${item.device || "Unknown Device"}</strong>
            <span>${formatDate(item.created_at)}</span>
          </div>

          <div class="activity-bottom">
            ${item.city || "-"}, ${item.country || "-"}
            <br>
            IP: ${item.ip || "-"}
          </div>
        </div>

      </div>
      `;

    }).join("");

  } catch (err) {

    console.error("LOAD ACTIVITY ERROR:", err);
    list.innerHTML = "❌ Gagal memuat data.";

  }

}

// =========================
// FORMAT DATE
// =========================

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// =========================
// TRACK LOGIN (TETAP ADA)
// =========================

const ipPromise = getIPInfo();

async function trackLoginActivity(userId) {

  if (!userId) return;

  if (sessionStorage.getItem("login_tracked") || window.__loginTracking) {
    return;
  }

  window.__loginTracking = true;

  try {

    const ipData = await ipPromise;

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

    sessionStorage.setItem("login_tracked", "true");

    console.log("✅ Login activity saved");

  } catch (e) {
    console.warn("⚠️ Activity tracking gagal:", e);
  }
}

// =========================
// DEVICE
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
// IP INFO
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
