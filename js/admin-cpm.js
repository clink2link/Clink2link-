async function updateCPM(){

const {data,error}=await supabaseClient
.from("cpm_rates")
.select("*");

if(error||!data){
console.log(error);
return;
}


for(const item of data){

const oldCpm=Number(item.cpm||75);

const min=oldCpm*0.90;
const max=oldCpm*1.10;

const newCpm=Math.floor(
Math.random()*(max-min)+min
);


await supabaseClient
.from("cpm_rates")
.update({

cpm:newCpm,
updated_at:new Date()

})
.eq("id",item.id);


}

console.log("CPM berhasil diperbarui");

}
