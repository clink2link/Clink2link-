// js/my-link.js

let allLinks=[];

async function loadMyLinks(){

try{

const user=await database.getUser();

if(!user){
window.location.replace("index.html");
return;
}


allLinks=await database.getLinks(user.id);

renderLinks("all");


}catch(error){

console.error("My Link Error:",error);

}

}



function renderLinks(type){

const box=document.getElementById("linkList");

if(!box)return;


let data=allLinks;


if(type!=="all"){

data=allLinks.filter(link=>link.type===type);

}



if(!data || data.length===0){

box.innerHTML=`

<div class="empty">

<i class="fa-solid fa-link-slash"></i>

<br>

Belum ada link

</div>

`;

return;

}



let html="";


data.forEach(link=>{


let url=link.short_url || link.url || "-";


html+=`

<div class="link-card">


<div class="link-icon">

<i class="fa-solid fa-link"></i>

</div>



<div class="link-info">


<h4>
${link.title || "Short Link"}
</h4>


<p>
${url}
</p>


<span>

${link.type==="sell" ? "Sell Link":"Ads Link"}

</span>


</div>




<div class="link-stat">


<b>
${Number(link.total_views||0).toLocaleString("id-ID")}
</b>

<small>
Views
</small>



<b>
${Number(link.total_clicks||0).toLocaleString("id-ID")}
</b>

<small>
Klik
</small>



<button onclick="copyLink('${url}')">

<i class="fa-solid fa-copy"></i>

</button>


</div>


</div>

`;

});


box.innerHTML=html;


}




function filterLink(type,btn){


document.querySelectorAll(".link-filter button")
.forEach(button=>{

button.classList.remove("active");

});


if(btn){

btn.classList.add("active");

}


renderLinks(type);


}




function copyLink(url){

if(!url)return;


navigator.clipboard.writeText(url)
.then(()=>{

alert("Link berhasil dicopy");

})
.catch(()=>{

alert("Gagal copy link");

});


}



loadMyLinks();
