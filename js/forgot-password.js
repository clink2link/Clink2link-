document
.getElementById("resetBtn")
.addEventListener("click", async function(){

const email =
document.getElementById("email")
.value
.trim()
.toLowerCase();


if(!email){

alert("Masukkan email terlebih dahulu");
return;

}


try{


const {
data:user,
error:userError
}=await supabase
.from("users")
.select("id,email,username")
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
Date.now()+60*60*1000
);



const {
error
}=await supabase
.from("password_resets")
.insert({

user_id:user.id,
token:token,
expired_at:expired

});



if(error){

console.log(error);

alert(
"Gagal membuat reset password"
);

return;

}



const resetLink =
window.location.origin+
"/reset-password.html?token="+token;



const sent =
await sendResetEmail(
email,
user.username,
resetLink
);



if(!sent){

alert(
"Gagal mengirim email"
);

return;

}



alert(
"Link reset password sudah dikirim ke email kamu."
);



}catch(err){

console.log(err);

alert(
"Terjadi kesalahan sistem"
);

}


});
