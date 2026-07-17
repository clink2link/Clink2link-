document
.getElementById("forgotForm")
.addEventListener("submit", async function(e){

e.preventDefault();


const email =
document.getElementById("email").value
.trim()
.toLowerCase();


if(!email){

alert("Masukkan email terlebih dahulu");
return;

}


try{


const {data:user,error:userError}=await supabase
.from("users")
.select("id,email")
.eq("email",email)
.single();



if(userError || !user){

alert("Email tidak ditemukan");
return;

}



const token =
crypto.randomUUID();



const expired =
new Date(
Date.now()+30*60*1000
);



const {error}=await supabase
.from("password_resets")
.insert({

user_id:user.id,
token:token,
expired_at:expired

});



if(error){

console.log(error);

alert("Gagal membuat reset password");
return;

}



const resetLink =
window.location.origin+
"/reset-password.html?token="+token;



console.log(
"RESET LINK:",
resetLink
);



alert(
"Link reset berhasil dibuat. Cek console untuk link."
);



}catch(err){

console.log(err);

alert(
"Terjadi kesalahan sistem"
);

}


});
