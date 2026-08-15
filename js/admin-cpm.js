// Click2Pay CPM admin page.
// CPM changes must be made by a trusted server/admin action;
// this page only reads current values and never randomizes earnings.
async function loadCPM() {
    try {
        const { data, error } = await supabaseClient
            .from("cpm_rates")
            .select("*")
            .order("country");

        if (error) throw error;
        console.log("Current CPM rates:", data || []);
        return data || [];
    } catch (err) {
        console.error("CPM LOAD ERROR:", err);
        return [];
    }
}

loadCPM();
