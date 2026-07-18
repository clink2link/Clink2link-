console.log("FORGOT PASSWORD JS LOADED");


const btn=document.getElementById("resetBtn");


if(!btn){

console.error("resetBtn tidak ditemukan");

}



btn.addEventListener("click",async()=>{


const email=document
.getElementById("email")
.value
.trim()
.toLowerCase();



if(!email){

alert("Masukkan email terlebih dahulu");
return;

}



btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';



try{


if(!window.database){

throw new Error("Database belum dimuat");

}



const {error}=await database.supabase.auth.resetPasswordForEmail(

email,

{

redirectTo:
"https://click2pay.my.id/reset-password.html"

}

);



if(error){

console.error(
"RESET PASSWORD ERROR:",
error
);


alert(
"Gagal mengirim link reset:\n"+
error.message
);


return;

}



alert(
"✅ Link reset password sudah dikirim ke email kamu."
);



}catch(err){


console.error(
"SYSTEM ERROR:",
err
);


alert(
"Terjadi kesalahan sistem:\n"+
err.message
);



}finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-paper-plane"></i> <span>Kirim Link Reset</span>';


}



});
