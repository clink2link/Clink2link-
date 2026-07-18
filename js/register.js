console.log("REGISTER JS LOADED");


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


// =======================
// ALERT
// =======================

function showRegisterAlert(message,type="error"){

const box=document.getElementById("registerAlert");

if(!box){

alert(message);
return;

}

box.innerHTML=`

<div class="alert-box alert-${type}">
${message}
</div>

`;

}



// =======================
// ELEMENT
// =======================

const form=document.getElementById("registerForm");

if(form){


const btn=document.getElementById("registerBtn");

const username=document.getElementById("username");
const email=document.getElementById("email");
const password=document.getElementById("password");
const confirmPassword=document.getElementById("confirmPassword");



// =======================
// SUBMIT
// =======================


form.addEventListener("submit",async e=>{


e.preventDefault();


const userName=username.value.trim();
const userEmail=email.value.trim().toLowerCase();
const userPassword=password.value;
const userConfirm=confirmPassword.value;



if(userName.length<4){

showRegisterAlert("❌ Username minimal 4 karakter.");
return;

}


if(userName.length>7){

showRegisterAlert("❌ Username maksimal 7 karakter.");
return;

}


if(!/^[a-zA-Z0-9_]+$/.test(userName)){

showRegisterAlert("❌ Username hanya huruf angka underscore.");
return;

}


if(userPassword.length<6){

showRegisterAlert("❌ Password minimal 6 karakter.");
return;

}


if(userPassword!==userConfirm){

showRegisterAlert("❌ Konfirmasi password tidak sama.");
return;

}



btn.disabled=true;

btn.innerHTML=
'<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';



try{


// CEK USERNAME

const {
data:exist,
error:checkError

}=await database.supabase

.from("users")

.select("id")

.eq("username",userName)

.maybeSingle();



if(checkError)
throw checkError;



if(exist){

showRegisterAlert(
"❌ Username sudah digunakan."
);

return;

}



// =======================
// CREATE AUTH USER
// =======================


const {

data:authData,

error:authError

}=await database.supabase.auth.signUp({

email:userEmail,

password:userPassword

});



if(authError)
throw authError;



const authUser=authData.user;



if(!authUser){

throw new Error(
"Gagal membuat akun."
);

}



// =======================
// INSERT USERS
// =======================


const {
error:userError

}=await database.supabase

.from("users")

.insert({

id:authUser.id,

username:userName,

email:userEmail,

balance:0,

is_admin:false,

is_banned:false

});



if(userError)
throw userError;



// =======================
// INSERT PROFILE
// =======================


const {

error:profileError

}=await database.supabase

.from("profiles")

.insert({

id:authUser.id,

username:userName,

full_name:userName,

status:"active",

balance:0,

total_views:0,

total_clicks:0,

ads_earning_today:0,

ads_earning_month:0,

ads_earning_total:0,

sell_earning_today:0,

sell_earning_month:0,

sell_earning_total:0,

withdraw_count:0,

sell_link_enabled:false

});



if(profileError)
throw profileError;



showRegisterAlert(
"✅ Registrasi berhasil. Silakan cek email.",
"success"
);



setTimeout(()=>{

window.location.href="login.html";

},2000);



}

catch(err){


console.error(err);


showRegisterAlert(
"❌ "+err.message
);



}

finally{


btn.disabled=false;


btn.innerHTML=
'<i class="fa-solid fa-user-plus"></i><span> Daftar</span>';

}



});


}
