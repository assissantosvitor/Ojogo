/* Combo Clicker — script separado */

/* ---------- State ---------- */
const state = {
  count: 0,
  totalClicks: 0,
  perClickBase: 1,
  perSec: 0,
  combo: 0,
  comboTimer: null,
  comboMultiplier: 1,
  bestCombo: 1,
  progress: 0,
  upgrades: [
    { id:'auto', name:'Auto Clicker', baseCost:50, qty:0, cps:1 },
    { id:'power', name:'Power Core', baseCost:200, qty:0, bonus:1.5 },
    { id:'mega', name:'Mega Boost', baseCost:1200, qty:0, bonus:2.5 }
  ],
  memesUnlocked: []
};

/* ---------- DOM refs ---------- */
const countEl = document.getElementById('count');
const perClickEl = document.getElementById('perClick');
const perSecEl = document.getElementById('perSec');
const comboText = document.getElementById('comboText');
const comboMeter = document.getElementById('comboMeter');
const bestComboEl = document.getElementById('bestCombo');
const totalClicksEl = document.getElementById('totalClicks');
const upgradesEl = document.getElementById('upgrades');
const progressBar = document.querySelector('.progress > i');
const memeGrid = document.getElementById('memeGrid');
const clicker = document.getElementById('clicker');
const sneakerLayer = document.getElementById('sneakerLayer');

/* ---------- Helpers ---------- */
const fmt = n => Math.floor(n).toLocaleString('pt-BR');
const costFor = u => Math.floor(u.baseCost * Math.pow(1.18, u.qty));

/* ---------- Render Upgrades ---------- */
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

/* ---------- Per click calculation ---------- */
function getPerClick(){
  let base = state.perClickBase;
  const powerUp = state.upgrades.find(u => u.id === 'power');
  if(powerUp && powerUp.qty > 0) base *= Math.pow(powerUp.bonus, powerUp.qty);
  const mega = state.upgrades.find(u => u.id === 'mega');
  if(mega && mega.qty > 0) base *= Math.pow(mega.bonus, mega.qty);
  return Math.max(1, Math.floor(base * state.comboMultiplier));
}

/* ---------- Update UI ---------- */
function updateUI(){
  countEl.textContent = fmt(state.count);
  perClickEl.textContent = '+' + fmt(getPerClick());
  perSecEl.textContent = fmt(state.perSec);
  comboText.textContent = 'Combo x' + state.comboMultiplier.toFixed(2);
  comboMeter.style.width = Math.min(100, (state.combo / 20) * 100) + '%';
  bestComboEl.textContent = 'x' + state.bestCombo.toFixed(2);
  totalClicksEl.textContent = fmt(state.totalClicks);
  progressBar.style.width = Math.min(100, Math.floor(state.progress)) + '%';
  renderUpgrades();
  renderMemes();
}

/* ---------- Buy upgrade ---------- */
function buyUpgrade(id){
  const u = state.upgrades.find(x => x.id === id);
  const cost = costFor(u);
  if(state.count < cost) return;
  state.count -= cost;
  u.qty++;
  if(u.id === 'auto') state.perSec += u.cps;
  spawnFloating('Comprou ' + u.name, window.innerWidth/2, window.innerHeight/2);
  updateUI();
}

/* ---------- Combo logic ---------- */
function incrementCombo(){
  state.combo++;
  state.comboMultiplier = 1 + Math.sqrt(state.combo) * 0.08;
  if(state.comboMultiplier > state.bestCombo) state.bestCombo = state.comboMultiplier;
  if(state.comboTimer) clearTimeout(state.comboTimer);
  state.comboTimer = setTimeout(() => {
    state.combo = 0;
    state.comboMultiplier = 1;
    updateUI();
  }, 1200);
}

/* ---------- Click handler ---------- */
clicker.addEventListener('click', (e) => {
  incrementCombo();
  const gain = getPerClick();
  state.count += gain;
  state.totalClicks++;
  state.progress += gain * 0.0005;
  spawnRipple(e);
  spawnParticles(e.clientX, e.clientY);
  spawnFloating('+' + fmt(gain), e.clientX, e.clientY);
  checkMemes();
  checkAchievements();
  updateUI();
});

