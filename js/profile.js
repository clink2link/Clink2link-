document.addEventListener("DOMContentLoaded",async()=>{


const id=document.getElementById("profileId");
const username=document.getElementById("profileUsername");
const balance=document.getElementById("profileBalance");
const status=document.getElementById("profileStatus");
const created=document.getElementById("profileCreated");
const copy=document.getElementById("copyId");


const userId=localStorage.getItem("user_id");


if(!userId)return;



const {data,error}=await database.supabase
.from("profiles")
.select("*")
.eq("id",userId)
.single();



if(error){

console.error(error);
return;

}



username.textContent=data.username || "User";

id.textContent=data.id.substring(0,8)+"...";


id.dataset.full=data.id;



balance.textContent=
"Rp "+
Number(data.balance||0)
.toLocaleString("id-ID");



status.textContent=data.status || "active";



created.textContent=
new Date(data.created_at)
.toLocaleDateString("id-ID");





copy.onclick=()=>{


navigator.clipboard.writeText(
id.dataset.full
);


copy.innerHTML=
'<i class="fa-solid fa-check"></i>';



setTimeout(()=>{

copy.innerHTML=
'<i class="fa-solid fa-copy"></i>';

},1000);



};



});
