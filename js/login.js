document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("loginForm");

if(!form) return;


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



const token=document
.querySelector('[name="cf-turnstile-response"]')
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


let email=login.toLowerCase();



// =========================
// CARI EMAIL DARI USERNAME
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

.limit(1)
.maybeSingle();



if(error)
throw error;



if(!user){

showAlert(
"❌ Username belum terdaftar."
);

return;

}


email=user.email.toLowerCase();


}



// =========================
// CEK EMAIL
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

.limit(1)
.maybeSingle();



if(error)
throw error;



if(!user){

showAlert(
"❌ Email belum terdaftar."
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

email:email,

password:password

});



if(authError){


let msg=
authError.message.toLowerCase();



if(
msg.includes("invalid login")
){

showAlert(
"❌ Username / Email atau password salah."
);

return;

}



if(
msg.includes("email not confirmed")
){

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

.limit(1)
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


let {

data:profile,

error:profileError

}=await database.supabase

.from("profiles")

.select("*")

.eq(
"id",
authData.user.id
)

.limit(1)
.maybeSingle();



if(profileError)
throw profileError;



// =========================
// JIKA PROFILE TIDAK ADA
// =========================


if(!profile){


const {
error:createError

}=await database.supabase

.from("profiles")

.insert({

id:authData.user.id,

username:userData.username,

full_name:userData.username,

balance:0,


ads_earning_today:0,
ads_earning_month:0,
ads_earning_total:0,


sell_earning_today:0,
sell_earning_month:0,
sell_earning_total:0,


total_views:0,
total_clicks:0,


withdraw_count:0,

sell_link_enabled:false,

status:"active"


});



if(createError){

console.error(
"CREATE PROFILE ERROR:",
createError
);


showAlert(
"❌ Gagal membuat profile. Hubungi admin."
);


return;


}



// ambil ulang profile


const {

data:newProfile

}=await database.supabase

.from("profiles")

.select("*")

.eq(
"id",
authData.user.id
)

.limit(1)
.maybeSingle();



profile=newProfile;


}



// =========================
// STATUS
// =========================


if(!profile){

showAlert(
"❌ Profile tidak ditemukan."
);

return;

}



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

updated_at:
new Date().toISOString()

})

.eq(
"id",
profile.id
);



// =========================
// STORAGE
// =========================


localStorage.setItem(
"user_id",
profile.id
);


localStorage.setItem(
"username",
profile.username
);



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


console.error(err);


showAlert(
"❌ "+(
err.message ||
"Terjadi kesalahan."
)
);


}


finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

}



});


});
