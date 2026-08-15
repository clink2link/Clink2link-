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
// SEND RESET EMAIL
// Supabase handles the account lookup securely.
// Do not query public.users as an anonymous visitor.
// ==========================

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

`${window.location.origin}/reset-password.html`

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
