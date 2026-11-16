
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

(function(){var v=document.getElementById('vv'),b=document.getElementById('snd'),w=document.getElementById('vd');if(!v||!b)return;
b.addEventListener('click',function(){try{v.muted=false;v.currentTime=0;v.loop=false;v.controls=true;var p=v.play();if(p&&p.catch)p.catch(function(){});w.classList.add('on')}catch(e){}});})();

(function(){
var H=document.documentElement,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// titre : mots un par un
var h1=document.querySelector('.hero h1');
if(h1&&H.classList.contains('js')){var i=0;(function walk(n){[].slice.call(n.childNodes).forEach(function(c){if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(w));return}var sp=document.createElement('span');sp.className='hw';sp.textContent=w;sp.style.transitionDelay=(0.08*i++)+'s';f.appendChild(sp)});n.replaceChild(f,c)}else if(c.nodeType===1&&c.tagName!=='SMALL')walk(c);else if(c.nodeType===1){var sp=document.createElement('span');sp.className='hw';sp.style.display='block';sp.style.transitionDelay=(0.08*i++ +.1)+'s';c.parentNode.insertBefore(sp,c);sp.appendChild(c)}})})(h1)}
// barres du tableau de bord : délai en escalier
[].forEach.call(document.querySelectorAll('.ch i,.bars i'),function(b,k){b.style.transitionDelay=(k%9*0.07)+'s'});
[].forEach.call(document.querySelectorAll('#tb .tr'),function(r,k){r.style.transitionDelay=(k*0.06)+'s'});
// compteurs du tableau de bord
function compter(el){var t=el.textContent,m=t.match(/[\d]+(?:[ ,]\d+)*/);if(!m)return;var brut=m[0],dec=brut.indexOf(',')>-1?brut.split(',')[1].length:0,val=parseFloat(brut.replace(/ /g,'').replace(',','.'));var deb=null;function f(ts){if(!deb)deb=ts;var p=Math.min(1,(ts-deb)/1400),e=1-Math.pow(1-p,3),v=(val*e).toFixed(dec).replace('.',',');el.textContent=t.replace(brut,v);if(p<1)requestAnimationFrame(f)}el.textContent=t.replace(brut,(0).toFixed(dec).replace('.',','));requestAnimationFrame(f)}
var kp=[].slice.call(document.querySelectorAll('.kp b'));
if('IntersectionObserver' in window&&!reduce){var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){kp.forEach(compter);io.disconnect()}})},{threshold:.4});var dm=document.querySelector('.dm');if(dm)io.observe(dm)}
// menu qui se resserre, grands mots en parallaxe, ligne des étapes
var nv=document.querySelector('.nv'),bigs=[].slice.call(document.querySelectorAll('.big')),stp=document.querySelector('.stp'),ln=document.getElementById('ln'),sps=[].slice.call(document.querySelectorAll('.sp')),tick=false;
function maj(){tick=false;var y=window.scrollY,vh=window.innerHeight;if(nv)nv.classList.toggle('sc',y>10);
 if(!reduce)bigs.forEach(function(b){var r=b.getBoundingClientRect();if(r.bottom>0&&r.top<vh){var d=(r.top+r.height/2-vh/2)/vh;b.style.transform='translateY('+(d*-40).toFixed(1)+'px) scale('+(1-Math.abs(d)*.06).toFixed(3)+')'}});
 if(stp&&ln){var r=stp.getBoundingClientRect(),mid=vh*.6,h=Math.max(0,Math.min(r.height-80,mid-r.top-40));ln.style.height=h+'px';sps.forEach(function(s){var q=s.getBoundingClientRect();s.classList.toggle('ok',q.top+40<mid)})}}
window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(maj)}},{passive:true});maj();
})();

(function(){
// vidéo : chargée seulement quand on arrive dessus (économie de 4G)
var v=document.getElementById('vv');
if(v){v.addEventListener('contextmenu',function(e){e.preventDefault();});v.controlsList&&v.controlsList.add&&v.controlsList.add('nodownload');v.disablePictureInPicture=true;
var go=function(){if(!v.src){v.src=v.getAttribute('data-src');}var p=v.play();if(p&&p.catch)p.catch(function(){});};
 if('IntersectionObserver' in window){var o=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){go();}else if(v.src&&!v.paused&&v.muted){v.pause();}})},{rootMargin:'200px'});o.observe(v);}else go();
 var sb=document.getElementById('snd');if(sb)sb.addEventListener('click',function(){if(!v.src)v.src=v.getAttribute('data-src');clic('video');},true);}
// compteur de clics pour Pilotage (aucune donnée personnelle)
var URL_='https://hezntpvvsukdlehpbqzs.supabase.co/rest/v1/rpc/noter_clic',K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlem50cHZ2c3VrZGxlaHBicXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTc3OTgsImV4cCI6MjEwOTEzMzc5OH0.aAeqyLr8PY2MlGIP09cLSvJSive3YSTTkFW4zuh0Zk4';
function clic(c){try{fetch(URL_,{method:'POST',keepalive:true,headers:{'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'},body:JSON.stringify({p_cible:c})}).catch(function(){})}catch(e){}}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'',c=a.getAttribute('data-clic');
 if(!c){if(h.indexOf('/inscription')>-1)c='inscription';else if(h.indexOf('/connexion')>-1)c='connexion';else if(h.indexOf('wa.me')>-1)return;}
 if(c)clic(c);},true);
})();

(function(){
// Bouton WhatsApp : choisir entre rejoindre la chaîne et écrire à l'équipe (les boutons « démo » vont directement à la discussion).
var w=document.getElementById('wsh');if(!w)return;
function fermer(){w.classList.remove('on')}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a||w.contains(a))return;var h=a.getAttribute('href')||'';
 if(h.indexOf('wa.me')>-1&&a.getAttribute('data-clic')!=='demo'){e.preventDefault();w.classList.add('on');}},true);
w.addEventListener('click',function(e){if(e.target===w)fermer();});
document.getElementById('wshx').addEventListener('click',fermer);
w.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setTimeout(fermer,300)});});
document.addEventListener('keydown',function(e){if(e.key==='Escape')fermer();});
})();
