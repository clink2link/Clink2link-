// ===============================
// CLICK2PAY GLOBAL THEME
// ===============================

function applyTheme(){

const hour=new Date().getHours();

const isDark=hour>=18 || hour<6;

if(isDark){

document.documentElement.classList.add("dark");
document.body.classList.add("dark");

localStorage.setItem("theme","dark");

}else{

document.documentElement.classList.remove("dark");
document.body.classList.remove("dark");

localStorage.setItem("theme","light");

}

}


// START

applyTheme();


// UPDATE SETIAP MENIT

setInterval(applyTheme,60000);
