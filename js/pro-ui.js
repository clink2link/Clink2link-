
"use strict";
(function(){
  const key="c2p-floating-position";
  const $=s=>document.querySelector(s);
  function theme(){
    const saved=localStorage.getItem("theme");
    const t=saved==="dark"||saved==="light"?saved:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
    document.documentElement.classList.toggle("dark",t==="dark");
    document.body?.classList.toggle("dark",t==="dark");
    document.querySelectorAll("[data-theme-icon]").forEach(i=>{
      i.classList.toggle("fa-moon",t!=="dark");i.classList.toggle("fa-sun",t==="dark");
    });
    return t;
  }
  function setTheme(t){localStorage.setItem("theme",t);theme();window.dispatchEvent(new CustomEvent("c2p:theme",{detail:{theme:t}}));}
  function lang(l){
    if(window.c2pLanguage?.setLanguage){window.c2pLanguage.setLanguage(l);return;}
    if(window.C2P?.setLanguage){window.C2P.setLanguage(l);return;}
    localStorage.setItem("language",l); document.documentElement.lang=l;
  }
  function makeControls(){
    if(document.getElementById("c2pFloatingControls")) return;
    const box=document.createElement("div"); box.id="c2pFloatingControls";
    box.innerHTML='<span class="drag" title="Drag">⋮⋮</span><button data-lang="en">EN</button><button data-lang="id">ID</button><button class="theme-btn" title="Theme"><i data-theme-icon class="fa-solid fa-moon"></i></button>';
    document.body.appendChild(box);
    const saved=localStorage.getItem("language")||"en";
    box.querySelectorAll("[data-lang]").forEach(b=>{b.classList.toggle("active",b.dataset.lang===saved);b.onclick=()=>{lang(b.dataset.lang);box.querySelectorAll("[data-lang]").forEach(x=>x.classList.toggle("active",x===b));}});
    box.querySelector(".theme-btn").onclick=()=>setTheme(theme()==="dark"?"light":"dark");
    const pos=JSON.parse(localStorage.getItem(key)||"null");
    if(pos?.left!=null&&pos?.top!=null){box.style.left=pos.left+"px";box.style.top=pos.top+"px";box.style.right="auto";box.style.bottom="auto";}
    const handle=box.querySelector(".drag"); let drag=false,sx=0,sy=0,sl=0,st=0;
    const start=e=>{drag=true;box.classList.add("is-dragging");const p=e.touches?e.touches[0]:e;sx=p.clientX;sy=p.clientY;const r=box.getBoundingClientRect();sl=r.left;st=r.top;e.preventDefault();};
    const move=e=>{if(!drag)return;const p=e.touches?e.touches[0]:e;let l=sl+p.clientX-sx,t=st+p.clientY-sy;l=Math.max(4,Math.min(innerWidth-box.offsetWidth-4,l));t=Math.max(4,Math.min(innerHeight-box.offsetHeight-4,t));box.style.left=l+"px";box.style.top=t+"px";box.style.right="auto";box.style.bottom="auto";};
    const end=()=>{if(!drag)return;drag=false;box.classList.remove("is-dragging");const r=box.getBoundingClientRect();localStorage.setItem(key,JSON.stringify({left:r.left,top:r.top}));};
    handle.addEventListener("mousedown",start);addEventListener("mousemove",move);addEventListener("mouseup",end);
    handle.addEventListener("touchstart",start,{passive:false});addEventListener("touchmove",move,{passive:false});addEventListener("touchend",end);
  }
  function init(){theme();makeControls();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.addEventListener("storage",e=>{if(e.key==="theme")theme();if(e.key==="language"){document.documentElement.lang=e.newValue||"en";}});
  window.C2PPro={theme,setTheme,lang};
})();
