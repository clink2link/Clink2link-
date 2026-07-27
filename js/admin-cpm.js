async function updateCPM() {

    try {

        const { data, error } = await supabaseClient
            .from("cpm_rates")
            .select("*");

        if (error) throw error;

        if (!data?.length) return;

        for (const item of data) {

            const oldCpm = Number(item.cpm || 100);

            // Perubahan maksimal ±3%
            const maxMove = oldCpm * 0.03;
            const delta = (Math.random() * maxMove * 2) - maxMove;

            const newCpm = Math.max(
                100,
                Math.round(oldCpm + delta)
            );

            const percent = oldCpm > 0
                ? ((newCpm - oldCpm) / oldCpm) * 100
                : 0;

            // Riwayat grafik
            let history = Array.isArray(item.history)
                ? [...item.history]
                : [];

            history.push(newCpm);

            // Simpan 30 titik terakhir
            if (history.length > 30) {
                history = history.slice(-30);
            }

            // Trend bar
            let trend = Number(item.trend || 50);

            trend += (Math.random() * 8) - 4;

            trend = Math.max(10, Math.min(100, trend));

            const { error: updateError } = await supabaseClient
                .from("cpm_rates")
                .update({
                    cpm: newCpm,
                    change: Number(percent.toFixed(2)),
                    trend: Number(trend.toFixed(1)),
                    history,
                    updated_at: new Date().toISOString()
                })
                .eq("id", item.id);

            if (updateError) {
                console.error(updateError);
            }

        }

        console.log("✅ CPM berhasil diperbarui");

    } catch (err) {

        console.error("CPM ERROR:", err);

    }

}

// Update saat halaman dibuka
updateCPM();

// Update setiap 10 menit
setInterval(updateCPM, 600000);
