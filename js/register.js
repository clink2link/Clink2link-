console.log("REGISTER JS LOADED");

// =========================
// PASSWORD TOGGLE
// =========================

document.querySelectorAll(".toggle-password").forEach(btn => {

    btn.onclick = function () {

        const input = document.getElementById(this.dataset.target);
        const icon = this.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.className = "fa-solid fa-eye-slash";
        } else {
            input.type = "password";
            icon.className = "fa-solid fa-eye";
        }

    };

});

// =========================
// ALERT
// =========================

function showRegisterAlert(message, type = "error") {

    const box = document.getElementById("registerAlert");

    if (!box) {
        alert(message);
        return;
    }

    box.innerHTML = `<div class="alert-box alert-${type}">${message}</div>`;

}

// =========================
// FORM
// =========================

const form = document.getElementById("registerForm");
const btn = document.getElementById("registerBtn");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

// =========================
// REGISTER
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const userName = username.value.trim();
    const userEmail = email.value.trim().toLowerCase();
    const userPassword = password.value;
    const userConfirm = confirmPassword.value;

    if (userName.length < 4) {
        showRegisterAlert("❌ Username minimal 4 karakter.");
        return;
    }

    if (userName.length > 7) {
        showRegisterAlert("❌ Username maksimal 7 karakter.");
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
        showRegisterAlert("❌ Username hanya boleh huruf, angka dan underscore (_).");
        return;
    }

    if (userPassword.length < 6) {
        showRegisterAlert("❌ Password minimal 6 karakter.");
        return;
    }

    if (userPassword !== userConfirm) {
        showRegisterAlert("❌ Konfirmasi password tidak sama.");
        return;
    }

    const token = document.querySelector("[name='cf-turnstile-response']")?.value;

    if (!token) {
        showRegisterAlert("❌ Silakan selesaikan verifikasi Cloudflare.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';

    try {

        // =====================
        // CEK USERNAME
        // =====================

        const { data: usernameExists, error: checkError } = await database.supabase
            .from("users")
            .select("id")
            .eq("username", userName)
            .maybeSingle();

        if (checkError) throw checkError;

        if (usernameExists) {
            showRegisterAlert("❌ Username sudah digunakan.");
            return;
        }

        // =====================
        // REGISTER AUTH
        // =====================

        const { data, error } = await database.supabase.auth.signUp({
            email: userEmail,
            password: userPassword
        });

        if (error) throw error;

        const authUser = data.user;

        if (!authUser) {
            throw new Error("Gagal membuat akun.");
        }

        // =====================
        // INSERT USERS
        // =====================

        const { error: userError } = await database.supabase
            .from("users")
            .insert({
                id: authUser.id,
                username: userName,
                email: userEmail
            });

        if (userError) throw userError;

        // =====================
        // INSERT PROFILES
        // =====================

        const { error: profileError } = await database.supabase
            .from("profiles")
            .insert({

                id: authUser.id,

                username: userName,
                full_name: userName,
                photo_url: null,

                balance: 0,

                ads_earning_today: 0,
                ads_earning_month: 0,
                ads_earning_total: 0,

                sell_earning_today: 0,
                sell_earning_month: 0,
                sell_earning_total: 0,

                total_views: 0,
                total_clicks: 0,

                withdraw_count: 0,
                sell_link_enabled: false,

                status: "active"

            });

        if (profileError) throw profileError;

        showRegisterAlert(
            "✅ Registrasi berhasil. Silakan cek email untuk verifikasi.",
            "success"
        );

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (err) {

        console.error(err);

        showRegisterAlert(
            "❌ " + (err.message || "Terjadi kesalahan.")
        );

    } finally {

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i><span> Daftar</span>';

    }

});
