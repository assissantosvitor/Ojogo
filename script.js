/* Combo Clicker
   - Power aumenta com o combo de cliques (cliques rápidos geram multiplicador temporário)
   - Upgrades permanentes escalam com o multiplicador atual
   - Salvar/Carregar no localStorage
*/

(() => {
  // estado
  const state = {
    count: 0,
    totalClicks: 0,
    perClickBase: 1,        // valor base por clique
    perSec: 0,
    combo: 0,               // contagem de cliques consecutivos
    comboTimer: null,
    comboMultiplier: 1,     // multiplicador atual
    bestCombo: 1,
    progress: 0,
    upgrades: [
      { id:'auto', name:'Auto Clicker', baseCost:50, qty:0, cps:1 },
      { id:'power', name:'Power Core', baseCost:200, qty:0, bonus:1.5 }
    ]
  };

  // DOM
  const countEl = document.getElementById('count');
  const perClickEl = document.getElementById('perClick');
  const perSecEl = document.getElementById('perSec');
  const comboText = document.getElementById('comboText');
  const comboMeter = document.getElementById('comboMeter');
  const bestComboEl = document.getElementById('bestCombo');
  const totalClicksEl = document.getElementById('totalClicks');
  const upgradesEl = document.getElementById('upgrades');
  const logEl = document.getElementById('log');
  const clicker = document.getElementById('clicker');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  // helpers
  const fmt = n => Math.floor(n).toLocaleString('pt-BR');
  const costFor = u => Math.floor(u.baseCost * Math.pow(1.18, u.qty));

  // render upgrades
  function renderUpgrades(){
    upgradesEl.innerHTML = '';
    state.upgrades.forEach(u => {
      const cost = costFor(u);
      const div = document.createElement('div');
      div.className = 'upgrade';
      div.innerHTML = `
        <div>
          <div style="font-weight:700">${u.name}</div>
          <div style="font-size:13px;color:var(--muted)">${u.cps ? u.cps+' cps' : 'x'+u.bonus+' power'}</div>
          <div style="font-size:12px;color:var(--muted)">Quantidade: ${u.qty}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${fmt(cost)}</div>
          <button ${state.count < cost ? 'disabled' : ''} data-id="${u.id}">Comprar</button>
        </div>
      `;
      upgradesEl.appendChild(div);
    });
    upgradesEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => buyUpgrade(b.dataset.id));
    });
  }

  // calcular perClick atual (base * multiplicadores permanentes * combo)
  function getPerClick(){
    let base = state.perClickBase;
    // aplicar upgrades permanentes que aumentam power
    const powerUp = state.upgrades.find(u => u.id === 'power');
    if(powerUp && powerUp.qty > 0){
      base *= Math.pow(powerUp.bonus, powerUp.qty);
    }
    // aplicar combo multiplier
    return Math.floor(base * state.comboMultiplier);
  }

  // atualizar UI
  function updateUI(){
    countEl.textContent = fmt(state.count);
    perClickEl.textContent = '+' + fmt(getPerClick());
    perSecEl.textContent = fmt(state.perSec);
    comboText.textContent = 'Combo x' + state.comboMultiplier.toFixed(2);
    comboMeter.style.width = Math.min(100, state.combo / 20 * 100) + '%';
    bestComboEl.textContent = 'x' + state.bestCombo.toFixed(2);
    totalClicksEl.textContent = fmt(state.totalClicks);
    progressFill.style.width = Math.min(100, Math.floor(state.progress)) + '%';
    progressLabel.textContent = Math.min(100, Math.floor(state.progress)) + '%';
    renderUpgrades();
  }

  // comprar upgrade
  function buyUpgrade(id){
    const u = state.upgrades.find(x => x.id === id);
    const cost = costFor(u);
    if(state.count < cost) return;
    state.count -= cost;
    u.qty++;
    // aplicar efeitos imediatos
    if(u.id === 'auto'){
      state.perSec += u.cps;
    }
    log(`Comprou ${u.name} x${u.qty}`);
    updateUI();
  }

  // log simples
  function log(text){
    const el = document.createElement('div');
    el.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    logEl.prepend(el);
    // manter só últimas 50 linhas
    while(logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
  }

  // clique principal
  clicker.addEventListener('click', (e) => {
    // incrementar combo
    incrementCombo();

    // calcular ganho
    const gain = getPerClick();
    state.count += gain;
    state.totalClicks++;
    state.progress += gain * 0.0005;

    // efeitos visuais
    spawnRipple(e);
    spawnParticles(e.clientX, e.clientY);
    spawnFloating('+' + fmt(gain), e.clientX, e.clientY);

    updateUI();
  });

  // incrementar combo: cada clique reinicia timer; combo cresce se cliques rápidos
  function incrementCombo(){
    state.combo++;
    // comboMultiplier cresce com a raiz quadrada do combo e com upgrades de power
    state.comboMultiplier = 1 + Math.sqrt(state.combo) * 0.08;
    if(state.comboMultiplier > state.bestCombo) state.bestCombo = state.comboMultiplier;
    // reset timer: se não clicar por 1.2s, combo zera
    if(state.comboTimer) clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(() => {
      state.combo = 0;
      state.comboMultiplier = 1;
      updateUI();
    }, 1200);
  }

  // auto increment por segundo
  setInterval(() => {
    if(state.perSec > 0){
      state.count += state.perSec;
      state.progress += state.perSec * 0.001;
      updateUI();
    }
  }, 1000);

  // ripple visual
  function spawnRipple(e){
    const layer = document.getElementById('ripple-layer');
    const rect = clicker.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = document.createElement('span');
    r.style.position = 'absolute';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.width = r.style.height = '20px';
    r.style.borderRadius = '50%';
    r.style.transform = 'translate(-50%,-50%) scale(0)';
    r.style.background = 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(124,58,237,0.12))';
    r.style.pointerEvents = 'none';
    r.style.opacity = '0.95';
    r.style.transition = 'transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms';
    layer.appendChild(r);
    requestAnimationFrame(()=> {
      r.style.transform = 'translate(-50%,-50%) scale(6)';
      r.style.opacity = '0';
    });
    setTimeout(()=> r.remove(), 600);
  }

  // partículas pequenas no clique
  function spawnParticles(x, y){
    for(let i=0;i<10;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = ['#7c3aed','#06b6d4','#ffd166'][Math.floor(Math.random()*3)];
      document.body.appendChild(p);
      const dx = (Math.random()-0.5) * 200;
      const dy = (Math.random()-0.8) * 200;
      const dur = 600 + Math.random()*500;
      p.animate([
        { transform: 'translate(0,0) scale(1)', opacity:1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity:0 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.9,.2,1)'});
      setTimeout(()=> p.remove(), dur+50);
    }
  }

  // texto flutuante
  function spawnFloating(text, x, y){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = 'translate(-50%,-50%)';
    el.style.color = '#fff';
    el.style.fontWeight = '800';
    el.style.zIndex = 9999;
    el.style.pointerEvents = 'none';
    el.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
    document.body.appendChild(el);
    requestAnimationFrame(()=> {
      el.style.transform = 'translate(-50%,-140%)';
      el.style.opacity = '0';
    });
    setTimeout(()=> el.remove(), 1000);
  }

  // salvar / carregar / reset
  document.getElementById('save').addEventListener('click', () => {
    localStorage.setItem('combo_clicker_save', JSON.stringify(state));
    log('Jogo salvo');
  });
  document.getElementById('load').addEventListener('click', () => {
    const s = localStorage.getItem('combo_clicker_save');
    if(!s){ log('Nenhum save encontrado'); return; }
    try {
      const loaded = JSON.parse(s);
      // mesclar campos essenciais
      state.count = loaded.count ?? state.count;
      state.totalClicks = loaded.totalClicks ?? state.totalClicks;
      state.perClickBase = loaded.perClickBase ?? state.perClickBase;
      state.perSec = loaded.perSec ?? state.perSec;
      state.combo = 0;
      state.comboMultiplier = 1;
      if(loaded.upgrades && Array.isArray(loaded.upgrades)){
        loaded.upgrades.forEach(lu => {
          const u = state.upgrades.find(x=>x.id===lu.id);
          if(u) u.qty = lu.qty ?? u.qty;
        });
      }
      log('Save carregado');
      updateUI();
    } catch(e){
      log('Erro ao carregar save');
    }
  });
  document.getElementById('reset').addEventListener('click', () => {
    if(!confirm('Resetar o jogo?')) return;
    localStorage.removeItem('combo_clicker_save');
    location.reload();
  });

  // inicializar upgrades UI
  renderUpgrades();
  updateUI();

  // canvas de fundo sutil
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext && canvas.getContext('2d');
  function resizeCanvas(){ if(!ctx) return; canvas.width = innerWidth; canvas.height = innerHeight; }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if(ctx){
    const particles = Array.from({length: Math.max(40, Math.floor(innerWidth/30))}, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*2.2+0.6,
      vx: (Math.random()-0.5)*0.2,
      vy: (Math.random()-0.5)*0.2,
      hue: 220 + Math.random()*80,
      a: 0.06 + Math.random()*0.18
    }));
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const p of particles){
        p.x += p.vx; p.y += p.vy;
        if(p.x < -10) p.x = canvas.width + 10;
        if(p.x > canvas.width + 10) p.x = -10;
        if(p.y < -10) p.y = canvas.height + 10;
        if(p.y > canvas.height + 10) p.y = -10;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // atalho teclado: espaço para clicar
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space'){ e.preventDefault(); clicker.click(); }
  });

})();
