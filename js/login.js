document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("loginForm");

if(!form)return;


const btn=document.getElementById("loginBtn");


function showAlert(message,type="error"){

const box=document.getElementById("loginAlert");

if(!box){

alert(message);
return;

}


box.innerHTML=`

<div class="alert-box alert-${type}">
${message}
</div>

`;

}



// =========================
// LOGIN
// =========================

form.addEventListener("submit",async e=>{


e.preventDefault();



const login=document
.getElementById("login")
.value
.trim();


const password=document
.getElementById("password")
.value;



if(!login || !password){

showAlert(
"❌ Username / Email dan password wajib diisi."
);

return;

}



if(!window.database){

showAlert(
"❌ Database belum dimuat."
);

console.error(
"database.js belum aktif"
);

return;

}



const token=document
.querySelector("[name='cf-turnstile-response']")
?.value;



if(!token){

showAlert(
"❌ Silakan selesaikan verifikasi Cloudflare."
);

return;

}



btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';



try{

  // 🚀 ambil IP dari awal (paralel, biar cepat)
  const ipPromise = getIPInfo();

let email=login.toLowerCase();



// =========================
// USERNAME LOGIN
// =========================


if(!login.includes("@")){


const {

data:user,
error

}=await database.supabase

.from("users")

.select("id,username,email")

.ilike(
"username",
login
)

.maybeSingle();



if(error)
throw error;



if(!user){

showAlert(
"❌ Username tidak ditemukan."
);

return;

}



email=user.email.toLowerCase();



}



// =========================
// EMAIL LOGIN
// =========================


else{


const {

data:user,
error

}=await database.supabase

.from("users")

.select("id,email")

.eq(
"email",
email
)

.maybeSingle();



if(error)
throw error;



if(!user){

showAlert(
"❌ Email tidak terdaftar."
);

return;

}


}



// =========================
// AUTH LOGIN
// =========================


const {

data:authData,

error:authError

}=await database.supabase.auth.signInWithPassword({

email,

password

});



if(authError){


const msg=
authError.message.toLowerCase();



if(msg.includes("invalid login")){

showAlert(
"❌ Username / Password salah."
);

return;

}



if(msg.includes("email not confirmed")){

showAlert(
"📩 Email belum diverifikasi."
);

return;

}


throw authError;


}



if(!authData.user){

showAlert(
"❌ Login gagal."
);

return;

}



// =========================
// AMBIL USER
// =========================


const {

data:userData,

error:userError

}=await database.supabase

.from("users")

.select("*")

.eq(
"id",
authData.user.id
)

.maybeSingle();



if(userError)
throw userError;



if(!userData){

showAlert(
"❌ Data user tidak ditemukan."
);

return;

}



// =========================
// AMBIL PROFILE
// =========================


const {

data:profile,

error:profileError

}=await database.supabase

.from("profiles")

.select("*")

.eq(
"id",
authData.user.id
)

.maybeSingle();



if(profileError)
throw profileError;



// PROFILE WAJIB ADA
// DIBUAT OLEH TRIGGER REGISTER


if(!profile){

showAlert(
"❌ Profile belum tersedia. Hubungi admin."
);

await database.supabase.auth.signOut();

return;

}



// =========================
// CEK STATUS
// =========================


if(profile.status!=="active"){


await database.supabase.auth.signOut();


showAlert(
"🚫 Akun tidak aktif."
);


return;


}



// =========================
// UPDATE LOGIN
// =========================

await database.supabase
.from("profiles")
.update({
  updated_at:new Date().toISOString()
})
.eq("id", profile.id);


// =========================
// SIMPAN LOGIN ACTIVITY 🔥
// =========================

if (!sessionStorage.getItem("login_tracked") && !window.__loginTracking) {

  window.__loginTracking = true;

  try {
    const ipData = await ipPromise;

    await database.supabase
      .from("login_activity")
      .insert({
        user_id: profile.id,
        device: getDevice(),
        user_agent: navigator.userAgent,
        ip: ipData.ip,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country,
        org: ipData.org,
        latitude: ipData.lat,
        longitude: ipData.lon
      });

    sessionStorage.setItem("login_tracked", "true");

  } catch (e) {
    console.warn("Login activity error:", e);
  }
}

// =========================
// LOCAL STORAGE
// =========================


localStorage.setItem("user_id", profile.id);
localStorage.setItem("username", profile.username);

console.log("LOGIN SAVE");
console.log("PROFILE ID:", profile.id);
console.log("LOCAL USER:", localStorage.getItem("user_id"));



// =========================
// SUCCESS
// =========================


showAlert(
"✅ Login berhasil.",
"success"
);



setTimeout(()=>{

window.location.href=
"dashboard.html";

},1000);



}

catch(err){


console.error(
"LOGIN ERROR:",
err
);



showAlert(
"❌ "+err.message
);



}


finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

}



});


});


function getDevice() {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iPhone";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "Mac";

  return "Unknown Device";
}

async function getIPInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      org: data.org,
      lat: data.latitude,
      lon: data.longitude
    };

  } catch (e) {
    return {
      ip: "Unknown",
      city: "-",
      region: "-",
      country: "-",
      org: "-",
      lat: null,
      lon: null
    };
  }
}
