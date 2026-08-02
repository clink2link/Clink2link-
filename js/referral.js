/* =================================
CLICK2PAY REFERRAL SYSTEM
FINAL FIX DATABASE
================================= */

const BONUS_PER_REF = 2000;


document.addEventListener("DOMContentLoaded",async()=>{


try{


if(!window.database){

console.log("DATABASE BELUM READY");

setTimeout(()=>{
location.reload();
},500);

return;

}


const user =
await window.database.getUser();


if(!user){

location.href="index.html";

return;

}


/* ================= REF CODE ================= */


const refCode =
user.ref_code ||
("REF"+user.id);



const link =
location.origin+
"/register.html?ref="+refCode;



const code =
document.getElementById("refCode");

const refLink =
document.getElementById("refLink");



if(code)
code.value=refCode;


if(refLink)
refLink.innerText=link;



/* COPY */

window.copyReferral=()=>{


if(navigator.clipboard){

navigator.clipboard.writeText(link);

}
else{

const temp=document.createElement("textarea");

temp.value=link;

document.body.appendChild(temp);

temp.select();

document.execCommand("copy");

temp.remove();

}


showToast(
"Link referral berhasil disalin"
);


};



/* LOAD */


const referrals =
await getMyReferrals(user.id);



renderReferral(referrals);

updateStats(referrals);



}catch(err){

console.error(
"REFERRAL INIT ERROR:",
err
);

}



});





/* ================= GET DATA ================= */


async function getMyReferrals(userId){


try{


const {
data,
error
}=await window.database.supabase


.from("referrals")

.select(`
id,
referrer_id,
referred_email,
created_at
`)


.eq(
"referrer_id",
userId
)


.order(
"created_at",
{
ascending:false
}
);



if(error)
throw error;



return data || [];



}catch(err){


console.error(
"GET REFERRAL ERROR:",
err
);


return [];


}


}





/* ================= SKELETON ================= */


function showSkeleton(){


const container =
document.getElementById("refList");

if(!container)
return;


container.innerHTML="";


for(let i=0;i<3;i++){


container.innerHTML+=`

<div class="link-card">

<div style="
height:14px;
width:60%;
background:var(--border);
border-radius:8px;
margin-bottom:10px;
"></div>


<div style="
height:12px;
width:40%;
background:var(--border);
border-radius:8px;
"></div>


</div>

`;


}


}






/* ================= EMPTY ================= */


function emptyState(){


const container =
document.getElementById("refList");


container.innerHTML=`

<div class="ref-empty">

<i class="fa-solid fa-user-slash"></i>

<h3>
Belum ada referral
</h3>

<p>
Bagikan link referral kamu
</p>

</div>

`;


}





/* ================= RENDER ================= */


function renderReferral(data){


const container =
document.getElementById("refList");


if(!container)
return;



container.innerHTML="";



if(!data.length){

emptyState();

return;

}



data.forEach((item,index)=>{


container.innerHTML+=`

<div class="link-card"
style="
animation:fadeIn .3s ease ${index*.05}s both;
">


<div class="link-top">


<h3>

<i class="fa-solid fa-user"></i>

${item.referred_email || "User Baru"}

</h3>


<span class="badge success">
Join
</span>


</div>



<div class="link-mid">


<span>
${formatDate(item.created_at)}
</span>



<strong style="color:#16a34a">

+${formatRupiah(BONUS_PER_REF)}

</strong>



</div>


</div>

`;


});


}





/* ================= STATS ================= */


function updateStats(data){


const total =
data.length;


const bonus =
total*BONUS_PER_REF;



const ref =
document.getElementById("totalRef");


const money =
document.getElementById("totalBonus");



if(ref)
ref.innerText=total;



if(money)
money.innerText=formatRupiah(bonus);



}





/* ================= FORMAT ================= */


function formatRupiah(num){


return new Intl.NumberFormat(
"id-ID",
{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}

).format(Number(num)||0);


}



function formatDate(date){


if(!date)
return "-";


return new Date(date)
.toLocaleDateString(
"id-ID",
{
day:"2-digit",
month:"short",
year:"numeric"
}
);


}





/* ================= TOAST ================= */


function showToast(message){


const toast=
document.createElement("div");


toast.innerText=message;


toast.style.cssText=`

position:fixed;
bottom:20px;
left:50%;
transform:translateX(-50%);
background:#0f172a;
color:white;
padding:10px 18px;
border-radius:12px;
font-size:13px;
z-index:9999;
box-shadow:0 10px 30px rgba(0,0,0,.2);

`;



document.body.appendChild(toast);



setTimeout(()=>{

toast.remove();

},2000);



}
