/* =================================
   CLICK2PAY PROFILE
   FINAL DATABASE VERSION
================================= */

document.addEventListener("DOMContentLoaded",async()=>{

const profileUser=document.getElementById("profileUsername");
const profileUserInfo=document.getElementById("profileUsernameInfo");
const profileId=document.getElementById("profileId");
const profileEmail=document.getElementById("profileEmail");
const profileBalance=document.getElementById("profileBalance");
const profileStatus=document.getElementById("profileStatus");
const profileCreated=document.getElementById("profileCreated");
const profileReferral=document.getElementById("profileReferral");
const profileReferralIncome=document.getElementById("profileReferralIncome");

const paymentMethod=document.getElementById("paymentMethod");
const paymentNumber=document.getElementById("paymentNumber");
const paymentName=document.getElementById("paymentName");

const copyBtn=document.getElementById("copyId");

try{

if(!window.database){

console.error("DATABASE BELUM READY");

return;

}

const user=await window.database.getUser();

if(!user){

location.href="index.html";

return;

}

const profile=await window.database.getCurrentProfile();

let referralCount=0;
let referralIncome=0;

let bankMethod="-";
let bankNumber="-";
let bankOwner="-";

/* ================= REFERRAL ================= */

const {
data:referrals,
error:refError
}=await window.database.supabase
.from("referrals")
.select(`
id,
bonus
`)
.eq("referrer_id",user.id);

if(!refError&&referrals){

referralCount=referrals.length;

referralIncome=referrals.reduce(
(total,item)=>
total+Number(item.bonus||0),
0
);

}


/* ================= PAYMENT ================= */

const{
data:payment,
error:paymentError
}=await window.database.supabase
.from("payment_methods")
.select(`
method,
bank_name,
account_number,
account_name
`)
.eq("user_id",user.id)
.order("created_at",{
ascending:false
})
.limit(1)
.maybeSingle();

if(!paymentError&&payment){

bankMethod=
payment.bank_name||
payment.method||
"-";

bankNumber=
payment.account_number||
"-";

bankOwner=
payment.account_name||
"-";

}


/* ================= RENDER PROFILE ================= */

if(profileUser){

profileUser.textContent=
profile?.username||
user?.username||
"User";

}

if(profileUserInfo){

profileUserInfo.textContent=
profile?.username||
user?.username||
"-";

}

if(profileId){

profileId.textContent=
user?.id
?user.id.substring(0,8)+"..."
:"-";

profileId.dataset.full=
user?.id||"";

}

if(profileEmail){

profileEmail.textContent=
user?.email||
"-";

}

if(profileBalance){

profileBalance.textContent=
"Rp "+
Number(
profile?.balance||
user?.balance||
0
).toLocaleString("id-ID");

}

if(profileReferral){

profileReferral.textContent=
referralCount+" Orang";

}

if(profileReferralIncome){

profileReferralIncome.textContent=
"Rp "+
Number(referralIncome)
.toLocaleString("id-ID");

}

if(profileStatus){

profileStatus.textContent=
profile?.status||
"Member";

}

if(profileCreated){

const created=
profile?.created_at||
user?.created_at;

profileCreated.textContent=
created
?new Date(created).toLocaleDateString(
"id-ID",
{
day:"2-digit",
month:"long",
year:"numeric"
}
)
:"-";

}


/* ================= PAYMENT INFO ================= */

if(paymentMethod){

paymentMethod.textContent=
bankMethod;

}

if(paymentNumber){

paymentNumber.textContent=
bankNumber;

}

if(paymentName){

paymentName.textContent=
bankOwner;

}


/* ================= COPY ID ================= */

if(copyBtn){

copyBtn.onclick=async()=>{

try{

await navigator.clipboard.writeText(
user.id
);

copyBtn.innerHTML=
'<i class="fa-solid fa-check"></i>';

setTimeout(()=>{

copyBtn.innerHTML=
'<i class="fa-solid fa-copy"></i>';

},1200);

showToast(
"ID berhasil disalin"
);

}catch(e){

console.error(e);

}

};

}

}catch(err){

console.error(
"PROFILE ERROR:",
err
);

showToast(
"Gagal memuat data profile"
);

}

});


/* ================= TOAST ================= */

function showToast(message){

const toast=
document.createElement("div");

toast.textContent=
message;

toast.style.cssText=`
position:fixed;
left:50%;
bottom:20px;
transform:translateX(-50%);
background:#0f172a;
color:#fff;
padding:12px 18px;
border-radius:12px;
font-size:13px;
font-weight:600;
box-shadow:0 10px 30px rgba(0,0,0,.25);
z-index:99999;
opacity:0;
transition:.25s;
`;

document.body.appendChild(toast);

requestAnimationFrame(()=>{
toast.style.opacity="1";
});

setTimeout(()=>{

toast.style.opacity="0";

setTimeout(()=>{
toast.remove();
},250);

},2000);

}
