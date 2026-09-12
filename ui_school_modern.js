/* Sapientia — dashboard fiel à prévia escolhida */
(() => {
  const palette=[['🏛️','#2f80ed'],['📄','#00a896'],['👥','#ff7f32'],['📦','#8b5cf6'],['🖥️','#ff5364'],['⚖️','#f5b51b'],['🔤','#ec5ca8'],['🧠','#48b89f']];
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  function rawStats(){return parse(localStorage.getItem('quizStats')||localStorage.getItem('stats')||'{}',{});}
  function calc(){const s=rawStats();let a=0,c=0;Object.values(s).forEach(v=>{if(v&&typeof v==='object'){a+=Number(v.attempts||v.total||0);c+=Number(v.correct||0)}});return{attempts:a,correct:c,pct:a?Math.round(c/a*100):0};}
  function reorderTop(){const nav=$('nav'),header=$('header');if(nav&&header&&nav.nextElementSibling!==header) document.body.insertBefore(nav,header);}
  function topbar(){const nav=$('nav');if(!nav||$('.school-brand',nav))return;const inr=$('.navin',nav)||nav;const brand=document.createElement('div');brand.className='school-brand';brand.innerHTML='<div class="brand-mark">🎓</div><div><strong>SAPIENTIA</strong><small>CONHECIMENTO TRANSFORMA</small></div>';inr.prepend(brand);
    const search=document.createElement('div');search.className='top-search';search.innerHTML='<input placeholder="Buscar tema ou questão..." aria-label="Buscar tema ou questão"><span>⌕</span>';inr.appendChild(search);
    const profile=document.createElement('div');profile.className='student-profile';profile.innerHTML='<div class="avatar">👤</div><div><b>Olá, Concurseiro!</b><small>Foco hoje, resultado amanhã!</small></div>';inr.appendChild(profile);
  }
  function hero(){const host=$('header .wrap');if(!host||$('.dashboard-hero'))return;host.innerHTML='';const d=document.createElement('div');d.className='dashboard-hero';d.innerHTML=`
    <div class="hero-copy">
      <h1>Disciplina hoje,<br><span>conquistas amanhã.</span></h1>
      <p>Questões, conhecimento e evolução para o seu sucesso no concurso da Prefeitura de Itajaí/SC.</p>
      <div class="hero-actions">
        <button onclick="document.querySelector('#themes')?.scrollIntoView({behavior:'smooth'})">▶ Continuar estudando</button>
        <button class="ghost">▣ Fazer simulado</button>
        <button class="ghost" onclick="showStats()">▥ Ver minhas estatísticas</button>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="chalk">☆<br><span>SONHE<br>ESTUDE<br>EVOLUA<br>CONQUISTE ☺</span></div>
      <div class="book b1">FOCO</div><div class="book b2">ESTUDO</div><div class="book b3">PLANEJAMENTO</div><div class="book b4">DISCIPLINA</div><div class="book b5">RESULTADO</div>
      <div class="pencils">✏️ ✒️</div><div class="plant">🪴</div><div class="sticky">VOCÊ<br>CONSEGUE!<br>☺</div>
    </div>`;host.appendChild(d);}
  function metrics(){const home=$('#home');if(!home||$('.metric-strip'))return;const m=calc();const q=typeof DATA!=='undefined'?DATA.length:0;const strip=document.createElement('div');strip.className='metric-strip';strip.innerHTML=`
    <div class="metric-card"><span class="metric-icon">🎯</span><div><b>${q}</b><small>Questões no banco</small></div></div>
    <div class="metric-card"><span class="metric-icon">▥</span><div><b>${m.pct}%</b><small>Média de acertos</small></div></div>
    <div class="metric-card"><span class="metric-icon">🔥</span><div><b>${Number(localStorage.getItem('sapientia_streak')||0)}</b><small>Dias seguidos</small></div></div>
    <div class="metric-card"><span class="metric-icon">🏆</span><div><b>${Number(localStorage.getItem('sapientia_simulados')||0)}</b><small>Simulados realizados</small></div></div>
    <div class="metric-quote">❝ <i>O esforço de hoje<br>é o resultado de amanhã.</i></div>`;home.prepend(strip);}
  function layout(){const home=$('#home'),themes=$('#themes');if(!home||!themes||$('.home-dashboard'))return;home.querySelector('.card')?.remove();const title=document.createElement('div');title.className='study-title';title.innerHTML='<div><h2>📖 Escolha um tema para estudar</h2></div><div class="theme-search"><input id="themeSearch" placeholder="Buscar tema..." aria-label="Buscar tema"><span>⌕</span></div>';themes.parentNode.insertBefore(title,themes);
    const shell=document.createElement('div');shell.className='home-dashboard';const left=document.createElement('section');left.className='dashboard-main';const right=document.createElement('aside');right.className='dashboard-side';themes.parentNode.insertBefore(shell,themes);shell.append(left,right);left.append(title,themes);
    const m=calc(), streak=Number(localStorage.getItem('sapientia_streak')||0);right.innerHTML=`
      <div class="side-card sequence"><div class="side-head"><h3>📅 Sua sequência de estudos</h3><b>🔥 ${streak}<small> dias<br>seguidos</small></b></div><div class="week"><span class="done">✓<small>Seg</small></span><span class="done">✓<small>Ter</small></span><span class="done">✓<small>Qua</small></span><span class="done">✓<small>Qui</small></span><span class="done">✓<small>Sex</small></span><span>○<small>Sáb</small></span><span>○<small>Dom</small></span></div></div>
      <div class="side-card goal"><div class="side-head"><h3>🎯 Seu objetivo</h3><span class="target">🎯</span></div><p>Concurso Prefeitura de Itajaí/SC</p><div class="goal-row"><div class="goalbar"><i style="width:${m.pct}%"></i></div><b>${m.pct}%</b></div><small>Cada questão resolvida é um passo mais perto da sua aprovação!</small></div>
      <div class="side-card tip"><div><h3>💡 Dica do dia</h3><p>“Não estude até cansar.<br>Estude até entender.”</p></div><div class="tip-art">📚<span>ESTUDO<br>HOJE<br>CONQUISTA<br>AMANHÃ ☺</span></div></div>`;
    const quick=document.createElement('div');quick.className='quick-actions';quick.innerHTML='<button>▣ <span><b>Simulado Completo</b><small>Todas as matérias</small></span></button><button>🎯 <span><b>Revisar meus erros</b><small>Foque no que precisa melhorar</small></span></button><button onclick="showStats()">▥ <span><b>Estatísticas detalhadas</b><small>Acompanhe sua evolução</small></span></button><button>⭐ <span><b>Questões favoritas</b><small>Revise suas questões marcadas</small></span></button>';left.appendChild(quick);
    $('#themeSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('#themes .theme').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?'':'none')});
  }
  function cards(){ $$('#themes .theme').forEach((card,i)=>{const[icon,color]=palette[i%palette.length];card.style.setProperty('--theme-color',color);if(!$('.theme-icon',card)){const el=document.createElement('div');el.className='theme-icon';el.textContent=icon;card.prepend(el)}const pct=Math.max(0,Math.min(100,Math.round((i?64-i*2:72))));let progress=$('.theme-progress',card);if(!progress){progress=document.createElement('div');progress.className='theme-progress';progress.innerHTML=`<span style="width:${pct}%"></span>`;card.appendChild(progress)}if(!$('.theme-pct',card)){const p=document.createElement('div');p.className='theme-pct';p.textContent=pct+'%';progress.insertAdjacentElement('afterend',p)}if(!$('.study-now',card)){const b=document.createElement('span');b.className='study-now';b.textContent='Estudar agora  →';card.appendChild(b)}});}
  function run(){reorderTop();topbar();hero();metrics();layout();cards();const s=$('#count');if(s&&!s.getAttribute('aria-label'))s.setAttribute('aria-label','Quantidade de questões do treino');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(cards);const t=$('#themes');if(t)obs.observe(t,{childList:true});
})();