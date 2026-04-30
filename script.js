/* Stimulation Clicker JavaScript */
(() => {
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
  const achievementsEl = document.getElementById('achievements');
  const memeGrid = document.getElementById('memeGrid');

  const fmt = n => Math.floor(n).toLocaleString();
  const costFor = (u) => Math.floor(u.baseCost * Math.pow(1.15, u.qty));

  function renderUpgrades(){
    upgradesEl.innerHTML = '';
    state.upgrades.forEach(u => {
      const cost = costFor(u);
      const div = document.createElement('div');
      div.className = 'upgrade';
      div.innerHTML = `
        <div>
          <div style="font-weight:700">${u.name}</div>
          <div style="font-size:13px;color:var(--muted)">${u.cps ? u.cps+' cps' : u.mult ? 'x'+u.mult+' multiplier' : ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${fmt(cost)}</div>
          <button ${state.count < cost ? 'disabled' : ''} data-id="${u.id}">Comprar</button>
        </div>
      `;
      upgradesEl.appendChild(div);
    });
    upgradesEl.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', () => buyUpgrade(b.dataset.id));
    });
  }

  function updateUI(){
    countEl.textContent = fmt(state.count);
    perClickEl.textContent = '+' + fmt(state.perClick);
    perSecEl.textContent = fmt(state.perSec);
    spentEl.textContent = fmt(state.spent);
    progressBar.style.width = Math.min(100, state.progress) + '%';
    renderAchievements();
    renderUpgrades();
    const memeNodes = memeGrid.querySelectorAll('.meme');
    memeNodes.forEach((m, i) => {
      const threshold = (i+1) * 25;
      m.style.opacity = state.progress >= threshold ? '1' : '0.35';
      m.style.filter = state.progress >= threshold ? 'none' : 'grayscale(60%)';
    });
  }

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
    checkAchievements();
    updateUI();
  }

  document.getElementById('clicker').addEventListener('click', () => {
    state.count += state.perClick;
    state.progress += 0.2;
    checkAchievements();
    updateUI();
    pulseEffect();
  });

  setInterval(() => {
    if(state.perSec > 0){
      state.count += state.perSec;
      state.progress += state.perSec * 0.05;
      checkAchievements();
      updateUI();
    }
  }, 1000);

  function checkAchievements(){
    const add = (key, label) => {
      if(!state.achievements.includes(key)){
        state.achievements.push(key);
        const el = document.createElement('div');
        el.className = 'ach';
        el.textContent = label;
        achievementsEl.appendChild(el);
      }
    };
    if(state.count >= 100 && !state.achievements.includes('100')) add('100','100 Stimulation!');
    if(state.spent >= 500 && !state.achievements.includes('spender')) add('spender','Gastador: 500+');
    if(state.progress >= 100 && !state.achievements.includes('meme-master')) add('meme-master','Meme Master — desbloqueou tudo');
  }

  function renderAchievements(){ /* placeholder if needed later */ }

  document.getElementById('saveBtn').addEventListener('click', () => {
    localStorage.setItem('stimulation_save', JSON.stringify(state));
    alert('Jogo salvo localmente.');
  });

  document.getElementById('loadBtn').addEventListener('click', () => {
    const s = localStorage.getItem('stimulation_save');
    if(!s) { alert('Nenhum save encontrado.'); return; }
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
      alert('Save carregado.');
    } catch(e){ alert('Erro ao carregar save.'); }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if(!confirm('Resetar o jogo?')) return;
    localStorage.removeItem('stimulation_save');
    location.reload();
  });

  function pulseEffect(){
    const el = document.getElementById('clicker');
    el.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});
  }

  renderUpgrades();
  updateUI();

  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') { e.preventDefault(); document.getElementById('clicker').click(); }
  });

  setInterval(() => {
    localStorage.setItem('stimulation_save', JSON.stringify(state));
  }, 30000);

  memeGrid.querySelectorAll('.meme').forEach(m => {
    m.addEventListener('click', () => {
      const idx = Array.from(memeGrid.children).indexOf(m);
      const threshold = (idx+1) * 25;
      if(state.progress >= threshold){
        alert('Meme desbloqueado: ' + m.querySelector('.caption').textContent);
      } else {
        alert('Ainda não desbloqueado. Progresso: ' + Math.floor(state.progress) + '%');
      }
    });
  });

})();
