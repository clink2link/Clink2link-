document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    if (!form) return;

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
        const btn = document.getElementById("loginBtn");

        if (!login || !password) {
            showAlert("❌ Username / Gmail dan Password wajib diisi.");
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

            let email = login;

            // ==========================
            // LOGIN VIA USERNAME
            // ==========================

            if (!login.includes("@")) {

                const { data: user, error } = await database.supabase
                    .from("users")
                    .select("id,email,username")
                    .eq("username", login)
                    .maybeSingle();

                if (error) throw error;

                if (!user) {

                    showAlert("❌ Username belum terdaftar.");
                    return;

                }

                email = user.email;

            } else {

                // ==========================
                // LOGIN VIA EMAIL
                // ==========================

                const { data: user, error } = await database.supabase
                    .from("users")
                    .select("id,email")
                    .eq("email", login)
                    .maybeSingle();

                if (error) throw error;

                if (!user) {

                    showAlert("❌ Email belum terdaftar.");
                    return;

                }

            }

            // ==========================
            // LOGIN AUTH
            // ==========================

            const { data, error } =
                await database.supabase.auth.signInWithPassword({

                    email,
                    password

                });

            if (error) {

                if (
                    error.message.toLowerCase().includes("invalid login credentials")
                ) {

                    showAlert("❌ Password yang kamu masukkan salah.");
                    return;

                }

                throw error;

            }

            if (!data.user) {

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
                .eq("id", data.user.id)
                .maybeSingle();

            if (userError) throw userError;

            if (!userData) {

                showAlert("❌ Data akun tidak ditemukan.");
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
                .eq("id", data.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {

                showAlert("❌ Profile pengguna belum dibuat.");
                return;

            }

            // ==========================
            // STATUS
            // ==========================

            if (profile.status !== "active") {

                await database.supabase.auth.signOut();

                showAlert("🚫 Akun kamu tidak aktif.");
                return;

            }

            // ==========================
            // UPDATE LOGIN
            // ==========================

            await database.supabase
                .from("profiles")
                .update({
                    updated_at: new Date().toISOString()
                })
                .eq("id", data.user.id);

            // ==========================
            // LOCAL STORAGE
            // ==========================

            localStorage.setItem("user_id", userData.id);
            localStorage.setItem("username", userData.username);

            // ==========================
            // SUCCESS
            // ==========================

            showAlert("✅ Login berhasil.", "success");

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 1000);

        } catch (err) {

            console.error(err);

            if (
                err.message &&
                err.message.includes("Email not confirmed")
            ) {

                showAlert("📩 Email belum diverifikasi. Silakan cek Inbox atau Spam.");

            } else {

                showAlert("❌ " + err.message);

            }

        } finally {

            btn.disabled = false;

            btn.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

        }

    });

});
