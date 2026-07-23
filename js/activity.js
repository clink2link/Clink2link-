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
  const loginList = document.getElementById("loginList");

  try {
    // ambil user login sekarang
    const user = await database.getUser();

    if (!user) {
      loginList.innerHTML = "User belum login";
      return;
    }

    // ambil data dari supabase
    const { data, error } = await database.client
      .from("login_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      loginList.innerHTML = "Belum ada aktivitas login";
      return;
    }

    // =========================
    // RENDER LIST
    // =========================

    loginList.innerHTML = data.map(item => `
      <div class="login-item">
        <div class="login-left">
          <div class="login-device">${item.device || "Unknown Device"}</div>
          <div class="login-time">${formatDate(item.created_at)}</div>
        </div>
        <i class="fa-solid fa-check" style="color:lime;"></i>
      </div>
    `).join("");

    // =========================
    // STATISTIK
    // =========================

    document.getElementById("totalLogin").innerText = data.length;

    const last = data[0];
    document.getElementById("lastLogin").innerText = formatShortDate(last.created_at);
    document.getElementById("lastDevice").innerText = last.device || "-";

  } catch (err) {
    console.error(err);
    loginList.innerHTML = "Gagal load data";
  }
}


// =========================
// FORMAT TANGGAL
// =========================

function formatDate(date) {
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short"
  });
}
