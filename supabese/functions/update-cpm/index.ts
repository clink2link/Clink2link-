import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.cron("update cpm", "0 * * * *", async()=>{

const supabase=createClient(
Deno.env.get("SUPABASE_URL")!,
Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);


const {data,error}=await supabase
.from("cpm_rates")
.select("*");


if(error||!data)return;


for(const item of data){

const oldCpm=Number(item.cpm||75);

const min=oldCpm*0.90;
const max=oldCpm*1.10;


const newCpm=Math.floor(
Math.random()*(max-min)+min
);


await supabase
.from("cpm_rates")
.update({

cpm:newCpm,
updated_at:new Date()

})
.eq("id",item.id);


}

});
