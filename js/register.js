console.log("REGISTER JS LOADED");
// =====================================================
// TOGGLE PASSWORD
// =====================================================
document
    .querySelectorAll(".toggle-password")
    .forEach(btn => {
        btn.addEventListener(
            "click",
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetId =
                    this.dataset.target;
                const input =
                    document.getElementById(
                        targetId
                    );
                const icon =
                    this.querySelector("i");
                if (!input) {
                    console.error(
                        "PASSWORD INPUT TIDAK DITEMUKAN:",
                        targetId
                    );
                    return;
                }
                if (!icon) {
                    console.error(
                        "ICON PASSWORD TIDAK DITEMUKAN"
                    );
                    return;
                }
                // =========================================
                // PASSWORD → TEXT
                // =========================================
                if (
                    input.type === "password"
                ) {
                    input.type = "text";
                    icon.classList.remove(
                        "fa-eye"
                    );
                    icon.classList.add(
                        "fa-eye-slash"
                    );
                    this.setAttribute(
                        "aria-label",
                        "Sembunyikan password"
                    );
                }
                // =========================================
                // TEXT → PASSWORD
                // =========================================
                else {
                    input.type = "password";
                    icon.classList.remove(
                        "fa-eye-slash"
                    );
                    icon.classList.add(
                        "fa-eye"
                    );
                    this.setAttribute(
                        "aria-label",
                        "Tampilkan password"
                    );
                }
            }
        );
    });
