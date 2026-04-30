/* Stimulation Clicker — Visual e Efeitos */
(() => {
  // Estado do jogo
  const state = {
    count: 0,
    perClick: 1,
    perSec: 0,
    spent: 0,
    upgrades: [
      { id:'auto1', name:'Auto Clicker', baseCost:25, cps:1, qty:0 },
      { id:'multi1', name:'Multiplier', baseCost:100, mult:2, qty:0 },
      { id:'auto2', name:'Auto Clicker II', baseCost:500, cps:10, qty:0 },
      { id:'memeBoost', name:'Meme Hype', baseCost:1200, mult:5, qty:0 }
    ],
    achievements: [],
    progress: 0
  };

  // DOM
  const countEl = document.getElementById('count');
  const perClickEl = document.getElementById('perClick');
  const perSecEl = document.getElementById('perSec');
  const spentEl = document.getElementById('spent');
  const upgradesEl = document.getElementById('upgrades');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const achievementsEl = document.getElementById('achievements');
  const memeGrid = document.getElementById('memeGrid');
  const clicker = document.getElementById('clicker');

  // Formatação
  const fmt = n => Math.floor(n).toLocaleString();
  const costFor = (u) => Math.floor(u.baseCost * Math.pow(1.15, u.qty));

  // Render upgrades com estilo
  function renderUpgrades(){
    upgradesEl.innerHTML = '';
    state.upgrades.forEach(u => {
      const cost = costFor(u);
      const div = document.createElement('div');
      div.className = 'upgrade';
      div.innerHTML = `
        <div class="row">
          <div>
            <div style="font-weight:700">${u.name}</div>
            <div style="font-size:13px;color:var(--muted)">${u.cps ? u.cps+' cps' : u.mult ? 'x'+u.mult+' multiplier' : ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">${fmt(cost)}</div>
            <button ${state.count < cost ? 'disabled' : ''} data-id="${u.id}">Comprar</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted)">Quantidade: ${u.qty}</div>
      `;
      upgradesEl.appendChild(div);
    });
    upgradesEl.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', () => buyUpgrade(b.dataset.id));
    });
  }

  // Atualiza UI
  function updateUI(){
    countEl.textContent = fmt(state.count);
    perClickEl.textContent = '+' + fmt(state.perClick);
    perSecEl.textContent = fmt(state.perSec);
    spentEl.textContent = fmt(state.spent);
    const pct = Math.min(100, Math.floor(state.progress));
    progressBar.style.width = pct + '%';
    progressLabel.textContent = pct + '%';
    renderAchievements();
    renderUpgrades();
    // memes
    const memeNodes = memeGrid.querySelectorAll('.meme');
    memeNodes.forEach((m, i) => {
      const threshold = (i+1) * 25;
      if(state.progress >= threshold){
        m.classList.add('unlocked');
        m.classList.remove('locked');
      } else {
        m.classList.add('locked');
        m.classList.remove('unlocked');
      }
    });
  }

  // Comprar upgrade
  function buyUpgrade(id){
    const u = state.upgrades.find(x=>x.id===id);
    const cost = costFor(u);
    if(state.count < cost) return;
    state.count -= cost;
    state.spent += cost;
    u.qty++;
    if(u.cps) state.perSec += u.cps;
    if(u.mult) state.perClick *= u.mult;
    state.progress += Math.min(12, cost / 50);
    spawnFloatingText('+ ' + fmt(cost), clicker);
    checkAchievements();
    updateUI();
  }

  // Clique principal com ripple e efeito
  clicker.addEventListener('click', (e) => {
    state.count += state.perClick;
    state.progress += 0.2;
    checkAchievements();
    updateUI();
    pulseEffect();
    createRipple(e);
    spawnClickParticles(e.clientX, e.clientY);
  });

  // Auto incremento por segundo (suave)
  setInterval(() => {
    if(state.perSec > 0){
      state.count += state.perSec;
      state.progress += state.perSec * 0.05;
      checkAchievements();
      updateUI();
    }
  }, 1000);

  // Achievements
  function checkAchievements(){
    const add = (key, label) => {
      if(!state.achievements.includes(key)){
        state.achievements.push(key);
        const el = document.createElement('div');
        el.className = 'ach';
        el.textContent = label;
        achievementsEl.appendChild(el);
        // celebration
        spawnConfetti();
      }
    };
    if(state.count >= 100 && !state.achievements.includes('100')) add('100','100 Stimulation!');
    if(state.spent >= 500 && !state.achievements.includes('spender')) add('spender','Gastador: 500+');
    if(state.progress >= 100 && !state.achievements.includes('meme-master')) add('meme-master','Meme Master — desbloqueou tudo');
  }

  function renderAchievements(){ /* placeholder */ }

  // Save / Load / Reset
  document.getElementById('saveBtn').addEventListener('click', () => {
    localStorage.setItem('stimulation_save', JSON.stringify(state));
    flashMessage('Jogo salvo');
  });
  document.getElementById('loadBtn').addEventListener('click', () => {
    const s = localStorage.getItem('stimulation_save');
    if(!s) { flashMessage('Nenhum save encontrado'); return; }
    try {
      const loaded = JSON.parse(s);
      state.count = loaded.count ?? state.count;
      state.perClick = loaded.perClick ?? state.perClick;
      state.perSec = loaded.perSec ?? state.perSec;
      state.spent = loaded.spent ?? state.spent;
      state.progress = loaded.progress ?? state.progress;
      if(loaded.upgrades && Array.isArray(loaded.upgrades)){
        loaded.upgrades.forEach(lu => {
          const u = state.upgrades.find(x=>x.id===lu.id);
          if(u) u.qty = lu.qty ?? u.qty;
        });
      }
      state.achievements = loaded.achievements ?? state.achievements;
      updateUI();
      flashMessage('Save carregado');
    } catch(e){ flashMessage('Erro ao carregar save'); }
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if(!confirm('Resetar o jogo?')) return;
    localStorage.removeItem('stimulation_save');
    location.reload();
  });

  // Visual pulse
  function pulseEffect(){
    clicker.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});
  }

  // Ripple effect
  function createRipple(e){
    const rect = clicker.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    clicker.appendChild(r);
    setTimeout(()=> r.remove(), 800);
  }

  // Floating text (quando compra)
  function spawnFloatingText(text, parent){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.left = (parent.getBoundingClientRect().left + parent.offsetWidth/2) + 'px';
    el.style.top = (parent.getBoundingClientRect().top + 20) + 'px';
    el.style.transform = 'translate(-50%,0)';
    el.style.color = '#fff';
    el.style.fontWeight = '700';
    el.style.zIndex = 9999;
    el.style.pointerEvents = 'none';
    el.style.opacity = '1';
    el.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
    document.body.appendChild(el);
    requestAnimationFrame(()=> {
      el.style.transform = 'translate(-50%,-80px)';
      el.style.opacity = '0';
    });
    setTimeout(()=> el.remove(), 1000);
  }

  // Confetti simples
  function spawnConfetti(){
    const count = 18;
    for(let i=0;i<count;i++){
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.position = 'fixed';
      c.style.left = (50 + (Math.random()-0.5)*40) + '%';
      c.style.top = '-10px';
      c.style.width = '10px';
      c.style.height = '14px';
      c.style.background = ['#7c3aed','#06b6d4','#f97316','#f43f5e'][Math.floor(Math.random()*4)];
      c.style.transform = 'rotate(' + (Math.random()*360) + 'deg)';
      c.style.zIndex = 9999;
      c.style.borderRadius = '2px';
      c.style.opacity = '0.95';
      document.body.appendChild(c);
      const dx = (Math.random()-0.5) * 600;
      const duration = 1800 + Math.random()*800;
      c.animate([
        { transform: `translateY(0) translateX(0) rotate(0deg)`, opacity:1 },
        { transform: `translateY(${600 + Math.random()*200}px) translateX(${dx}px) rotate(${Math.random()*720}deg)`, opacity:0.2 }
      ], { duration, easing: 'cubic-bezier(.2,.9,.2,1)'});
      setTimeout(()=> c.remove(), duration+50);
    }
  }

  // Click particles from canvas coordinates
  function spawnClickParticles(clientX, clientY){
    const rect = document.body.getBoundingClientRect();
    const x = clientX;
    const y = clientY;
    for(let i=0;i<12;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.position = 'fixed';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.width = '8px';
      p.style.height = '8px';
      p.style.borderRadius = '50%';
      p.style.background = ['#7c3aed','#06b6d4','#f97316'][Math.floor(Math.random()*3)];
      p.style.zIndex = 9999;
      p.style.pointerEvents = 'none';
      document.body.appendChild(p);
      const dx = (Math.random()-0.5) * 200;
      const dy = (Math.random()-0.8) * 200;
      const dur = 600 + Math.random()*400;
      p.animate([
        { transform: 'translate(0,0) scale(1)', opacity:1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity:0 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.9,.2,1)'});
      setTimeout(()=> p.remove(), dur+50);
    }
  }

  // Flash message (simples)
  function flashMessage(text){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.padding = '10px 14px';
    el.style.background = 'linear-gradient(90deg,#7c3aed,#06b6d4)';
    el.style.color = '#fff';
    el.style.borderRadius = '10px';
    el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
    el.style.zIndex = 9999;
    document.body.appendChild(el);
    setTimeout(()=> el.style.opacity = '0', 1600);
    setTimeout(()=> el.remove(), 2200);
  }

  // Meme click
  memeGrid.querySelectorAll('.meme').forEach(m => {
    m.addEventListener('click', () => {
      const idx = Array.from(memeGrid.children).indexOf(m);
      const threshold = (idx+1) * 25;
      if(state.progress >= threshold){
        flashMessage('Meme desbloqueado: ' + m.querySelector('.caption').textContent);
        spawnConfetti();
      } else {
        flashMessage('Ainda não desbloqueado: ' + Math.floor(state.progress) + '%');
      }
    });
  });

  // Auto-save
  setInterval(() => {
    localStorage.setItem('stimulation_save', JSON.stringify(state));
  }, 30000);

  // Keyboard: espaço para clicar
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') { e.preventDefault(); clicker.click(); }
  });

  // Inicial render
  renderUpgrades();
  updateUI();

  /* ---------- Canvas de partículas de fundo ---------- */
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const particles = [];
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function createParticles(n=60){
    particles.length = 0;
    for(let i=0;i<n;i++){
      particles.push({
        x: rand(0,W),
        y: rand(0,H),
        r: rand(0.6,2.6),
        vx: rand(-0.2,0.6),
        vy: rand(-0.1,0.3),
        hue: rand(180,280),
        alpha: rand(0.06,0.22)
      });
    }
  }
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; createParticles(Math.max(40, Math.floor(W/20))); }
  window.addEventListener('resize', resize);
  createParticles();

  function draw(){
    ctx.clearRect(0,0,W,H);
    // subtle gradient overlay
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(7,16,37,0.2)');
    g.addColorStop(1, 'rgba(7,24,40,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      if(p.x < -50) p.x = W + 50;
      if(p.x > W + 50) p.x = -50;
      if(p.y < -50) p.y = H + 50;
      if(p.y > H + 50) p.y = -50;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

})();
