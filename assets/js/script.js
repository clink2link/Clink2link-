/* =====================================================
   CLICK2PAY PREMIUM JAVASCRIPT
===================================================== */


/* =====================================================
   AOS INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", function(){

    if(typeof AOS !== "undefined"){

        AOS.init({

            duration:800,

            easing:"ease-out-cubic",

            once:true,

            offset:80

        });

    }

});



/* =====================================================
   NAVBAR SCROLL EFFECT
===================================================== */


const navbar = document.querySelector(".navbar");


window.addEventListener("scroll",()=>{


    if(window.scrollY > 50){

        navbar.classList.add("scrolled");

    }

    else{

        navbar.classList.remove("scrolled");

    }


});



/* =====================================================
   SMOOTH SCROLL NAVIGATION
===================================================== */


document.querySelectorAll('a[href^="#"]').forEach(link=>{


    link.addEventListener("click",function(e){


        const target =
        document.querySelector(
            this.getAttribute("href")
        );


        if(target){

            e.preventDefault();


            target.scrollIntoView({

                behavior:"smooth",

                block:"start"

            });


        }


    });


});



/* =====================================================
   MOBILE MENU AUTO CLOSE
===================================================== */


const navLinks =
document.querySelectorAll(".navbar-nav .nav-link");


const navbarCollapse =
document.querySelector(".navbar-collapse");


navLinks.forEach(link=>{


    link.addEventListener("click",()=>{


        if(
        window.innerWidth < 992 &&
        navbarCollapse.classList.contains("show")
        ){

            new bootstrap.Collapse(
                navbarCollapse
            ).hide();

        }


    });


});



/* =====================================================
   STATISTIC COUNTER
===================================================== */


const counters =
document.querySelectorAll(".counter");


let counterStarted=false;



function startCounter(){


    counters.forEach(counter=>{


        let target =
        counter.dataset.target;


        let number =
        parseInt(
            target
            .replace(/\D/g,"")
        );


        let suffix="";


        if(target.includes("k")){

            suffix="K";

            number=number*1000;

        }


        if(target.includes("m")){

            suffix="M";

            number=number*1000000;

        }


        let current=0;


        let increment =
        number / 120;



        let timer =
        setInterval(()=>{


            current += increment;


            if(current >= number){

                current=number;

                clearInterval(timer);

            }


            if(number >= 1000000){

                counter.innerHTML =
                Math.floor(current/1000000)
                +"M+";

            }

            else if(number >=1000){

                counter.innerHTML =
                Math.floor(current/1000)
                +"K+";

            }

            else{

                counter.innerHTML =
                Math.floor(current)
                +suffix;

            }


        },20);



    });


}



window.addEventListener("scroll",()=>{


    const statistic =
    document.querySelector(".counter");


    if(!statistic)return;


    const position =
    statistic.getBoundingClientRect()
    .top;


    if(
    position <
    window.innerHeight
    &&
    !counterStarted
    ){

        counterStarted=true;

        startCounter();

    }


});



/* =====================================================
   BACK TO TOP
===================================================== */


const topBtn =
document.getElementById("topBtn");


window.addEventListener("scroll",()=>{


    if(window.scrollY > 400){

        topBtn.style.display="flex";

        topBtn.style.alignItems="center";

        topBtn.style.justifyContent="center";

    }

    else{

        topBtn.style.display="none";

    }


});



topBtn.addEventListener("click",()=>{


    window.scrollTo({

        top:0,

        behavior:"smooth"

    });


});



/* =====================================================
   PARTICLES BACKGROUND
===================================================== */


if(
typeof tsParticles !== "undefined"
){


tsParticles.load(
"particles-js",
{


    fpsLimit:60,


    particles:{


        number:{


            value:45


        },


        color:{


            value:"#0d6efd"


        },


        links:{


            enable:true,

            distance:150,

            opacity:.15


        },


        move:{


            enable:true,

            speed:1


        },


        size:{


            value:3


        }


    },


    interactivity:{


        events:{


            onHover:{


                enable:true,

                mode:"repulse"


            }


        }


    },


    background:{


        color:"transparent"


    }


});


}



/* =====================================================
   BUTTON RIPPLE EFFECT
===================================================== */