// =====================================================
// FLOATING REGISTER NOTIFICATION
// =====================================================
function showRegisterAlert(
    message,
    type = "error"
) {
    // =============================================
    // REMOVE OLD TOAST
    // =============================================
    const oldToast =
        document.querySelector(
            ".register-floating-toast"
        );
    if (oldToast) {
        oldToast.remove();
    }
    // =============================================
    // ICON
    // =============================================
    const icon =
        type === "success"
            ? "fa-circle-check"
            : "fa-circle-xmark";
    // =============================================
    // TITLE
    // =============================================
    const title =
        type === "success"
            ? "Berhasil"
            : "Peringatan";
    // =============================================
    // CREATE TOAST
    // =============================================
    const toast =
        document.createElement("div");
    toast.className =
        `register-floating-toast ${type}`;
    toast.innerHTML = `
        <div class="register-toast-icon">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="register-toast-content">
            <strong>
                ${title}
            </strong>
            <span>
                ${message}
            </span>
        </div>
        <button
            type="button"
            class="register-toast-close"
            aria-label="Tutup"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    // =============================================
    // ADD TO BODY
    // =============================================
    document.body.appendChild(
        toast
    );
    // =============================================
    // CLOSE BUTTON
    // =============================================
    const closeBtn =
        toast.querySelector(
            ".register-toast-close"
        );
    if (closeBtn) {
        closeBtn.addEventListener(
            "click",
            () => {
                toast.classList.add(
                    "hide"
                );
                setTimeout(() => {
                    if (
                        document.body.contains(
                            toast
                        )
                    ) {
                        toast.remove();
                    }
                }, 300);
            }
        );
    }
    // =============================================
    // AUTO HIDE
    // =============================================
    const duration =
        type === "success"
            ? 3000
            : 4000;
    setTimeout(() => {
        if (
            document.body.contains(
                toast
            )
        ) {
            toast.classList.add(
                "hide"
            );
            setTimeout(() => {
                if (
                    document.body.contains(
                        toast
                    )
                ) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}
// =====================================================
// FORM
// =====================================================
const form =
    document.getElementById(
        "registerForm"
    );
if (form) {
    const btn =
        document.getElementById(
            "registerBtn"
        );
    const username =
        document.getElementById(
            "username"
        );
    const email =
        document.getElementById(
            "email"
        );
    const password =
        document.getElementById(
            "password"
        );
    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );
    // =================================================
    // REGISTER
    // =================================================
    form.addEventListener(
        "submit",
        async e => {
            e.preventDefault();
            // =============================================
            // GET VALUE
            // =============================================
            const userName =
                username.value.trim();
            const userEmail =
                email.value
                    .trim()
                    .toLowerCase();
            const userPassword =
                password.value;
            const userConfirm =
                confirmPassword.value;
            // =============================================
            // VALIDASI USERNAME
            // =============================================
            if (!userName) {
                showRegisterAlert(
                    "❌ Username wajib diisi."
                );
                username.focus();
                return;
            }
            if (userName.length < 4) {
                showRegisterAlert(
                    "❌ Username minimal 4 karakter."
                );
                username.focus();
                return;
            }
            if (userName.length > 7) {
                showRegisterAlert(
                    "❌ Username maksimal 7 karakter."
                );
                username.focus();
                return;
            }
            if (
                !/^[a-zA-Z0-9_]+$/.test(
                    userName
                )
            ) {
                showRegisterAlert(
                    "❌ Username hanya boleh huruf, angka dan underscore."
                );
                username.focus();
                return;
            }
            // =============================================
            // VALIDASI EMAIL
            // =============================================
            if (!userEmail) {
                showRegisterAlert(
                    "❌ Email wajib diisi."
                );
                email.focus();
                return;
            }
            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(userEmail)
            ) {
                showRegisterAlert(
                    "❌ Format email tidak valid."
                );
                email.focus();
                return;
            }
            // =============================================
            // VALIDASI PASSWORD
            // =============================================
            if (
                userPassword.length < 6
            ) {
                showRegisterAlert(
                    "❌ Password minimal 6 karakter."
                );
                password.focus();
                return;
            }
            if (
                userPassword !==
                userConfirm
            ) {
                showRegisterAlert(
                    "❌ Konfirmasi password tidak sama."
                );
                confirmPassword.focus();
                return;
            }
            // =============================================
            // DATABASE CHECK
            // =============================================
            if (
                !window.database ||
                !database.supabase
            ) {
                showRegisterAlert(
                    "❌ Database belum siap."
                );
                return;
            }
            // =============================================
            // BUTTON LOADING
            // =============================================
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Mendaftar...</span>
                `;
            }
            try {
                // =========================================
                // CHECK USERNAME
                // =========================================
                const {
                    data: exist,
                    error: checkError
                } =
                    await database.supabase
                        .from("users")
                        .select("id")
                        .ilike(
                            "username",
                            userName
                        )
                        .maybeSingle();
                if (checkError) {
                    throw checkError;
                }
                if (exist) {
                    showRegisterAlert(
                        "❌ Username sudah digunakan."
                    );
                    username.focus();
                    return;
                }
                // =========================================
                // CREATE SUPABASE AUTH USER
                // =========================================
                const {
                    data: authData,
                    error: authError
                } =
                    await database.supabase
                        .auth
                        .signUp({
                            email:
                                userEmail,
                            password:
                                userPassword,
                            options: {
                                data: {
                                    username:
                                        userName
                                }
                            }
                        });
                if (authError) {
                    throw authError;
                }
                if (!authData?.user) {
                    throw new Error(
                        "Gagal membuat akun."
                    );
                }
                const authUserId =
                    authData.user.id;
                console.log(
                    "AUTH USER CREATED:",
                    authUserId
                );
                // =========================================
                // INSERT USERS
                // =========================================
                const {
                    data: newUser,
                    error: userError
                } =
                    await database.supabase
                        .from("users")
                        .insert({
                            id:
                                authUserId,
                            username:
                                userName,
                            email:
                                userEmail,
                            balance:
                                0,
                            is_admin:
                                false,
                            is_banned:
                                false
                        })
                        .select()
                        .single();
                if (userError) {
                    console.error(
                        "INSERT USERS ERROR:",
                        userError
                    );
                    throw userError;
                }
                console.log(
                    "USER PROFILE CREATED:",
                    newUser
                );
                // =========================================
                // SIGN OUT
                // =========================================
                await database.supabase
                    .auth
                    .signOut();
                // =========================================
                // SUCCESS
                // =========================================
                showRegisterAlert(
                    "📩 Registrasi berhasil. Silakan cek email untuk verifikasi akun.",
                    "success"
                );
                // =========================================
                // REDIRECT LOGIN
                // =========================================
                setTimeout(() => {
                    window.location.href =
                        "login.html";
                }, 3000);
            }
            catch (err) {
                console.error(
                    "REGISTER ERROR:",
                    err
                );
                let message =
                    err?.message ||
                    "Registrasi gagal.";
                // =========================================
                // DUPLICATE EMAIL
                // =========================================
                if (
                    message
                        .toLowerCase()
                        .includes(
                            "already registered"
                        )
                ) {
                    message =
                        "Email sudah terdaftar.";
                }
                showRegisterAlert(
                    "❌ " + message
                );
            }
            finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `
                        <i class="fa-solid fa-user-plus"></i>
                        <span>Daftar</span>
                    `;
                }
            }
        }
    );
}
