/*==================================================
  CLICK2PAY - assets/js/script.js
==================================================*/

// ==============================
// AOS
// ==============================
AOS.init({
    duration:800,
    once:true,
    offset:80
});

// ==============================
// Navbar Shadow
// ==============================

const navbar=document.querySelector(".navbar");

window.addEventListener("scroll",()=>{

if(window.scrollY>40){

navbar.style.padding="10px 0";
navbar.style.boxShadow="0 15px 35px rgba(0,0,0,.12)";

}else{

navbar.style.padding="18px 0";
navbar.style.boxShadow="";

}

});

// ==============================
// Counter
// ==============================

document.querySelectorAll(".counter").forEach(counter=>{

const target=+counter.dataset.target;

const speed=200;

const update=()=>{

const value=+counter.innerText.replace(/,/g,'');

const inc=Math.ceil(target/speed);

if(value<target){

counter.innerText=(value+inc).toLocaleString();

requestAnimationFrame(update);

}else{

counter.innerText=target.toLocaleString();

}

}

update();

});

// ==============================
// Scroll To Top
// ==============================

const topBtn=document.getElementById("topBtn");

window.onscroll=function(){

if(document.documentElement.scrollTop>350){

topBtn.style.display="block";

}else{

topBtn.style.display="none";

}

};

topBtn.onclick=function(){

window.scrollTo({

top:0,

behavior:"smooth"

});

};

// ==============================
// Floating Snow
// ==============================

function createSnow(){

const snow=document.createElement("span");

snow.innerHTML="❄";

snow.style.position="fixed";

snow.style.left=Math.random()*100+"vw";

snow.style.top="-30px";

snow.style.color="white";

snow.style.opacity=Math.random();

snow.style.fontSize=(10+Math.random()*18)+"px";

snow.style.pointerEvents="none";

snow.style.zIndex="0";

document.body.appendChild(snow);

const duration=5000+Math.random()*5000;

snow.animate([

{

transform:"translateY(-30px)"

},

{

transform:"translateY(110vh)"

}

],{

duration:duration,

iterations:1

});

setTimeout(()=>{

snow.remove();

},duration);

}

setInterval(createSnow,250);

// ==============================
// Hero Floating Icon
// ==============================

const heroIcon=document.querySelector(".hero i");

if(heroIcon){

setInterval(()=>{

heroIcon.animate([

{

transform:"translateY(0)"

},

{

transform:"translateY(-12px)"

},

{

transform:"translateY(0)"

}

],{

duration:3000

});

},3000);

}

// ==============================
// Button Ripple
// ==============================

document.querySelectorAll(".btn").forEach(button=>{

button.addEventListener("click",function(e){

const ripple=document.createElement("span");

const rect=this.getBoundingClientRect();

const size=Math.max(rect.width,rect.height);

ripple.style.width=size+"px";

ripple.style.height=size+"px";

ripple.style.left=e.clientX-rect.left-size/2+"px";

ripple.style.top=e.clientY-rect.top-size/2+"px";

ripple.style.position="absolute";

ripple.style.borderRadius="50%";

ripple.style.background="rgba(255,255,255,.45)";

ripple.style.transform="scale(0)";

ripple.style.animation="ripple .6s linear";

ripple.style.pointerEvents="none";

this.appendChild(ripple);

setTimeout(()=>{

ripple.remove();

},600);

});

});

// ==============================
// Ripple Style
// ==============================

const style=document.createElement("style");

style.innerHTML=`

.btn{

position:relative;

overflow:hidden;

}

@keyframes ripple{

to{

transform:scale(4);

opacity:0;

}

}

`;

document.head.appendChild(style);

// ==============================
// Active Menu
// ==============================

const sections=document.querySelectorAll("section");

const navLinks=document.querySelectorAll(".nav-link");

window.addEventListener("scroll",()=>{

let current="";

sections.forEach(section=>{

const top=section.offsetTop-120;

if(pageYOffset>=top){

current=section.getAttribute("id");

}

});

navLinks.forEach(link=>{

link.classList.remove("active");

if(link.getAttribute("href")==="#"+current){

link.classList.add("active");

}

});

});

// ==============================
// Random Glow Effect
// ==============================

setInterval(()=>{

document.querySelectorAll(".feature-card").forEach(card=>{

card.style.boxShadow="0 10px 35px rgba(13,110,253,.15)";

setTimeout(()=>{

card.style.boxShadow="";

},800);

});

},6000);

// ==============================
// END
// ==============================
