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



loadPayment();


bindEvent();


});




// =======================
// LOAD DATA
// =======================

async function loadPayment(){


const alertBox=$("paymentAlert");


const {data,error}=await supabase

.from("payment_methods")

.select("*")

.eq("user_id",user.id)

.maybeSingle();



if(error){

console.log(error);

return;

}



if(!data){

alertBox.innerHTML=
`
<i class="fa-solid fa-circle-info"></i>
Belum ada rekening pembayaran.
`;

return;

}




$("accountName").value=
data.account_name||"";


$("accountNumber").value=
data.account_number||"";


$("paymentMethod").value=
data.method||"";



$("currentPayment").style.display="block";



$("paymentDetail").innerHTML=
`

<div class="detail-row">

<span>
Nama
</span>

<b>
${data.account_name}
</b>

</div>


<div class="detail-row">

<span>
Metode
</span>

<b>
${data.method}
</b>

</div>


<div class="detail-row">

<span>
Nomor
</span>

<b>
${maskNumber(data.account_number)}
</b>

</div>

`;



alertBox.innerHTML=
`
<i class="fa-solid fa-circle-check"></i>
Rekening pembayaran aktif.
`;



}





// =======================
// EVENT
// =======================

function bindEvent(){


$("savePayment").onclick=
savePayment;


$("deletePayment").onclick=
deletePayment;


}




// =======================
// SIMPAN
// =======================

async function savePayment(){


const name=
$("accountName").value.trim();



const number=
$("accountNumber").value.trim();



const method=
$("paymentMethod").value;




if(name.length<3){

alert("Nama rekening tidak valid");

return;

}



if(number.length<6){

alert("Nomor rekening tidak valid");

return;

}





const payload={

user_id:user.id,

account_name:name,

account_number:number,

method:method,

bank_name:method

};





const {data:old}=await supabase

.from("payment_methods")

.select("id")

.eq("user_id",user.id)

.maybeSingle();






let result;



if(old){


result=await supabase

.from("payment_methods")

.update(payload)

.eq("user_id",user.id);



}else{


result=await supabase

.from("payment_methods")

.insert(payload);


}




if(result.error){

alert(result.error.message);

return;

}




alert("Rekening pembayaran berhasil disimpan");


loadPayment();



}






// =======================
// HAPUS
// =======================


async function deletePayment(){


const confirmDelete=
confirm(
"Hapus rekening pembayaran?"
);



if(!confirmDelete)return;



const {error}=await supabase

.from("payment_methods")

.delete()

.eq("user_id",user.id);



if(error){

alert(error.message);

return;

}



alert("Rekening berhasil dihapus");


location.reload();


}





// =======================
// MASKING NOMOR
// =======================


function maskNumber(number){


if(!number)return "-";


if(number.length<=6)
return number;



return number.substring(0,3)+

"****"+

number.substring(number.length-3);



}
