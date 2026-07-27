async function updateCPM() {

    try {

        const { data, error } = await supabaseClient
            .from("cpm_rates")
            .select("*");

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log("Tidak ada data CPM");
            return;
        }


        for (const item of data) {

            const oldCpm = Number(item.cpm || 100);


            // perubahan CPM ±3%
            const maxMove = oldCpm * 0.03;

            const delta =
                (Math.random() * maxMove * 2) - maxMove;


            const newCpm = Math.max(
                100,
                Math.round(oldCpm + delta)
            );


            // persen perubahan
            const percent = oldCpm > 0
                ? ((newCpm - oldCpm) / oldCpm) * 100
                : 0;



            // =========================
            // HISTORY GRAFIK
            // =========================

            let history = [];


            if (Array.isArray(item.history)) {

                history = [...item.history];

            }


            // isi data awal
            if(history.length === 0){

                history.push(oldCpm);

            }


            history.push(newCpm);


            // maksimal 30 titik
            if(history.length > 30){

                history = history.slice(-30);

            }



            // =========================
            // TREND BAR
            // =========================

            let trend = Number(item.trend || 50);


            trend += (Math.random() * 8) - 4;


            trend = Math.max(
                10,
                Math.min(100, trend)
            );



            const { error:updateError } =
            await supabaseClient
            .from("cpm_rates")
            .update({

                cpm:newCpm,

                change:Number(
                    percent.toFixed(2)
                ),

                trend:Number(
                    trend.toFixed(1)
                ),

                history:history,

                updated_at:
                new Date().toISOString()

            })
            .eq("id",item.id);



            if(updateError){

                console.error(
                    "UPDATE ERROR:",
                    updateError
                );

            }

        }


        console.log(
            "✅ CPM berhasil diperbarui"
        );


    } catch(err){

        console.error(
            "CPM ERROR:",
            err
        );

    }

}


// jalankan saat load
updateCPM();


// update 10 menit
setInterval(
    updateCPM,
    600000
);
