document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("loginForm");
if(!form) return;


const btn = document.getElementById("loginBtn");


// =========================
// ALERT FORM
// =========================

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
// FLOAT TOAST
// =========================

function showToast(title,message,type="success"){

const toast=document.createElement("div");

toast.className=`login-toast ${type}`;

toast.innerHTML=`

<i class="fa-solid ${
type==="success"
?"fa-circle-check"
:"fa-circle-xmark"
}"></i>

<div>
<h4>${title}</h4>
<p>${message}</p>
</div>

`;

document.body.appendChild(toast);


setTimeout(()=>{

toast.classList.add("hide");

setTimeout(()=>{
toast.remove();
},300);


},1500);

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



if(!window.database){

showAlert(
"❌ Database belum dimuat."
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

btn.innerHTML=`
<i class="fa-solid fa-spinner fa-spin"></i>
Memproses...
`;



try{


let email=login.toLowerCase();



// =========================
// USERNAME LOGIN
// =========================

if(!login.includes("@")){


const {data:user,error}=await database.supabase
.from("users")
.select("id,username,email")
.ilike("username",login)
.maybeSingle();



if(error) throw error;


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


const {data:user,error}=await database.supabase
.from("users")
.select("id,email")
.eq("email",email)
.maybeSingle();



if(error) throw error;


if(!user){

showAlert(
"❌ Email tidak terdaftar."
);

return;

}


}



// =========================
// AUTH
// =========================

const {
data:authData,
error:authError

}=await database.supabase.auth
.signInWithPassword({

email,
password

});



if(authError){


const msg=authError.message.toLowerCase();


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
// PROFILE / USER
// =========================
const {
    data: profile,
    error: profileError
} = await database.supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();
if (profileError) {
    console.error(
        "GET USER PROFILE ERROR:",
        profileError
    );
    throw profileError;
}
if (!profile) {
    console.error(
        "USER TIDAK DITEMUKAN:",
        authData.user.id
    );
    showAlert(
        "❌ Data akun tidak ditemukan."
    );
    await database.supabase.auth.signOut();
    return;
}



if(profileError) throw profileError;



if(!profile){

showAlert(
"❌ Profile belum tersedia."
);

await database.supabase.auth.signOut();

return;

}



// =========================
// STATUS
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
.eq("id",profile.id);




// =========================
// TRACK
// =========================

if(typeof trackLoginActivity==="function"){

await trackLoginActivity(profile.id);

}




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
// SUCCESS TOAST
// =========================

showToast(
"Login Berhasil",
`Selamat datang kembali, ${profile.username}`
);



setTimeout(()=>{

window.location.href="dashboard.html";

},1500);



}

catch(err){

console.error(
"LOGIN ERROR:",
err
);


showToast(
"Login Gagal",
err.message,
"error"
);


}

finally{


if(btn){

btn.disabled=false;

btn.innerHTML=
`
<i class="fa-solid fa-right-to-bracket"></i>
<span>Masuk</span>
`;

}


}


});


});
