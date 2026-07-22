document.addEventListener("DOMContentLoaded",async()=>{

const id=document.getElementById("profileId");
const username=document.getElementById("profileUsername");
const balance=document.getElementById("profileBalance");
const status=document.getElementById("profileStatus");
const created=document.getElementById("profileCreated");
const copy=document.getElementById("copyId");

const userId=localStorage.getItem("user_id");

console.log("PROFILE USER ID:",userId);

if(!userId)return;

try{

const data=await database.getCurrentProfile();

console.log("PROFILE DATA:",data);

if(!data)return;

if(username){
username.textContent=data.username||"User";
}

if(id){
id.textContent=data.id ? data.id.substring(0,8)+"..." : "-";
id.dataset.full=data.id||"";
}

if(balance){
balance.textContent="Rp "+Number(data.balance||0).toLocaleString("id-ID");
}

if(status){
status.textContent=data.status||"active";
}

if(created){
created.textContent=data.created_at
?new Date(data.created_at).toLocaleDateString("id-ID")
:"-";
}

if(copy){
copy.onclick=()=>{
const fullId=id.dataset.full;
if(!fullId)return;

navigator.clipboard.writeText(fullId);

copy.innerHTML='<i class="fa-solid fa-check"></i>';

setTimeout(()=>{
copy.innerHTML='<i class="fa-solid fa-copy"></i>';
},1000);

};
}

console.log("PROFILE RENDER SUCCESS");

}catch(err){
console.error("PROFILE ERROR:",err);
}

});
