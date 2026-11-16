
const T=[["Jusqu'à 100 élèves",28000,224000],["101 à 200 élèves",36000,288000],["201 à 300 élèves",44000,352000],["301 à 400 élèves",52000,416000],["401 à 500 élèves",60000,480000],["501 à 700 élèves",72000,576000],["701 à 1 000 élèves",88000,704000]];
const TAUX=15.72;let d='GNF',p='m';
const f=n=>{if(d==='GNF')n=Math.round(n*TAUX/1000)*1000;return n.toLocaleString('fr-FR').replace(/ | /g,' ')};
function R(){const u=p==='m'?'/ mois':'/ an';let h='<div class="tr"><span>Taille de l\'école</span><span class="m2">Prix normal</span><span>Offre de lancement</span></div>';for(const[n,m,a]of T){const v=p==='m'?m:a;h+=`<div class="tr"><span class="n">${n}</span><span class="m2"><s>${f(v)} ${d}</s></span><span><span class="px">${f(v/2)}<small>${d} ${u}</small></span><span class="rm">−50 %</span></span></div>`}document.getElementById('tb').innerHTML=h}
document.querySelectorAll('.sg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));if(b.dataset.d)d=b.dataset.d;if(b.dataset.p)p=b.dataset.p;R()}));R();

(function(){const H=document.documentElement,ic=document.getElementById('thi');
const SUN='<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',MOON='<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>';
function th(t){H.setAttribute('data-theme',t);ic.innerHTML=t==='dark'?SUN:MOON;try{localStorage.setItem('sc_theme',t)}catch(e){}}
let t0='light';try{t0=localStorage.getItem('sc_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}th(t0);
document.getElementById('th').addEventListener('click',()=>th(H.getAttribute('data-theme')==='dark'?'light':'dark'));
const M=document.getElementById('mnu');document.getElementById('mb').addEventListener('click',()=>M.classList.toggle('on'));M.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>M.classList.remove('on')));})();

(function(){var H=document.documentElement;if(!('IntersectionObserver' in window))return;H.classList.add('js');
var sel='.hero .pill,.hero h1,.hero p,.hero .ac,.dm,.chk span,.big,.card>.ey,.card>h2,.card>.sb,.bx,.sp,.dk .ey,.dk h2,.dk .sb,.phz,.gc,.sn>div,.tb,.mq,.fm,.fq details,.cta,footer .gr>div';
var els=[].slice.call(document.querySelectorAll(sel));
els.forEach(function(e){e.classList.add('rvl');var p=e.parentElement,sib=[].slice.call(p.children).filter(function(x){return x.matches(sel)});var i=sib.indexOf(e);if(i>0)e.style.transitionDelay=Math.min(i,5)*90+'ms'});
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('vu');io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
els.forEach(function(e){io.observe(e)});
setTimeout(function(){document.querySelectorAll('.hero .rvl').forEach(function(e){e.classList.add('vu')})},50);
})();
