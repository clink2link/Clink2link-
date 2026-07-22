// js/admin.js

const db = window.database;
const supabase = db.supabase;

let user = null;

const rupiah = value =>
new Intl.NumberFormat("id-ID",{
    style:"currency",
    currency:"IDR",
    maximumFractionDigits:0
}).format(Number(value)||0);

document.addEventListener("DOMContentLoaded", init);

async function init(){

    user = await db.getUser();

    if(!user){
        location.href="login.html";
        return;
    }

    // cek admin
    const {data:admin} = await supabase
    .from("admins")
    .select("*")
    .eq("user_id",user.id)
    .maybeSingle();

    if(!admin){
        alert("Akses ditolak");
        location.href="dashboard.html";
        return;
    }

    await loadDashboard();

    setInterval(loadDashboard,30000);

}

async function loadDashboard(){

    await Promise.all([
        loadUsers(),
        loadWithdraw(),
        loadRecentWithdraw()
    ]);

}

async function loadUsers(){

    const {data,error}=await supabase
    .from("profiles")
    .select("*");

    if(error){
        console.log(error);
        return;
    }

    const users=data||[];

    totalUsers.innerText=users.length;

    let balance=0;

    users.forEach(u=>{
        balance+=Number(u.balance)||0;
    });

    totalBalance.innerText=rupiah(balance);

    const today=new Date();

    today.setHours(0,0,0,0);

    const todayCount=users.filter(u=>
        new Date(u.created_at)>=today
    ).length;

    todayUsers.innerText=todayCount;

}

async function loadWithdraw(){

    const {data,error}=await supabase
    .from("withdraws")
    .select("*");

    if(error){
        console.log(error);
        return;
    }

    let pending=0;
    let success=0;

    data.forEach(w=>{

        const amount=Number(w.amount)||0;

        if(w.status==="pending")
            pending+=amount;

        if(w.status==="success")
            success+=amount;

    });

    document.getElementById("pendingWithdraw").innerText=
    rupiah(pending);

    document.getElementById("successWithdraw").innerText=
    rupiah(success);

}

async function loadRecentWithdraw(){

    const {data,error}=await supabase
    .from("withdraws")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(10);

    if(error){
        console.log(error);
        return;
    }

    if(!data.length){

        recentWithdraw.innerHTML=
        "<tr><td colspan='5'>Belum ada data</td></tr>";

        return;

    }

    recentWithdraw.innerHTML="";

    data.forEach(item=>{

        const badge=`
        <span class="badge ${item.status}">
        ${item.status}
        </span>
        `;

        recentWithdraw.innerHTML+=`

        <tr>

        <td>${item.user_id}</td>

        <td>${item.method}</td>

        <td>${rupiah(item.amount)}</td>

        <td>${badge}</td>

        <td>${new Date(item.created_at).toLocaleDateString("id-ID")}</td>

        </tr>

        `;

    });

}

