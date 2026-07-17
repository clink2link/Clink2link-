// =========================
// PASSWORD TOGGLE
// =========================

document.querySelectorAll(".toggle-password")
.forEach(btn=>{

btn.onclick=function(){

const input=document.getElementById(
this.dataset.target
);

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

if(!box) return;

box.innerHTML=`

<div class="alert-box alert-${type}">
${message}
</div>

`;

}


// =========================
// FORM
// =========================

const form=document.getElementById("registerForm");

const btn=document.getElementById("registerBtn");

const username=document.getElementById("username");

const email=document.getElementById("email");

const password=document.getElementById("password");

const confirmPassword=document.getElementById("confirmPassword");



form.addEventListener("submit",async(e)=>{

e.preventDefault();


const userName=username.value.trim();

const userEmail=email.value.trim().toLowerCase();

const userPassword=password.value;

const userConfirm=confirmPassword.value;



// VALIDASI

if(userName.length<4){

showRegisterAlert(
"❌ Username minimal 4 karakter."
);

username.focus();
return;

}


if(userName.length>7){

showRegisterAlert(
"❌ Username maksimal 7 karakter."
);

username.focus();
return;

}


if(!/^[a-zA-Z0-9_]+$/.test(userName)){

showRegisterAlert(
"❌ Username hanya boleh huruf, angka dan underscore (_)."
);

username.focus();
return;

}


if(userPassword.length<6){

showRegisterAlert(
"❌ Password minimal 6 karakter."
);

password.focus();
return;

}


if(userPassword!==userConfirm){

showRegisterAlert(
"❌ Konfirmasi password tidak sama."
);

confirmPassword.focus();
return;

}



// TURNSTILE

const token=document.querySelector(
"[name='cf-turnstile-response']"
)?.value;


if(!token){

showRegisterAlert(
"❌ Silakan selesaikan verifikasi Cloudflare."
);

return;

}



btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';



try{


// CEK USERNAME

const {data:exists,error:checkError}=

await supabaseClient

.from("profiles")

.select("username")

.ilike(
"username",
userName
)

.maybeSingle();



if(checkError){

throw checkError;

}



if(exists){

showRegisterAlert(
"❌ Username sudah digunakan."
);

return;

}



// REGISTER AUTH

const {data,error}=

await supabaseClient.auth.signUp({

email:userEmail,

password:userPassword

});



if(error){

if(error.message.includes("already registered")){

showRegisterAlert(
"❌ Email sudah terdaftar."
);

return;

}

throw error;

}



const authUser=data.user;



if(!authUser){

throw new Error(
"Gagal membuat akun."
);

}



// CREATE PROFILE

const {error:profileError}=

await supabaseClient

.from("profiles")

.insert({

id:authUser.id,

username:userName,

full_name:"",

photo_url:"",

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



if(profileError){

throw profileError;

}



// SUCCESS

showRegisterAlert(
"✅ Pendaftaran berhasil. Mengalihkan ke login...",
"success"
);


setTimeout(()=>{

window.location.href="login.html";

},1500);



}catch(err){

console.error(
"REGISTER ERROR:",
err
);


showRegisterAlert(
"❌ "+err.message
);



}finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-user-plus"></i> <span>Daftar</span>';


}


});
