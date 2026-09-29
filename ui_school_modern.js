/* Sapientia — reprodução fiel do dashboard escolhido */
(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const palette=[['🏛️','#2f80ed'],['📄','#12b8a6'],['👥','#ff823d'],['📦','#8754e8'],['🖥️','#ff5365'],['⚖️','#f3b71f'],['🔤','#ec5aa4'],['🧠','#44bd9b']];
  const safe=(v,f={})=>{try{return JSON.parse(v)||f}catch{return f}};
  window.showUpcoming=(feature)=>alert(`${feature} estará disponível em uma próxima atualização.`);
  function aggregate(){const s=safe(localStorage.getItem('itajai2026_stats')||'{}');let attempts=0,total=0,correct=0;Object.values(s).forEach(v=>{if(v&&typeof v==='object'){attempts+=Number(v.attempts||0);total+=Number(v.total||0);correct+=Number(v.correct||0)}});return{attempts,total,correct,pct:total?Math.round(correct/total*100):0};}
  function buildTopbar(){const nav=$('nav'),header=$('header');if(!nav||!header||$('.sap-topbar'))return;header.before(nav);nav.innerHTML=`<div class="sap-topbar"><div class="sap-brand" onclick="showHome()"><span class="sap-cap">🎓</span><span><b>SAPIENTIA</b><small>CONHECIMENTO TRANSFORMA</small></span></div><div class="sap-menu"><button class="active" onclick="showHome()">⌂<small>Início</small></button><button onclick="document.querySelector('#themes')?.scrollIntoView({behavior:'smooth'})">▣<small>Temas</small></button><button onclick="showUpcoming('Simulados')">▥<small>Simulados</small></button><button onclick="showStats()">▥<small>Estatísticas</small></button><button onclick="showUpcoming('Meus erros')">◎<small>Meus erros</small></button><button onclick="showUpcoming('Favoritos')">★<small>Favoritos</small></button><button onclick="document.querySelector('footer')?.scrollIntoView({behavior:'smooth'})">ⓘ<small>Sobre</small></button></div><div class="sap-tools"><label class="global-search">⌕<input id="globalSearch" placeholder="Buscar tema..."></label><button class="moon" type="button" aria-label="Modo escuro — em desenvolvimento" onclick="showUpcoming('Modo escuro')">☾</button><div class="sap-profile"><span class="avatar">👤</span><span><b>Olá, Concurseiro!</b><small>Foco hoje, resultado amanhã!</small></span></div></div></div>`;$('#globalSearch')?.addEventListener('input',e=>{showHome();const q=e.target.value.toLowerCase();$$('#themes .theme').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?'':'none')});}
  function buildHero(){const wrap=$('header .wrap');if(!wrap||$('.dashboard-hero'))return;wrap.innerHTML=`<div class="dashboard-hero"><div class="hero-copy"><h1>Disciplina hoje,<br><span>conquistas amanhã.</span></h1><p>Questões, conhecimento e evolução para o seu sucesso<br>no concurso da Prefeitura de Itajaí/SC.</p><div class="hero-actions"><button onclick="document.querySelector('#themes')?.scrollIntoView({behavior:'smooth'})">▶ &nbsp; Continuar estudando</button><button class="ghost" onclick="showUpcoming('Simulado completo')">▣ &nbsp; Fazer simulado</button><button class="ghost" onclick="showStats()">▥ &nbsp; Ver minhas estatísticas</button></div></div><div class="hero-art"><div class="chalk">☆<br><span>SONHE<br>ESTUDE<br>EVOLUA<br>CONQUISTE</span></div><div class="bookstack"><div class="book b1">FOCO</div><div class="book b2">ESTUDO</div><div class="book b3">PLANEJAMENTO</div><div class="book b4">DISCIPLINA</div><div class="book b5">RESULTADO</div></div><div class="pencils">✎ ✎</div><div class="sticky">VOCÊ<br>CONSEGUE!<br><span>☺</span></div><div class="plant">🌿</div></div></div>`;}
  function buildMetrics(){const home=$('#home');if(!home||$('.metric-band'))return;const a=aggregate(),q=typeof DATA!=='undefined'?DATA.length:0;const el=document.createElement('div');el.className='metric-band';el.innerHTML=`<div class="metric-card"><i class="mi green">◎</i><div><b>${q}</b><small>Questões no banco</small></div></div><div class="metric-card"><i class="mi blue">▥</i><div><b>${a.pct}%</b><small>Média de acertos</small></div></div><div class="metric-card"><i class="mi orange">🔥</i><div><b>${Number(localStorage.getItem('sapientia_streak')||0)}</b><small>Dias seguidos</small></div></div><div class="metric-card"><i class="mi purple">🏆</i><div><b>${Number(localStorage.getItem('sapientia_simulados')||0)}</b><small>Simulados realizados</small></div></div><div class="metric-quote">❝ <em>“O esforço de hoje<br>é o resultado de amanhã.”</em></div>`;home.prepend(el);}
  function buildHome(){const home=$('#home'),themes=$('#themes');if(!home||!themes||$('.home-dashboard'))return;const intro=home.querySelector('.card');if(intro)intro.remove();const shell=document.createElement('div');shell.className='home-dashboard';const main=document.createElement('div');main.className='dashboard-main';const side=document.createElement('aside');side.className='dashboard-side';const title=document.createElement('div');title.className='study-title';title.innerHTML=`<div><h2>📖 Escolha um tema para estudar</h2></div><label class="theme-search">⌕<input id="themeSearch" placeholder="Buscar tema..."></label>`;home.append(shell);shell.append(main,side);main.append(title,themes);const a=aggregate();side.innerHTML=`<div class="side-card sequence"><h3>📅 Sua sequência de estudos</h3><p class="note">Sequência automática em desenvolvimento.</p></div><div class="side-card goal"><h3>🎯 Seu objetivo</h3><p>Concurso Prefeitura de Itajaí/SC</p><div class="goal-row"><div class="goalbar"><i style="width:${a.pct}%"></i></div><b>${a.pct}%</b></div><small>Cada questão resolvida é um passo mais perto da sua aprovação!</small><span class="target">🎯</span></div><div class="side-card tip"><h3>💡 Dica do dia</h3><p>“Não estude até cansar.<br>Estude até entender.”</p><span class="mini-books">📚</span><span class="mini-note">ESTUDO<br>HOJE =<br>CONQUISTA<br>AMANHÃ ☺</span></div>`;const quick=document.createElement('div');quick.className='quick-actions';quick.innerHTML=`<button onclick="showUpcoming('Simulado completo')"><i>▣</i><span><b>Simulado Completo</b><small>Em desenvolvimento</small></span></button><button onclick="showUpcoming('Revisão de erros')"><i>◎</i><span><b>Revisar meus erros</b><small>Em desenvolvimento</small></span></button><button onclick="showStats()"><i>▥</i><span><b>Estatísticas detalhadas</b><small>Acompanhe sua evolução</small></span></button><button onclick="showUpcoming('Questões favoritas')"><i>★</i><span><b>Questões favoritas</b><small>Em desenvolvimento</small></span></button>`;main.appendChild(quick);$('#themeSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('#themes .theme').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?'':'none')});}
  function enhanceCards(){ $$('#themes .theme').forEach((card,i)=>{const[icon,color]=palette[i%palette.length];card.style.setProperty('--theme-color',color);if(!$('.theme-icon',card)){const x=document.createElement('div');x.className='theme-icon';x.textContent=icon;card.prepend(x)}if(!$('.theme-progress',card)){const p=document.createElement('div');p.className='theme-progress';const txt=card.textContent.match(/(\d+)%/);const pct=txt?Number(txt[1]):0;p.innerHTML=`<span style="width:${pct}%"></span>`;card.appendChild(p)}if(!$('.study-now',card)){const b=document.createElement('span');b.className='study-now';b.textContent='Estudar agora  →';card.appendChild(b)}});}
  function enhanceFooter(){const f=$('footer');if(!f||$('.footer-inner',f))return;f.innerHTML=`<div class="footer-inner"><div><b>🎓 &nbsp; SAPIENTIA</b><span>Concurso Itajaí/SC</span><span>Conhecimento hoje. Servir amanhã.</span></div><div><span>❤ &nbsp; Itajaí/SC</span><span>Versão 1.0</span></div></div>`;}
  function run(){buildTopbar();buildHero();buildMetrics();buildHome();enhanceCards();enhanceFooter();const s=$('#count');if(s&&!s.getAttribute('aria-label'))s.setAttribute('aria-label','Quantidade de questões do treino');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(enhanceCards);const t=$('#themes');if(t)obs.observe(t,{childList:true});
})();

/* D1 integration: substitui o banco embutido no momento do treino, com fallback automático. */
(() => {
  const legacyStart = window.startQuiz;
  const legacyAnswer = window.answer;
  const sessionId = sessionStorage.getItem('sapientia_session') || crypto.randomUUID();
  sessionStorage.setItem('sapientia_session', sessionId);

  window.startQuiz = async function(t) {
    const count = Number(document.getElementById('count')?.value || 40);
    try {
      const r = await fetch(`/api/perguntas?tema=${encodeURIComponent(t)}&limite=${count}`, {cache:'no-store'});
      if (!r.ok) throw new Error('API indisponível');
      const rows = await r.json();
      if (!Array.isArray(rows) || !rows.length) throw new Error('Sem questões no D1');
      currentTheme=t; selectedCount=count;
      quiz=rows.map(q=>({
        id:q.id, theme:q.tema, q:q.pergunta,
        explanation:q.explicacao||'', basis:q.base||'',
        shuffled:shuffle(q.opcoes.map((o,ordem)=>({texto:o.texto, originalIndex:Number.isInteger(o.ordem)?o.ordem:ordem})))
      }));
      pos=0; score=0; answered=false;
      document.getElementById('home').style.display='none';
      document.getElementById('stats').classList.add('hidden');
      document.getElementById('result').style.display='none';
      document.getElementById('quiz').style.display='block';
      document.getElementById('themeName').textContent=THEMES[t]?.name||`Tema ${t}`;
      renderQuestionD1();
    } catch(e) {
      console.warn('D1 indisponível; usando banco local.', e);
      legacyStart(t);
    }
  };

  function renderQuestionD1(){
    const q=quiz[pos]; answered=false;
    document.getElementById('counter').textContent=`Questão ${pos+1} de ${quiz.length}`;
    document.getElementById('liveScore').textContent=`Pontos: ${score}`;
    document.getElementById('bar').style.width=((pos/quiz.length)*100)+'%';
    document.getElementById('question').textContent=q.q;
    const box=document.getElementById('options'); box.innerHTML='';
    q.shuffled.forEach((opt,i)=>{const b=document.createElement('button');b.className='option';b.innerHTML=`<span class="letter">${String.fromCharCode(65+i)}</span>${escapeHtml(opt.texto)}`;b.onclick=()=>answerD1(b,opt);box.appendChild(b);});
    const fb=document.getElementById('feedback');fb.className='feedback';fb.style.display='none';fb.innerHTML='';
    document.getElementById('next').disabled=true;document.getElementById('next').textContent=pos===quiz.length-1?'Ver resultado':'Próxima';
  }

  async function answerD1(btn,opt){
    if(answered)return; answered=true;
    const q=quiz[pos], buttons=[...document.querySelectorAll('.option')];buttons.forEach(b=>b.disabled=true);
    try{
      const r=await fetch('/api/validar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.id,respostaUsuario:opt.originalIndex,sessaoId:sessionId})});
      const result=await r.json(); if(!r.ok)throw new Error(result.error||'Falha na validação');
      if(result.correta){score++;btn.classList.add('correct');}else{btn.classList.add('wrong');const correctOpt=q.shuffled.find(x=>x.originalIndex===result.indiceCorreto);const visualIndex=q.shuffled.indexOf(correctOpt);if(visualIndex>=0)buttons[visualIndex].classList.add('correct');}
      const correctOpt=q.shuffled.find(x=>x.originalIndex===result.indiceCorreto);
      const fb=document.getElementById('feedback');fb.style.display='block';fb.classList.add(result.correta?'ok':'bad');fb.innerHTML=`<strong>${result.correta?'✓ Resposta correta':'✗ Resposta incorreta'}</strong><div><b>Alternativa correta:</b> ${escapeHtml(correctOpt?.texto||'')}</div><div style="margin-top:7px"><b>Fundamentação:</b> ${escapeHtml(result.explicacao||'')}</div><div class="note" style="margin-top:7px"><b>Base:</b> ${escapeHtml(result.base||'')}</div>`;
      document.getElementById('liveScore').textContent=`Pontos: ${score}`;document.getElementById('next').disabled=false;
    }catch(e){answered=false;buttons.forEach(b=>b.disabled=false);alert('Não foi possível validar a resposta no banco. Tente novamente.');}
  }

  const legacyNext=window.nextQuestion;
  window.nextQuestion=function(){if(!answered)return;if(quiz[pos]?.shuffled?.[0]&&typeof quiz[pos].shuffled[0]==='object'){if(pos<quiz.length-1){pos++;renderQuestionD1();}else finishQuiz();}else legacyNext();};
})();
