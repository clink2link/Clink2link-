// js/payment.js

document.addEventListener("DOMContentLoaded",()=>{

const db=window.database;
const supabase=db.supabase;

let user=null;


const rupiah=(v)=>new Intl.NumberFormat("id-ID",{
style:"currency",
currency:"IDR",
maximumFractionDigits:0
}).format(Number(v)||0);


async function init(){

user=await db.getUser();

if(!user){

location.href="login.html";
return;

}

await loadBalance();
await loadWithdraw();
await loadPayment();

}



async function loadBalance(){

const profile=await db.getProfile(user.id);

if(profile){

currentBalance.innerText=rupiah(profile.balance);

}

}



async function loadWithdraw(){

const {data,error}=await supabase
.from("withdraws")
.select("*")
.eq("user_id",user.id);


if(error){

console.error(error);
return;

}


let request=0;
let pending=0;
let success=0;
let failed=0;


(data||[]).forEach(w=>{

let amount=Number(w.amount)||0;

request+=amount;


if(w.status==="pending"){
pending+=amount;
}

if(w.status==="success"){
success+=amount;
}

if(w.status==="failed"){
failed+=amount;
}


});



requestWithdraw.innerText=rupiah(request);
pendingWithdraw.innerText=rupiah(pending);
successWithdraw.innerText=rupiah(success);
failedWithdraw.innerText=rupiah(failed);



withdrawStatus.innerHTML=`
<i class="fa-solid fa-circle-check"></i>
Status pembayaran berhasil dimuat.
`;

}




async function loadPayment(){


const {data,error}=await supabase
.from("payment_methods")
.select("*")
.eq("user_id",user.id)
.maybeSingle();



if(error){

console.log(error);
return;

}



if(!data)return;



paymentName.value=data.account_name||"";
paymentNumber.value=data.account_number||"";
paymentMethod.value=data.method||"";


showPayment(data);


}




function showPayment(data){


paymentDetail.style.display="block";


detailContent.innerHTML=`

<div class="detail-row">
<span class="detail-label">Nama</span>
<span class="detail-value">${data.account_name||"-"}</span>
</div>

<div class="detail-row">
<span class="detail-label">Metode</span>
<span class="detail-value">${data.method||"-"}</span>
</div>

<div class="detail-row">
<span class="detail-label">Nomor</span>
<span class="detail-value">${data.account_number||"-"}</span>
</div>

`;

}




savePayment.onclick=async()=>{


let name=paymentName.value.trim();
let number=paymentNumber.value.trim();
let method=paymentMethod.value;



if(!name||!number){

alert("Lengkapi data pembayaran");
return;

}



const payload={

user_id:user.id,
bank_name:method,
account_name:name,
account_number:number,
method:method

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


alert("Pembayaran berhasil disimpan");

loadPayment();


};





editPayment.onclick=()=>{

paymentForm.scrollIntoView({
behavior:"smooth"
});

};





document.querySelectorAll("#withdrawBtn")
.forEach(btn=>{


btn.onclick=async()=>{


let amount=Number(withdrawAmount.value);



if(!amount||amount<100000){

alert("Minimal withdraw Rp100.000");
return;

}



const profile=await db.getProfile(user.id);



if(!profile){

alert("Profile tidak ditemukan");
return;

}



if(Number(profile.balance)<amount){

alert("Saldo tidak mencukupi");
return;

}



const {data:method}=await supabase
.from("payment_methods")
.select("*")
.eq("user_id",user.id)
.maybeSingle();



if(!method){

alert("Simpan rekening pembayaran terlebih dahulu");
return;

}




const {error}=await supabase
.from("withdraws")
.insert({

user_id:user.id,
method:method.method,
account_number:method.account_number,
amount:amount,
status:"pending"

});



if(error){

alert(error.message);
return;

}



const {error:updateError}=await supabase
.from("profiles")
.update({

balance:Number(profile.balance)-amount

})
.eq("id",user.id);



if(updateError){

alert(updateError.message);
return;

}



alert("Request withdraw berhasil dibuat");


withdrawAmount.value="";


await loadBalance();
await loadWithdraw();


};



});





init();


});
