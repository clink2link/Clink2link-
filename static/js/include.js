async function loadComponent(id,url){

    const res=await fetch(url);

    if(!res.ok)return;

    document.getElementById(id).innerHTML=await res.text();

}

window.addEventListener("DOMContentLoaded",()=>{

    loadComponent("navbar","/static/components/navbar.html");

    loadComponent("footer","/static/components/footer.html");

});
