console.log("REGISTER JS LOADED");

// =========================
// PASSWORD TOGGLE
// =========================

document.querySelectorAll(".toggle-password").forEach(btn=>{

btn.onclick=function(){

const input=document.getElementById(this.dataset.target);
const icon=this.querySelector("i");

if(input.type==="password"){
input.type="text";
icon.className="fa-solid fa-eye-slash";
}else{
input.type="password";
icon.className="fa-solid fa-eye";
}

};

});

// =========================
// ALERT
// =========================

function showRegisterAlert(message,type="error"){

const box=document.getElementById("registerAlert");

if(!box){
alert(message);
return;
}

box.innerHTML=`<div class="alert-box alert-${type}">${message}</div>`;

}

// =========================
// FORM
// =========================

const form=document.getElementById("registerForm");

if(!form){
console.error("registerForm tidak ditemukan");
throw new Error("registerForm tidak ditemukan");
}

const btn=document.getElementById("registerBtn");
const username=document.getElementById("username");
const email=document.getElementById("email");
const password=document.getElementById("password");
const confirmPassword=document.getElementById("confirmPassword");

// =========================
// REGISTER
// =========================

form.addEventListener("submit",async(e)=>{

e.preventDefault();

console.log("SUBMIT BERJALAN");

const userName=username.value.trim();
const userEmail=email.value.trim().toLowerCase();
const userPassword=password.value;
const userConfirm=confirmPassword.value;

// VALIDASI

if(userName.length<4){
showRegisterAlert("❌ Username minimal 4 karakter.");
username.focus();
return;
}

if(userName.length>7){
showRegisterAlert("❌ Username maksimal 7 karakter.");
username.focus();
return;
}

if(!/^[a-zA-Z0-9_]+$/.test(userName)){
showRegisterAlert("❌ Username hanya boleh huruf, angka dan underscore (_).");
username.focus();
return;
}

if(userPassword.length<6){
showRegisterAlert("❌ Password minimal 6 karakter.");
password.focus();
return;
}

if(userPassword!==userConfirm){
showRegisterAlert("❌ Konfirmasi password tidak sama.");
confirmPassword.focus();
return;
}

// TURNSTILE

const token=document.querySelector("[name='cf-turnstile-response']")?.value;

if(!token){
showRegisterAlert("❌ Silakan selesaikan verifikasi Cloudflare.");
return;
}

btn.disabled=true;
btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';

try{

// DATABASE

if(!window.database || !database.supabase){
throw new Error("Database belum dimuat.");
}

// BCRYPT

if(typeof bcrypt==="undefined"){
throw new Error("Library bcrypt belum dimuat.");
}

// CEK USERNAME

const {data:userExists,error:userError}=await database.supabase
.from("users")
.select("id")
.eq("username",userName)
.maybeSingle();

if(userError) throw userError;

if(userExists){
showRegisterAlert("❌ Username sudah digunakan.");
return;
}

// CEK EMAIL

const {data:emailExists,error:emailError}=await database.supabase
.from("users")
.select("id")
.eq("email",userEmail)
.maybeSingle();

if(emailError) throw emailError;

if(emailExists){
showRegisterAlert("❌ Email sudah terdaftar.");
return;
}

// HASH PASSWORD

const hash=bcrypt.hashSync(userPassword,10);

// INSERT USER

const {error}=await database.supabase
.from("users")
.insert({

username:userName,
email:userEmail,
password:hash,

balance:0,
total_ads:0,
total_sell:0,
total_views:0,
total_clicks:0,

sell_unlocked:false,
withdraw_count:0,

is_admin:false,
is_banned:false,
email_verified:false

});

if(error) throw error;

// SUCCESS

showRegisterAlert(
"✅ Pendaftaran berhasil. Mengalihkan ke login...",
"success"
);

setTimeout(()=>{

window.location.href="login.html";

},1500);

}catch(err){

console.error("REGISTER ERROR:",err);

showRegisterAlert(
"❌ "+(err.message || "Terjadi kesalahan.")
);

}finally{

btn.disabled=false;

btn.innerHTML='<i class="fa-solid fa-user-plus"></i> <span>Daftar</span>';

}

});
