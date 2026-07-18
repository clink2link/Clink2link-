document.addEventListener("DOMContentLoaded", async () => {

const form=document.getElementById("resetForm");

try{

const { data, error } = await database.supabase.auth.getSession();

if(error) throw error;

if(!data.session){

alert("❌ Link reset password tidak valid atau sudah kedaluwarsa.");

window.location.href="login.html";

return;

}

}catch(err){

console.error(err);

alert("❌ "+err.message);

window.location.href="login.html";

return;

}


form.addEventListener("submit",async(e)=>{

e.preventDefault();

const password=document.getElementById("password").value.trim();
const confirmPassword=document.getElementById("confirmPassword").value.trim();

if(password.length<6){

alert("Password minimal 6 karakter.");
return;

}

if(password!==confirmPassword){

alert("Konfirmasi password tidak sama.");
return;

}

const btn=form.querySelector("button[type='submit']");

btn.disabled=true;

btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

try{

const { error }=await database.supabase.auth.updateUser({

password:password

});

if(error) throw error;

alert("✅ Password berhasil diubah.");

await database.supabase.auth.signOut();

window.location.href="login.html";

}catch(err){

console.error(err);

alert("❌ "+err.message);

}finally{

btn.disabled=false;

btn.innerHTML='<i class="fa-solid fa-check"></i> <span>Simpan Password</span>';

}

});


document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".toggle-password").forEach(btn => {

        btn.addEventListener("click", function (e) {

            e.preventDefault();

            const input = document.getElementById(this.dataset.target);

            if (!input) return;

            const icon = this.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }

        });

    });

});
