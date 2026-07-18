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

form.addEventListener("submit",async(e)=>{

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
// CEK USERNAME
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
data:auth,
error:authError

}=await database.supabase.auth.signInWithPassword({

email,

password

});



if(authError){


if(
authError.message
.toLowerCase()
.includes("invalid login")
){

showAlert(
"❌ Username / Email atau password salah."
);

return;

}



if(
authError.message
.includes("Email not confirmed")
){

showAlert(
"📩 Email belum diverifikasi."
);

return;

}



throw authError;


}



if(!auth.user){

showAlert(
"❌ Login gagal."
);

return;

}



// =========================
// AMBIL USERS
// =========================


const {
data:userData,
error:userError

}=await database.supabase

.from("users")

.select("*")

.eq(
"id",
auth.user.id
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


let {

data:profile,
error:profileError

}=await database.supabase

.from("profiles")

.select("*")

.eq(
"id",
auth.user.id
)

.maybeSingle();



if(profileError)
throw profileError;



// =========================
// BUAT PROFILE OTOMATIS
// =========================


if(!profile){


const {
data:newProfile,
error:createError

}=await database.supabase

.from("profiles")

.insert({

id:auth.user.id,

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


})

.select()

.maybeSingle();



if(createError)
throw createError;



profile=newProfile;


}



// =========================
// CEK STATUS
// =========================


if(
profile.status !== "active"
){


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



}catch(err){


console.error(err);


showAlert(
"❌ "+err.message
);



}finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

}



});


});
