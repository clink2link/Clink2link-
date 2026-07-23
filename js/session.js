const SESSION_TIMEOUT=30*60*1000;

let sessionTimer;

function resetSessionTimer(){

clearTimeout(sessionTimer);

sessionTimer=setTimeout(async()=>{

try{

if(window.database?.supabase){
await window.database.supabase.auth.signOut();
}

}catch(e){}

alert("Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.\nSilakan masuk kembali.");

location.replace("login.html");

},SESSION_TIMEOUT);

}

[
"click",
"keydown",
"mousemove",
"scroll",
"touchstart",
"touchmove"
].forEach(event=>{

document.addEventListener(event,resetSessionTimer,{
passive:true
});

});

document.addEventListener("visibilitychange",()=>{

if(!document.hidden){
resetSessionTimer();
}

});

window.addEventListener("focus",resetSessionTimer);

document.addEventListener("DOMContentLoaded",resetSessionTimer);


// =========================
// TRACK LOGIN ON SESSION
// =========================

document.addEventListener("DOMContentLoaded", async () => {

  try {

    if (!window.database?.supabase) return;

    const { data: { session } } =
      await window.database.supabase.auth.getSession();

    if (!session?.user) return;

    const userId = session.user.id;

    // 🚀 panggil tracking
    if (typeof trackLoginActivity === "function") {
      await trackLoginActivity(userId);
    } else {
      console.warn("trackLoginActivity tidak ditemukan");
    }

  } catch (err) {
    console.warn("Session tracking error:", err);
  }

});
