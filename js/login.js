document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    function showAlert(message, type = "error") {

        const box = document.getElementById("loginAlert");

        if (!box) {
            alert(message);
            return;
        }

        box.innerHTML = `<div class="alert-box alert-${type}">${message}</div>`;

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const login = document.getElementById("login").value.trim();
        const password = document.getElementById("password").value;

        const btn = document.getElementById("loginBtn");

        if (!login || !password) {

            showAlert("❌ Username/Gmail dan password wajib diisi.");
            return;

        }

        const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

        if (!token) {

            showAlert("❌ Silakan selesaikan verifikasi Cloudflare.");
            return;

        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

        try {

            let email = login;

            // =======================
            // LOGIN DENGAN USERNAME
            // =======================

            if (!login.includes("@")) {

                const { data: user, error } = await database.supabase
                    .from("users")
                    .select("email")
                    .eq("username", login)
                    .maybeSingle();

                if (error) throw error;

                if (!user) {

                    showAlert("❌ Username tidak ditemukan.");
                    return;

                }

                email = user.email;

            }

            // =======================
            // LOGIN AUTH
            // =======================

            const { data, error } = await database.supabase.auth.signInWithPassword({

                email,
                password

            });

            if (error) throw error;

            if (!data.user) {

                throw new Error("Login gagal.");

            }

            // =======================
            // USERS
            // =======================

            const { data: userData, error: userError } = await database.supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single();

            if (userError) throw userError;

            // =======================
            // PROFILE
            // =======================

            const { data: profile, error: profileError } = await database.supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

            if (profileError) throw profileError;

            // =======================
            // STATUS AKUN
            // =======================

            if (profile.status !== "active") {

                await database.supabase.auth.signOut();

                showAlert("🚫 Akun kamu tidak aktif.");

                return;

            }

            // =======================
            // LOCAL STORAGE
            // =======================

            localStorage.setItem("user_id", userData.id);
            localStorage.setItem("username", userData.username);

            // =======================
            // LOGIN BERHASIL
            // =======================

            showAlert(
                "✅ Login berhasil.",
                "success"
            );

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 1000);

        } catch (err) {

            console.error(err);

            showAlert(
                "❌ " + (err.message || "Terjadi kesalahan.")
            );

        } finally {

            btn.disabled = false;

            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

        }

    });

});
