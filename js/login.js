document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("loginForm");

if(!form) return;

function showAlert(message,type="error"){

const box=document.getElementById("loginAlert");

if(!box){
alert(message);
return;
}

box.innerHTML=
`<div class="alert-box alert-${type}">${message}</div>`;

}

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const login=document.getElementById("login").value.trim();
const password=document.getElementById("password").value;

const btn=document.getElementById("loginBtn");

if(!login || !password){

showAlert("❌ Username/Gmail dan password wajib diisi.");

return;

}

const token=document.querySelector('[name="cf-turnstile-response"]')?.value;

if(!token){

showAlert("❌ Silakan selesaikan verifikasi Cloudflare.");

return;

}

btn.disabled=true;

btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

try{

let email=login;

// =======================
// LOGIN PAKAI USERNAME
// =======================

if(!login.includes("@")){

const {data:user,error}=await database.supabase
.from("users")
.select("email")
.eq("username",login)
.maybeSingle();

if(error) throw error;

if(!user){

showAlert("❌ Username tidak ditemukan.");

return;

}

email=user.email;

}

// =======================
// LOGIN AUTH
// =======================

const {data,error}=await database.supabase.auth.signInWithPassword({

email:email,
password:password

});

if(error) throw error;

// =======================
// AMBIL DATA USER
// =======================

const {data:userData,error:userError}=await database.supabase
.from("users")
.select("*")
.eq("id",data.user.id)
.single();

if(userError) throw userError;

if(userData.is_banned){

await database.supabase.auth.signOut();

showAlert("🚫 Akun kamu telah diblokir.");

return;

}

// UPDATE TERAKHIR LOGIN

await database.supabase
.from("users")
.update({
updated_at:new Date().toISOString()
})
.eq("id",userData.id);

// LOCAL STORAGE (opsional)

localStorage.setItem("user_id",userData.id);
localStorage.setItem("username",userData.username);

showAlert(
"✅ Login berhasil.",
"success"
);

setTimeout(()=>{

window.location.href="dashboard.html";

},1000);

}catch(err){

console.error(err);

showAlert(
"❌ "+err.message
);

}finally{

btn.disabled=false;

btn.innerHTML='<i class="fa-solid fa-right-to-bracket"></i><span> Masuk</span>';

}

});

});
