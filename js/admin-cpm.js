async function updateCPM(){

try{

const {data,error}=await supabaseClient
.from("cpm_rates")
.select("*");

if(error){
console.log(error);
return;
}

if(!data || !data.length)return;


for(const item of data){

let oldCpm=Number(item.cpm||0);

/* naik turun random */
let change=(Math.random()*20)-10;


/* batas CPM */
let newCpm=Math.round(
Math.max(100,oldCpm+change)
);


/* hitung persen */
let percent=0;

if(oldCpm>0){
percent=((newCpm-oldCpm)/oldCpm)*100;
}


await supabaseClient
.from("cpm_rates")
.update({

cpm:newCpm,

change:Number(percent.toFixed(1)),

trend:Math.min(
100,
Math.max(
10,
Number(item.trend||50)+
(Math.random()*10-5)
)
),

updated_at:new Date()

})
.eq("id",item.id);


}

console.log("CPM berhasil diperbarui");


}catch(err){

console.log("CPM ERROR:",err);

}

}


/* update saat halaman dibuka */
updateCPM();


/* update otomatis setiap 10 menit */
setInterval(()=>{

updateCPM();

},600000);
