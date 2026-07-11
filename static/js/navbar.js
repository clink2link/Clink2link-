const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");
const menuBtn=document.getElementById("menuBtn");

function openSidebar(){
    sidebar.classList.add("active");
    overlay.classList.add("active");
}

function closeSidebar(){
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

menuBtn.addEventListener("click",()=>{
    sidebar.classList.contains("active")
        ? closeSidebar()
        : openSidebar();
});

overlay.addEventListener("click",closeSidebar);

window.addEventListener("resize",()=>{
    if(window.innerWidth>=992){
        overlay.classList.remove("active");
    }else{
        sidebar.classList.remove("active");
    }
});
