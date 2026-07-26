document.addEventListener("DOMContentLoaded",async()=>{


let path =
location.pathname.split("/");


let code =
path[path.length-1];


console.log("BUY CODE:",code);



let link =
await database.getLinkByCode(code);



if(!link){

document.getElementById("buyBox").innerHTML=
`
<h3>
Link tidak ditemukan
</h3>
`;

return;

}



document.getElementById("buyBox").innerHTML=
`

<div class="sell-card">

<h2>
${link.title}
</h2>


<p>
Harga:
<b>
Rp ${Number(link.price).toLocaleString("id-ID")}
</b>
</p>


<button class="btn-sell">
Bayar Sekarang
</button>


</div>

`;


});
