document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("loginForm");

if(!form) return;


form.addEventListener("submit",async(e)=>{

e.preventDefault();


const login=document.getElementById("login").value.trim();

const password=document.getElementById("password").value.trim();

const btn=document.getElementById("loginBtn");



if(!login || !password){

alert("Username/email dan password wajib diisi");

return;

}



btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';



try{


/*
CEK CLOUDFLARE
*/

const token=
document.querySelector(
'[name="cf-turnstile-response"]'
)?.value;


if(!token){

alert("Silakan verifikasi terlebih dahulu");

btn.disabled=false;

btn.innerHTML=
'<i class="fa-solid fa-right-to-bracket"></i> <span>Masuk</span>';

return;

}



/*
AMBIL USER
*/

const {data,error}=await database.supabase
.from("users")
.select("*")
.or(
`username.eq.${login},email.eq.${login}`
)
.maybeSingle();


if(error || !data){

alert(
"❌ Username atau Gmail belum terdaftar. Silakan daftar terlebih dahulu."
);

return;

}



/*
CEK PASSWORD
*/

const passwordMatch =
await database.verifyPassword(
password,
data.password
);



if(!passwordMatch){

alert(
"❌ Password yang kamu masukkan salah."
);

return;

}



/*
CEK BAN
*/

if(data.is_banned){

alert(
"🚫 Akun kamu telah diblokir oleh admin."
);

return;

}



/*
SIMPAN SESSION
*/

localStorage.setItem(
"user_id",
data.id
);


localStorage.setItem(
"username",
data.username
);


localStorage.setItem(
"logged_in",
"true"
);



/*
UPDATE AKTIVITAS
*/

await database.supabase
.from("users")
.update({

updated_at:new Date()

})
.eq(
"id",
data.id
);



window.location.href="dashboard.html";



}catch(err){

console.error(
"LOGIN ERROR:",
err
);

alert(
"Terjadi kesalahan sistem"
);


}finally{

btn.disabled=false;

btn.innerHTML=
'<i class="fa-solid fa-right-to-bracket"></i> <span>Masuk</span>';

}


});


});
