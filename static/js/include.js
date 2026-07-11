fetch("/static/components/navbar.html")
.then(res=>res.text())
.then(data=>{

document.getElementById("navbar").innerHTML=data;


const menu=document.getElementById("menuBtn");
const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");


if(menu){

menu.onclick=()=>{

sidebar.classList.toggle("active");

overlay.classList.toggle("active");

}

}


if(overlay){

overlay.onclick=()=>{

sidebar.classList.remove("active");

overlay.classList.remove("active");

}

}


});
