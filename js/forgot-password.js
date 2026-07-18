// js/forgot-password.js

console.log("FORGOT PASSWORD JS LOADED");


document.addEventListener("DOMContentLoaded",()=>{


const btn =
document.getElementById("resetBtn");


if(!btn){

console.error("resetBtn tidak ditemukan");
return;

}



btn.addEventListener("click",async()=>{


const email =
document.getElementById("email")
.value
.trim()
.toLowerCase();



if(!email){

alert(
"❌ Masukkan email terlebih dahulu."
);

return;

}



btn.disabled=true;


btn.innerHTML =
'<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';



try{


if(!window.database){

throw new Error(
"Database belum dimuat."
);

}



// ==========================
// CEK EMAIL USERS
// ==========================


const {
data:user,
error:userError

}=await database.supabase
.from("users")
.select("id,email")
.eq("email",email)
.maybeSingle();



if(userError){

throw userError;

}



if(!user){


alert(
"❌ Email belum terdaftar."
);


return;


}



// ==========================
// KIRIM RESET EMAIL
// ==========================


const {
error

}=await database.supabase.auth
.resetPasswordForEmail(

email,

{

redirectTo:

"https://click2pay.my.id/reset-password.html"

}

);



if(error){

throw error;

}



alert(
"✅ Link reset password sudah dikirim ke Gmail."
);



}catch(err){


console.error(
"RESET PASSWORD ERROR:",
err
);


alert(
"❌ "+err.message
);



}finally{


btn.disabled=false;


btn.innerHTML =
'<i class="fa-solid fa-paper-plane"></i> <span>Kirim Link Reset</span>';



}


});


});
