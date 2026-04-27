/* Rhythm Battle - separado em script.js
   - Teclas: S D K L
   - Coloque music1.mp3, music2.mp3, music3.mp3 na mesma pasta para música opcional
*/

(() => {
  const PHASES = [
    { id:1, name:"Praça da Cidade", dialogue:"Rival: \"Essa praça é minha — vamos ver seu ritmo!\"", bg:"linear-gradient(180deg,#0b1220,#07101a), radial-gradient(circle at 20% 20%, rgba(255,59,107,.06), transparent 6%)", music:"music1.mp3", spawnInterval:900, arrowSpeed:3.6 },
    { id:2, name:"Clube Neon", dialogue:"DJ Neon: \"Luzes, fumaça e batidas — aguenta o tranco?\"", bg:"linear-gradient(180deg,#07101a,#0b0f2a), radial-gradient(circle at 80% 20%, rgba(79,227,193,.06), transparent 6%)", music:"music2.mp3", spawnInterval:700, arrowSpeed:4.4 },
    { id:3, name:"Castelo do Mago", dialogue:"Mago do Ritmo: \"Minhas notas são feitiços — tente acompanhar!\"", bg:"linear-gradient(180deg,#0b0716,#12021f), radial-gradient(circle at 50% 10%, rgba(255,59,107,.06), transparent 6%)", music:"music3.mp3", spawnInterval:560, arrowSpeed:5.2 }
  ];

  const dialogueText = document.getElementById('dialogueText');
  const bg = document.getElementById('bg');
  const playerFill = document.getElementById('playerFill');
  const enemyFill = document.getElementById('enemyFill');
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo');
  const phaseEl = document.getElementById('phase');
  const feedback = document.getElementById('feedback');
  const targets = document.querySelectorAll('.target');
  const lane = document.getElementById('lane');
  const playerSprite = document.getElementById('playerSprite');
  const enemySprite = document.getElementById('enemySprite');

  const KEY_ORDER = ['s','d','k','l'];
  let arrows = [];
  let score = 0, combo = 0;
  let playerHP = 100, enemyHP = 100;
  let currentPhaseIndex = 0;
  let spawnTimer = null;
  let gameRunning = false;
  let arrowSpeed = 3.6;
  let spawnInterval = 900;
  let music = null;

  function applyPhaseVisual(phase){
    bg.style.background = phase.bg;
    dialogueText.textContent = phase.dialogue;
    phaseEl.textContent = phase.id;
  }

  function updateHUD(){
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    playerFill.style.width = playerHP + '%';
    enemyFill.style.width = enemyHP + '%';
  }

  function spawnArrow(key){
    const laneWidth = lane.clientWidth;
    const colIndex = KEY_ORDER.indexOf(key);
    const colWidth = laneWidth / KEY_ORDER.length;
    const left = colIndex * colWidth + 8;
    const a = document.createElement('div');
    a.className = 'arrow';
    a.textContent = key.toUpperCase();
    a.style.left = left + 'px';
    a.style.top = '-160px';
    lane.appendChild(a);
    arrows.push({el:a, key, y:-160, speed: arrowSpeed});
  }

  function spawnRandom(){
    const k = KEY_ORDER[Math.floor(Math.random()*KEY_ORDER.length)];
    spawnArrow(k);
  }

  function gameLoop(){
    if(!gameRunning) return;
    for(let i = arrows.length - 1; i >= 0; i--){
      const a = arrows[i];
      a.y += a.speed;
      a.el.style.top = a.y + 'px';
      if(a.y > lane.clientHeight - 40){
        a.el.remove();
        arrows.splice(i,1);
        combo = 0;
        playerHP = Math.max(0, playerHP - 8);
        flash(playerSprite, 'hit');
        showFeedback('MISS', '#ff6b6b');
        updateHUD();
        checkEnd();
      }
    }
    requestAnimationFrame(gameLoop);
  }

  function checkEnd(){
    if(enemyHP <= 0){
      showFeedback('PHASE WON', '#4fe3c1');
      stopPhase(() => nextPhase());
    } else if(playerHP <= 0){
      showFeedback('YOU LOSE', '#ff6b6b');
      stopPhase(() => endGame(false));
    }
  }

  function removeArrowAt(i){
    if(!arrows[i]) return;
    arrows[i].el.remove();
    arrows.splice(i,1);
  }

  function hit(perfect){
    combo++;
    const base = perfect ? 30 : 12;
    score += base + Math.floor(combo/3) * 2;
    enemyHP = Math.max(0, enemyHP - (perfect ? 6 : 2));
    flash(enemySprite, 'hit');
    showFeedback(perfect ? 'PERFECT' : 'GOOD', perfect ? '#ffd166' : '#9be7ff');
    updateHUD();
    checkEnd();
  }

  function miss(){
    combo = 0;
    playerHP = Math.max(0, playerHP - 10);
    flash(playerSprite, 'hit');
    showFeedback('MISS', '#ff6b6b');
    updateHUD();
    checkEnd();
  }

  let feedbackTimeout = null;
  function showFeedback(text, color){
    clearTimeout(feedbackTimeout);
    feedback.style.display = 'block';
    feedback.textContent = text;
    feedback.style.background = 'rgba(0,0,0,.6)';
    feedback.style.color = color;
    feedbackTimeout = setTimeout(()=> feedback.style.display = 'none', 600);
  }

  function flash(el, cls){
    el.classList.add(cls);
    setTimeout(()=> el.classList.remove(cls), 220);
  }

  document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    const key = e.key.toLowerCase();
    if(!KEY_ORDER.includes(key)) return;
    const idx = KEY_ORDER.indexOf(key);
    const t = document.querySelectorAll('.target')[idx];
    t.classList.add('active');
    setTimeout(()=> t.classList.remove('active'), 120);

    let bestIndex = -1, bestDist = Infinity;
    const targetY = lane.clientHeight - 140;
    for(let i=0;i<arrows.length;i++){
      const a = arrows[i];
      if(a.key !== key) continue;
      const dist = Math.abs(a.y - targetY);
      if(dist < bestDist){ bestDist = dist; bestIndex = i; }
    }

    const perfectWindow = 18;
    const goodWindow = 40;

    if(bestIndex !== -1){
      const dist = Math.abs(arrows[bestIndex].y - targetY);
      if(dist <= perfectWindow){
        hit(true);
        removeArrowAt(bestIndex);
      } else if(dist <= goodWindow){
        hit(false);
        removeArrowAt(bestIndex);
      } else {
        miss();
      }
    } else {
      miss();
    }
  });

  function startPhase(index){
    const phase = PHASES[index];
    currentPhaseIndex = index;
    applyPhaseVisual(phase);
    enemyHP = 100;
    spawnInterval = phase.spawnInterval;
    arrowSpeed = phase.arrowSpeed;
    if(spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnRandom, spawnInterval);
    if(music){ music.pause(); music = null; }
    if(phase.music){
      music = new Audio(phase.music);
      music.loop = true;
      music.play().catch(()=>{});
    }
    gameRunning = true;
    requestAnimationFrame(gameLoop);
    updateHUD();
  }

  function stopPhase(callback){
    gameRunning = false;
    if(spawnTimer) clearInterval(spawnTimer);
    arrows.forEach(a=>a.el.remove());
    arrows = [];
    if(music){ music.pause(); music = null; }
    setTimeout(()=> { if(callback) callback(); }, 700);
  }

  function nextPhase(){
    currentPhaseIndex++;
    if(currentPhaseIndex < PHASES.length){
      const p = PHASES[currentPhaseIndex];
      dialogueText.textContent = p.dialogue;
      enemyHP = 100;
      setTimeout(()=> startPhase(currentPhaseIndex), 900);
    } else {
      endGame(true);
    }
  }

  function endGame(win){
    stopPhase();
    dialogueText.textContent = win ? "Você venceu todos os rivais! Parabéns!" : "Você foi derrotado. Tente novamente!";
    showFeedback(win ? 'VICTORY' : 'DEFEAT', win ? '#4fe3c1' : '#ff6b6b');
    setTimeout(()=> {
      score = 0; combo = 0; playerHP = 100; enemyHP = 100; currentPhaseIndex = 0;
      updateHUD();
      dialogueText.textContent = "Clique para jogar novamente!";
    }, 1400);
  }

  document.getElementById('game').addEventListener('click', () => {
    if(!gameRunning && currentPhaseIndex === 0 && score === 0 && playerHP === 100 && enemyHP === 100){
      applyPhaseVisual(PHASES[0]);
      dialogueText.textContent = PHASES[0].dialogue;
      setTimeout(()=> startPhase(0), 700);
    } else if(!gameRunning && currentPhaseIndex === 0 && score === 0){
      startPhase(0);
    } else if(!gameRunning && currentPhaseIndex > 0 && enemyHP <= 0){
      startPhase(currentPhaseIndex);
    } else {
      if(music && music.paused) music.play().catch(()=>{});
    }
  });

  setInterval(updateHUD, 120);
  applyPhaseVisual(PHASES[0]);
  dialogueText.textContent = "Clique para começar a aventura rítmica!";
})();
