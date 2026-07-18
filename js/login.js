document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    if (!form) return;

    const btn = document.getElementById("loginBtn");

    function showAlert(message, type = "error") {

        const box = document.getElementById("loginAlert");

        if (!box) {
            alert(message);
            return;
        }

        box.innerHTML = `
            <div class="alert-box alert-${type}">
                ${message}
            </div>
        `;

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const login = document.getElementById("login").value.trim();
        const password = document.getElementById("password").value;

        if (!login || !password) {
            showAlert("❌ Username / Email dan Password wajib diisi.");
            return;
        }

        const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

        if (!token) {
            showAlert("❌ Silakan selesaikan verifikasi Cloudflare.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

        try {

            let email = login.trim().toLowerCase();

            // ==========================
            // LOGIN VIA USERNAME
            // ==========================

            if (!login.includes("@")) {

                const { data: user, error } = await database.supabase
                    .from("users")
                    .select("id,username,email")
                    .ilike("username", login)
                    .maybeSingle();

                if (error) throw error;

                if (!user) {
                    showAlert("❌ Username belum terdaftar.");
                    return;
                }

                email = user.email.trim().toLowerCase();

                console.log("Username :", user.username);
                console.log("Email    :", email);

            } else {

                const { data: user, error } = await database.supabase
                    .from("users")
                    .select("id,email")
                    .eq("email", email)
                    .maybeSingle();

                if (error) throw error;

                if (!user) {
                    showAlert("❌ Email belum terdaftar.");
                    return;
                }

            }

            console.log("Login Email :", email);

            // ==========================
            // LOGIN AUTH
            // ==========================

            const {
                data: authData,
                error: authError
            } = await database.supabase.auth.signInWithPassword({

                email: email,
                password: password

            });

            if (authError) {

                if (authError.message.includes("Invalid login credentials")) {
                    showAlert("❌ Username / Email atau Password salah.");
                    return;
                }

                if (authError.message.includes("Email not confirmed")) {
                    showAlert("📩 Email belum diverifikasi.");
                    return;
                }

                throw authError;

            }

            if (!authData.user) {
                showAlert("❌ Login gagal.");
                return;
            }

            // ==========================
            // USERS
            // ==========================

            const {
                data: userData,
                error: userError
            } = await database.supabase
                .from("users")
                .select("*")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (userError) throw userError;

            if (!userData) {
                showAlert("❌ Data user tidak ditemukan.");
                return;
            }

            // ==========================
            // PROFILE
            // ==========================

            const {
                data: profile,
                error: profileError
            } = await database.supabase
                .from("profiles")
                .select("*")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                showAlert("❌ Profile belum dibuat.");
                return;
            }

            if (profile.status !== "active") {

                await database.supabase.auth.signOut();

                showAlert("🚫 Akun tidak aktif.");
                return;

            }

            // ==========================
            // UPDATE LAST LOGIN
            // ==========================

            await database.supabase
                .from("profiles")
                .update({
                    updated_at: new Date().toISOString()
                })
                .eq("id", profile.id);

            // ==========================
            // LOCAL STORAGE
            // ==========================

            localStorage.setItem("user_id", profile.id);
            localStorage.setItem("username", profile.username);

            showAlert("✅ Login berhasil.", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

        } catch (err) {

            console.error(err);

            showAlert("❌ " + (err.message || "Terjadi kesalahan."));

        } finally {

            btn.disabled = false;

            btn.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

        }

    });

});
