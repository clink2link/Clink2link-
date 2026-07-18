document.getElementById("resetBtn").addEventListener("click", async () => {

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    if (!email) {
        alert("Masukkan email terlebih dahulu.");
        return;
    }

    try {

        const { error } = await database.supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    window.location.origin + "/reset-password.html"
            }
        );

        if (error) throw error;

        alert("✅ Link reset password berhasil dikirim ke email.");

    } catch (err) {

        console.error(err);

        alert("❌ " + err.message);

    }

});
