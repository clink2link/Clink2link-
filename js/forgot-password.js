console.log("FORGOT PASSWORD JS LOADED");


const btn=document.getElementById("resetBtn");


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


const {error}=await supabase.auth
.resetPasswordForEmail(
email,
{

redirectTo:
window.location.origin+
"/reset-password.html"

}
);



if(error){

console.error(error);

alert(
"Gagal mengirim link reset: "+
error.message
);

return;

}



alert(
"Link reset password sudah dikirim ke email kamu."
);



}catch(err){


console.error(err);


alert(
"Terjadi kesalahan sistem"
);



}finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-key"></i> Kirim Link Reset';


}



});