document.querySelectorAll(".btn")
.forEach(button=>{


button.addEventListener(
"click",
function(e){


let ripple =
document.createElement("span");


ripple.style.position="absolute";

ripple.style.borderRadius="50%";

ripple.style.transform="scale(0)";

ripple.style.background=
"rgba(255,255,255,.5)";

ripple.style.width="120px";

ripple.style.height="120px";

ripple.style.left=
e.offsetX-60+"px";

ripple.style.top=
e.offsetY-60+"px";


this.appendChild(ripple);


setTimeout(()=>{

ripple.remove();

},500);



});


});



/* =====================================================
   PAGE READY
===================================================== */


window.addEventListener(
"load",
()=>{


document.body.classList.add(
"loaded"
);


});


/* =====================================================
   CLICK2PAY FINAL PERFORMANCE BOOST
===================================================== */


/* =====================================================
   SAFE ELEMENT CHECK
===================================================== */


function exists(selector){

    return document.querySelector(selector) !== null;

}



/* =====================================================
   NAVBAR SHADOW ON SCROLL
===================================================== */


const nav = document.querySelector(".navbar");


if(nav){


window.addEventListener(
"scroll",
()=>{


if(window.scrollY > 20){

    nav.style.boxShadow =
    "0 10px 40px rgba(0,0,0,.08)";

}

else{

    nav.style.boxShadow="none";

}


},
{
passive:true
});


}



/* =====================================================
   LAZY LOAD IMAGE
===================================================== */


document
.querySelectorAll("img")
.forEach(img=>{


img.setAttribute(
"loading",
"lazy"
);


});



/* =====================================================
   RIPPLE ANIMATION FIX
===================================================== */


document
.querySelectorAll(".btn")
.forEach(btn=>{


btn.style.position="relative";

btn.style.overflow="hidden";


btn.addEventListener(
"click",
function(e){


let circle =
document.createElement("span");


let diameter =
Math.max(
this.clientWidth,
this.clientHeight
);


circle.style.width =
diameter+"px";


circle.style.height =
diameter+"px";


circle.style.position="absolute";


circle.style.borderRadius="50%";


circle.style.background=
"rgba(255,255,255,.35)";


circle.style.left =
e.offsetX -
diameter/2 +"px";


circle.style.top =
e.offsetY -
diameter/2 +"px";


circle.style.transform =
"scale(0)";


circle.style.transition =
"transform .5s, opacity .5s";


this.appendChild(circle);



requestAnimationFrame(()=>{

circle.style.transform="scale(2)";

circle.style.opacity="0";

});



setTimeout(()=>{

circle.remove();

},600);



});


});



/* =====================================================
   AUTO COPYRIGHT YEAR
===================================================== */


const year =
document.querySelector(
"footer p"
);


if(year){

year.innerHTML =
year.innerHTML.replace(
"2026",
new Date().getFullYear()
);

}



/* =====================================================
   DEVICE DETECTION
===================================================== */


const isMobile =
window.matchMedia(
"(max-width:768px)"
).matches;


if(isMobile){

document.body.classList.add(
"mobile-device"
);

}

else{

document.body.classList.add(
"desktop-device"
);

}



/* =====================================================
   PREVENT EMPTY LINKS JUMP
===================================================== */


document
.querySelectorAll('a[href="#"]')
.forEach(link=>{


link.addEventListener(
"click",
e=>{

e.preventDefault();

});


});



/* =====================================================
   CONSOLE BRANDING
===================================================== */


console.log(
"%c Click2Pay ",
"background:#0d6efd;color:white;font-size:20px;padding:10px;border-radius:8px;"
);


console.log(
"Premium Shortlink Platform"
);



/* =====================================================
   OPTIMIZE SCROLL EVENTS
===================================================== */


let ticking=false;


window.addEventListener(
"scroll",
()=>{


if(!ticking){


window.requestAnimationFrame(()=>{


ticking=false;


});


ticking=true;


}


},
{
passive:true
});



/* =====================================================
   ERROR HANDLER
===================================================== */


window.addEventListener(
"error",
function(e){

console.warn(
"Click2Pay Script:",
e.message
);

});
