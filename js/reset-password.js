const params = new URLSearchParams(
window.location.search
);


const token = params.get("token");


if(!token){

alert("Token reset tidak ditemukan");

window.location.href="login.html";

}



document
.getElementById("resetForm")
.addEventListener("submit",async function(e){

e.preventDefault();



const password =
document.getElementById("password").value;


const confirmPassword =
document.getElementById("confirmPassword").value;



if(password.length < 6){

alert("Password minimal 6 karakter");

return;

}



if(password !== confirmPassword){

alert("Konfirmasi password tidak sama");

return;

}



try{


// cek token

const {data:reset,error:resetError}=await supabase
.from("password_resets")
.select("*")
.eq("token",token)
.single();



if(resetError || !reset){

alert("Token tidak valid");

return;

}



if(new Date(reset.expired_at) < new Date()){

alert("Token sudah expired");

return;

}




// update password

const {error:updateError}=await supabase
.from("users")
.update({

password:password,
updated_at:new Date()

})
.eq("id",reset.user_id);



if(updateError){

console.log(updateError);

alert("Gagal update password");

return;

}




// hapus token

await supabase
.from("password_resets")
.delete()
.eq("token",token);



alert(
"Password berhasil diganti. Silakan login."
);



window.location.href="login.html";



}catch(err){

console.log(err);

alert(
"Terjadi kesalahan sistem"
);

}


});



// toggle password

document
.querySelectorAll(".toggle-password")
.forEach(btn=>{


btn.onclick=function(){


const input =
document.getElementById(
this.dataset.target
);


const icon =
this.querySelector("i");



if(input.type==="password"){

input.type="text";

icon.className=
"fa-solid fa-eye-slash";


}else{


input.type="password";

icon.className=
"fa-solid fa-eye";


}


};


});
