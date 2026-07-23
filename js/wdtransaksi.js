"use strict";


let supabase=null;
let user=null;


const $=id=>document.getElementById(id);



document.addEventListener("DOMContentLoaded",async()=>{


if(!window.database){

console.error("Database tidak tersedia");

return;

}



supabase=database.supabase;



user=await database.getCurrentProfile();



if(!user){

location.href="login.html";

return;

}



await loadWD();


startRealtime();



});






// ===============================
// LOAD WD SUCCESS
// ===============================


async function loadWD(){



const info=$("wdInfo");

const list=$("wdList");



const {data,error}=await supabase

.from("withdraws")

.select("*")

.eq("user_id",user.id)

.eq("status","success")

.order("created_at",{ascending:false});





if(error){


console.log(error);


info.innerHTML=
`
<i class="fa-solid fa-circle-xmark"></i>

Gagal mengambil transaksi.
`;

return;

}





if(!data || data.length===0){



info.innerHTML=
`
<i class="fa-solid fa-info-circle"></i>

Belum ada transaksi withdraw berhasil.
`;



list.innerHTML=
"";


return;


}





info.innerHTML=
`
<i class="fa-solid fa-circle-check"></i>

Total ${data.length} transaksi berhasil.
`;





list.innerHTML="";




data.forEach(item=>{



list.innerHTML+=`

<div class="wd-card">


<div class="wd-header">


<div class="wd-icon">

<i class="fa-solid fa-circle-check"></i>

</div>



<div>

<h3>

Withdraw Success

</h3>


<span>

${formatDate(item.created_at)}

</span>


</div>



</div>





<div class="wd-amount">

${rupiah(item.amount)}

</div>





<div class="wd-detail">


<div>

<span>

Metode

</span>


<b>

${item.method||"-"}

</b>


</div>





<div>

<span>

Nomor

</span>


<b>

${mask(item.account_number)}

</b>


</div>





<div>

<span>

Biaya

</span>


<b>

${rupiah(item.fee||0)}

</b>


</div>



</div>



</div>

`;



});



}









// ===============================
// REALTIME
// ===============================


function startRealtime(){



supabase

.channel("wd-history-"+user.id)


.on(

"postgres_changes",

{

event:"*",

schema:"public",

table:"withdraws",

filter:`user_id=eq.${user.id}`

},

()=>{


loadWD();


}

)


.subscribe();



}







// ===============================
// FORMAT
// ===============================


function rupiah(value){


return new Intl.NumberFormat("id-ID",{


style:"currency",

currency:"IDR",

maximumFractionDigits:0


}).format(Number(value)||0);


}






function mask(value){


if(!value)

return "-";



if(value.length<7)

return value;



return value.substring(0,3)

+"****"

+value.substring(value.length-3);



}






function formatDate(date){



if(!date)

return "-";



return new Date(date)

.toLocaleString("id-ID",{

day:"2-digit",

month:"long",

year:"numeric",

hour:"2-digit",

minute:"2-digit"

});


}
