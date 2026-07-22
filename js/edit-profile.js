document.addEventListener("DOMContentLoaded",async()=>{

const username=document.getElementById("editUsername");
const button=document.getElementById("saveProfile");
const result=document.getElementById("editResult");


const profile=await database.getCurrentProfile();


if(profile){

username.value=profile.username||"";

}



button.onclick=async()=>{


const value=username.value.trim();


if(!value){

result.innerHTML="❌ Username tidak boleh kosong";
return;

}



try{


button.disabled=true;


await database.updateProfile({

username:value

});


result.innerHTML=
"✅ Username berhasil diperbarui";


setTimeout(()=>{

location.href="profile.html";

},1000);



}catch(err){

console.error(err);

result.innerHTML=
"❌ Gagal update profile";


}finally{

button.disabled=false;

}


};


});