/* ---------- Auto increment ---------- */
setInterval(() => {
  if(state.perSec > 0){
    state.count += state.perSec;
    state.progress += state.perSec * 0.001;
    checkMemes();
    updateUI();
  }
}, 1000);

/* ---------- Ripple ---------- */
function spawnRipple(e){
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

/* ---------- Particles ---------- */
function spawnParticles(clientX, clientY){
  for(let i=0;i<10;i++){
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = clientX + 'px';
    p.style.top = clientY + 'px';
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

/* ---------- Floating text ---------- */
function spawnFloating(text, x, y){
  const el = document.createElement('div');
  el.className = 'floating';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.transform = 'translate(-50%,-50%)';
  el.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
  document.body.appendChild(el);
  requestAnimationFrame(()=> {
    el.style.transform = 'translate(-50%,-140%)';
    el.style.opacity = '0';
  });
  setTimeout(()=> el.remove(), 1000);
}

/* ---------- Confetti ---------- */
function spawnConfetti(){
  const count = 18;
  for(let i=0;i<count;i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = (50 + (Math.random()-0.5)*40) + '%';
    c.style.top = '-10px';
    c.style.background = ['#7c3aed','#06b6d4','#f97316','#f43f5e'][Math.floor(Math.random()*4)];
    document.body.appendChild(c);
    const dx = (Math.random()-0.5) * 600;
    const duration = 1800 + Math.random()*800;
    c.animate([
      { transform: `translateX(0) translateY(0) rotate(0deg)`, opacity:1 },
      { transform: `translateX(${dx}px) translateY(${600 + Math.random()*200}px) rotate(${Math.random()*720}deg)`, opacity:0.2 }
    ], { duration, easing: 'cubic-bezier(.2,.9,.2,1)'});
    setTimeout(()=> c.remove(), duration+50);
  }
}

/* ---------- Achievements & Memes ---------- */
function checkAchievements(){
  if(state.count >= 100000 && !state.achieved100k){
    state.achieved100k = true;
    spawnConfetti();
    spawnFloating('Conquista: 100k!', window.innerWidth/2, 120);
  }
}

function checkMemes(){
  const thresholds = [25,50,75,100];
  thresholds.forEach((t,i) => {
    if(state.progress >= t && !state.memesUnlocked.includes(i)){
      state.memesUnlocked.push(i);
      spawnFloating('Meme desbloqueado!', window.innerWidth/2, 120);
      spawnConfetti();
    }
  });
}

function renderMemes(){
  const memeNodes = memeGrid.querySelectorAll('.meme');
  memeNodes.forEach((m, i) => {
    const threshold = (i+1) * 25;
    if(state.progress >= threshold){
      m.classList.add('unlocked'); m.classList.remove('locked');
    } else {
      m.classList.add('locked'); m.classList.remove('unlocked');
    }
  });
}

memeGrid.querySelectorAll('.meme').forEach((m, i) => {
  m.addEventListener('click', () => {
    const threshold = (i+1) * 25;
    if(state.progress >= threshold){
      spawnFloating('Meme: ' + m.querySelector('.caption').textContent, window.innerWidth/2, 120);
      spawnConfetti();
    } else {
      spawnFloating('Progresso: ' + Math.floor(state.progress) + '%', window.innerWidth/2, 120);
    }
  });
});

/* ---------- Save / Load / Reset ---------- */
document.getElementById('saveBtn').addEventListener('click', () => {
  localStorage.setItem('combo_clicker_save', JSON.stringify(state));
  spawnFloating('Jogo salvo', window.innerWidth - 120, window.innerHeight - 80);
});
document.getElementById('loadBtn').addEventListener('click', () => {
  const s = localStorage.getItem('combo_clicker_save');
  if(!s){ spawnFloating('Nenhum save', window.innerWidth - 120, window.innerHeight - 80); return; }
  try {
    const loaded = JSON.parse(s);
    state.count = loaded.count ?? state.count;
    state.totalClicks = loaded.totalClicks ?? state.totalClicks;
    state.perClickBase = loaded.perClickBase ?? state.perClickBase;
    state.perSec = loaded.perSec ?? state.perSec;
    if(loaded.upgrades && Array.isArray(loaded.upgrades)){
      loaded.upgrades.forEach(lu => {
        const u = state.upgrades.find(x=>x.id===lu.id);
        if(u) u.qty = lu.qty ?? u.qty;
      });
    }
    state.progress = loaded.progress ?? state.progress;
    spawnFloating('Save carregado', window.innerWidth - 120, window.innerHeight - 80);
    updateUI();
  } catch(e){
    spawnFloating('Erro ao carregar', window.innerWidth - 120, window.innerHeight - 80);
  }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('Resetar o jogo?')) return;
  localStorage.removeItem('combo_clicker_save');
  location.reload();
});

/* ---------- Sneakers overlay (6 tênis) ---------- */
const sneakerImages = [
  'assets/tenis1.png',
  'assets/tenis2.png',
  'assets/tenis3.png',
  'assets/tenis4.png',
  'assets/tenis5.png',
  'assets/tenis6.png'
];
function placeSneakers(){
  const layer = sneakerLayer;
  layer.innerHTML = '';
  const positions = [
    {x:8, y:60, rot:-12, scale:1.0},
    {x:28, y:18, rot:6, scale:0.9},
    {x:60, y:12, rot:-6, scale:1.05},
    {x:72, y:48, rot:10, scale:0.95},
    {x:44, y:72, rot:-20, scale:1.0},
    {x:18, y:78, rot:8, scale:0.9}
  ];
  positions.forEach((p,i) => {
    const img = document.createElement('img');
    img.className = 'sneaker';
    img.src = sneakerImages[i] || 'assets/tenis-placeholder.png';
    img.alt = 'tenis ' + (i+1);
    img.style.left = p.x + '%';
    img.style.top = p.y + '%';
    img.style.transform = `translate(-50%,-50%) rotate(${p.rot}deg) scale(${p.scale})`;
    img.style.opacity = '0';
    img.style.animationDelay = (i * 120) + 'ms';
    layer.appendChild(img);
    img.onload = () => { img.style.opacity = '1'; };
  });
}

/* ---------- Background particles canvas ---------- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext && canvas.getContext('2d');
function resizeCanvas(){ if(!ctx) return; canvas.width = innerWidth; canvas.height = innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if(ctx){
  const particles = [];
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function createParticles(n=80){
    particles.length = 0;
    for(let i=0;i<n;i++){
      particles.push({
        x: rand(0,canvas.width),
        y: rand(0,canvas.height),
        r: rand(0.6,2.6),
        vx: rand(-0.2,0.6),
        vy: rand(-0.1,0.3),
        hue: rand(180,280),
        alpha: rand(0.06,0.22)
      });
    }
  }
  createParticles(Math.max(40, Math.floor(canvas.width/20)));
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0, 'rgba(7,16,37,0.2)');
    g.addColorStop(1, 'rgba(7,24,40,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -50) p.x = canvas.width + 50;
      if(p.x > canvas.width + 50) p.x = -50;
      if(p.y < -50) p.y = canvas.height + 50;
      if(p.y > canvas.height + 50) p.y = -50;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- Parallax for photo ---------- */
window.addEventListener('mousemove', (e) => {
  const cx = (e.clientX / window.innerWidth - 0.5) * 6;
  const cy = (e.clientY / window.innerHeight - 0.5) * 6;
  const photo = document.getElementById('photoWrap');
  if(photo) photo.style.transform = `translate(${cx}px, ${cy}px)`;
});

/* ---------- Keyboard shortcut ---------- */
window.addEventListener('keydown', (e) => {
  if(e.code === 'Space'){ e.preventDefault(); clicker.click(); }
});

/* ---------- Initial render ---------- */
function init(){
  renderUpgrades();
  updateUI();
  placeSneakers();
  window.addEventListener('resize', () => setTimeout(placeSneakers, 120));
}
init();

/* ---------- Respect reduced motion ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(prefersReduced){
  document.querySelectorAll('.sneaker').forEach(el => el.style.animation = 'none');
}
