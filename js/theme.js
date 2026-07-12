// ===============================
// CLICK2PAY GLOBAL THEME
// ===============================

function applyTheme(){

const hour=new Date().getHours();

if(hour>=18 || hour<6){

document.documentElement.classList.add("dark");

localStorage.setItem("theme","dark");

}else{

document.documentElement.classList.remove("dark");

localStorage.setItem("theme","light");

}

}


// jalankan langsung
applyTheme();


// cek setiap 1 menit
setInterval(applyTheme,60000);
