/* Mini FNF Battle - script.js
   - Teclas: S D K L
   - Salve song.mp3 na mesma pasta para música (opcional)
*/

const keyMap = ["s","d","k","l"];
const laneX = { s: 0, d: 1, k: 2, l: 3 }; // índice de coluna
const laneCount = 4;
const laneWidth = 420; // deve bater com CSS
const columnWidth = laneWidth / laneCount;

const arrowLane = document.getElementById("arrow-lane");
const targets = document.querySelectorAll("#targets .target");
const scoreEl = document.getElementById("scoreVal");
const comboEl = document.getElementById("comboVal");
const playerHealthEl = document.getElementById("playerHealth");
const enemyHealthEl = document.getElementById("enemyHealth");
const playerSprite = document.getElementById("playerSprite");
const enemySprite = document.getElementById("enemySprite");
const music = document.getElementById("music");

let score = 0;
let combo = 0;
let playerHP = 100;
let enemyHP = 100;
let arrows = []; // setas ativas
let spawnInterval = 900; // ms entre setas
let arrowSpeed = 3.2; // px por frame (ajuste para dificuldade)
let gameRunning = true;

// inicializa barras
function updateHUD(){
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  playerHealthEl.style.width = playerHP + "%";
  enemyHealthEl.style.width = enemyHP + "%";
}
updateHUD();

// calcula posição X para coluna
function columnLeft(colIndex){
  // centraliza lane no elemento
  const offset = (arrowLane.clientWidth - laneWidth) / 2;
  return offset + colIndex * columnWidth;
}

// cria uma seta (objeto DOM + dados)
function spawnArrow(letter){
  const col = laneX[letter];
  const el = document.createElement("div");
  el.className = "arrow";
  el.textContent = letter.toUpperCase();
  // posiciona horizontalmente
  el.style.left = (columnLeft(col) + 10) + "px";
  el.style.top = "-120px";
  arrowLane.appendChild(el);

  const arrowObj = {
    el,
    letter,
    x: columnLeft(col) + 10,
    y: -120,
    speed: arrowSpeed
  };
  arrows.push(arrowObj);
}

// spawn aleatório (com peso para inimigo e jogador)
function spawnRandom(){
  const letters = keyMap;
  const letter = letters[Math.floor(Math.random()*letters.length)];
  spawnArrow(letter);
}

// animação principal
function gameLoop(){
  if(!gameRunning) return;
  // mover setas
  for(let i = arrows.length - 1; i >= 0; i--){
    const a = arrows[i];
    a.y += a.speed;
    a.el.style.top = a.y + "px";

    // se passou do alvo -> penaliza jogador (erro)
    if(a.y > arrowLane.clientHeight - 40){
      // remove
      a.el.remove();
      arrows.splice(i,1);
      // penalidade: perde combo e vida
      combo = 0;
      playerHP = Math.max(0, playerHP - 6);
      flashSprite(playerSprite, 'hit');
      updateHUD();
      checkEnd();
    }
  }
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// spawn periódico (sincronize com música se quiser)
let spawnTimer = setInterval(spawnRandom, spawnInterval);

// tecla pressionada -> checar acerto
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if(!keyMap.includes(key)) return;

  // anima target
  const idx = keyMap.indexOf(key);
  targets[idx].classList.add("active");
  setTimeout(()=>targets[idx].classList.remove("active"), 120);

  // procurar seta mais próxima nessa coluna
  let bestIndex = -1;
  let bestDist = Infinity;
  for(let i=0;i<arrows.length;i++){
    const a = arrows[i];
    if(a.letter !== key) continue;
    // distância vertical até a zona de acerto (aprox bottom - 120)
    const targetY = arrowLane.clientHeight - 120; // ajuste fino
    const dist = Math.abs(a.y - targetY);
    if(dist < bestDist){
      bestDist = dist;
      bestIndex = i;
    }
  }

  // janela de acerto (tolerância)
  const perfectWindow = 18;
  const goodWindow = 40;

  if(bestIndex !== -1){
    const a = arrows[bestIndex];
    const targetY = arrowLane.clientHeight - 120;
    const dist = Math.abs(a.y - targetY);

    if(dist <= perfectWindow){
      // perfeito
      hit(true);
      removeArrowAt(bestIndex);
    } else if(dist <= goodWindow){
      // bom
      hit(false);
      removeArrowAt(bestIndex);
    } else {
      // muito cedo/tarde -> erro
      miss();
    }
  } else {
    // sem seta -> erro
    miss();
  }
});

// remove seta por índice
function removeArrowAt(i){
  if(!arrows[i]) return;
  arrows[i].el.remove();
  arrows.splice(i,1);
}

// acerto
function hit(perfect){
  combo++;
  const points = perfect ? 30 : 12;
  score += points * Math.max(1, Math.floor(combo/5));
  // dano no inimigo
  enemyHP = Math.max(0, enemyHP - (perfect ? 6 : 2));
  flashSprite(enemySprite, 'hit');
  updateHUD();
  checkEnd();
}

// erro
function miss(){
  combo = 0;
  playerHP = Math.max(0, playerHP - 8);
  flashSprite(playerSprite, 'hit');
  updateHUD();
  checkEnd();
}

// animação de "hit" temporária
function flashSprite(spriteEl, cls){
  spriteEl.classList.remove('idle','hit','win');
  spriteEl.classList.add('hit');
  setTimeout(()=> {
    spriteEl.classList.remove('hit');
    spriteEl.classList.add('idle');
  }, 180);
}

// checa fim de batalha
function checkEnd(){
  if(enemyHP <= 0){
    endBattle(true);
  } else if(playerHP <= 0){
    endBattle(false);
  }
}

// fim de batalha
function endBattle(playerWon){
  gameRunning = false;
  clearInterval(spawnTimer);
  // limpar setas
  arrows.forEach(a=>a.el.remove());
  arrows = [];

  if(playerWon){
    enemySprite.classList.add('win');
    playerSprite.classList.add('idle');
    score += 500;
  } else {
    playerSprite.classList.add('win');
    enemySprite.classList.add('idle');
  }
  updateHUD();
  // parar música
  if(!music.paused) music.pause();
  // mostrar resultado simples
  setTimeout(()=>{
    const msg = playerWon ? "Você venceu!" : "Você perdeu!";
    alert(msg + " Pontuação final: " + score);
    // recarregar página para reiniciar
    location.reload();
  }, 600);
}

/* comportamento do inimigo: acerta setas automaticamente com certa precisão */
function enemyAI(){
  // a cada 700ms o inimigo tenta "tocar" uma coluna
  const choices = keyMap;
  const pick = choices[Math.floor(Math.random()*choices.length)];
  // cria uma seta para o inimigo (visual apenas) que desce mais devagar
  // para simular batalha, também podemos gerar setas que o jogador deve acertar.
  // aqui mantemos apenas geração normal; para mais complexidade, adicione patterns.
}
setInterval(enemyAI, 700);

// iniciar música ao clique (requisito de autoplay em navegadores)
document.addEventListener('click', () => {
  if(music && music.paused){
    music.currentTime = 0;
    music.play().catch(()=>{/* autoplay bloqueado */});
  }
});

// ajuste responsivo: recalcula laneWidth dinamicamente
window.addEventListener('resize', () => {
  // nada crítico aqui, mas poderia recalcular offsets se necessário
});

/* Dicas para personalizar:
 - Substitua o conteúdo das divs .sprite por imagens (background-image) para sprites reais.
 - Para sincronizar com música, gere setas com base em timestamps da faixa.
 - Ajuste spawnInterval e arrowSpeed para aumentar/diminuir dificuldade.
*/
