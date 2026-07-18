document.addEventListener("DOMContentLoaded", async () => {

const form = document.getElementById("resetForm");

form.addEventListener("submit", async (e) => {

e.preventDefault();

const password = document.getElementById("password").value.trim();
const confirmPassword = document.getElementById("confirmPassword").value.trim();

if(password.length < 6){
alert("Password minimal 6 karakter.");
return;
}

if(password !== confirmPassword){
alert("Konfirmasi password tidak sama.");
return;
}

try{

const { error } = await database.supabase.auth.updateUser({
password: password
});

if(error) throw error;

alert("✅ Password berhasil diubah.");

window.location.href = "login.html";

}catch(err){

console.error(err);

alert("❌ " + err.message);

}

});

document.querySelectorAll(".toggle-password").forEach(btn=>{

btn.onclick=function(){

const input=document.getElementById(this.dataset.target);
const icon=this.querySelector("i");

if(input.type==="password"){
input.type="text";
icon.className="fa-solid fa-eye-slash";
}else{
input.type="password";
icon.className="fa-solid fa-eye";
}

};

});

});
