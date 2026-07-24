/* =================================
CLICK2PAY REFERRAL SYSTEM
================================= */

const BONUS_PER_REF = 2000;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

showSkeleton();

const user = await window.database.getUser();

if(!user){
location.href = "index.html";
return;
}

/* ================= REF CODE ================= */

let refCode = user.ref_code || ("REF" + user.id);
let link = location.origin + "/register.html?ref=" + refCode;

document.getElementById("refCode").value = refCode;
document.getElementById("refLink").innerText = link;

/* ================= COPY ================= */

window.copyReferral = () => {
navigator.clipboard.writeText(link);
showToast("Link referral berhasil disalin");
};

/* ================= LOAD DATA ================= */

const data = await getMyReferrals(user.id);

renderReferral(data);
updateStats(data);

});


/* ================= API ================= */

async function getMyReferrals(userId){

try{
const {data,error} = await window.database.supabase
.from("referrals")
.select("*")
.eq("referrer_id", userId)
.order("created_at",{ascending:false});

if(error) throw error;

return data || [];

}catch(err){
console.error("REFERRAL ERROR:", err);
return [];
}

}


/* ================= SKELETON ================= */

function showSkeleton(){

const container = document.getElementById("refList");

container.innerHTML = "";

for(let i=0;i<4;i++){
container.innerHTML += `
<div class="link-card" style="opacity:.6">
<div style="height:14px;width:60%;background:#e2e8f0;border-radius:6px;margin-bottom:10px;"></div>
<div style="height:12px;width:40%;background:#e2e8f0;border-radius:6px;"></div>
</div>
`;
}

}


/* ================= EMPTY ================= */

function emptyState(){

const container = document.getElementById("refList");

container.innerHTML = `
<div class="ref-empty">
<i class="fa-solid fa-user-slash"></i>
<p>Belum ada referral</p>
</div>
`;

}


/* ================= RENDER ================= */

function renderReferral(data){

const container = document.getElementById("refList");

container.innerHTML = "";

if(!data || data.length === 0){
emptyState();
return;
}

data.forEach((item,index) => {

container.innerHTML += `
<div class="link-card" style="animation:fadeIn .4s ease ${index * 0.05}s both;">
<div class="link-top">
<h3>${item.referred_email || "User Baru"}</h3>
<span class="badge success">Join</span>
</div>

<div class="link-mid">
<span>${formatDate(item.created_at)}</span>
<strong>+${formatRupiah(BONUS_PER_REF)}</strong>
</div>
</div>
`;

});

}


/* ================= STATS ================= */

function updateStats(data){

let total = data.length;
let bonus = total * BONUS_PER_REF;

document.getElementById("totalRef").innerText = total;
document.getElementById("totalBonus").innerText = formatRupiah(bonus);

}


/* ================= UTIL ================= */

function formatRupiah(num){
return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatDate(date){
return new Date(date).toLocaleDateString("id-ID",{
day:"2-digit",
month:"short",
year:"numeric"
});
}


/* ================= TOAST ================= */

function showToast(message){

let toast = document.createElement("div");

toast.innerText = message;

toast.style.position = "fixed";
toast.style.bottom = "20px";
toast.style.left = "50%";
toast.style.transform = "translateX(-50%)";
toast.style.background = "#0f172a";
toast.style.color = "#fff";
toast.style.padding = "10px 18px";
toast.style.borderRadius = "10px";
toast.style.fontSize = "13px";
toast.style.boxShadow = "0 10px 30px rgba(0,0,0,.2)";
toast.style.zIndex = "9999";
toast.style.opacity = "0";
toast.style.transition = ".3s";

document.body.appendChild(toast);

setTimeout(()=> toast.style.opacity = "1",100);

setTimeout(()=>{
toast.style.opacity = "0";
setTimeout(()=> toast.remove(),300);
},2000);

}
