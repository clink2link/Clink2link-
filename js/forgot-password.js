document
.getElementById("resetBtn")
.onclick = async()=>{


const email =
document.getElementById("email").value.trim();


if(!email){

alert("Masukkan email dulu");
return;

}


const {error}=await database.supabase.auth
.resetPasswordForEmail(
email,
{
redirectTo:
window.location.origin+
"/reset-password.html"
}
);


if(error){

alert(error.message);

}else{

alert(
"Link reset sudah dikirim ke email"
);

}


};
