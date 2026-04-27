let score=0,combo=0,phase=1;
const scoreEl=document.getElementById("scoreVal");
const comboEl=document.getElementById("comboVal");
const phaseEl=document.getElementById("phaseVal");
const dialogue=document.getElementById("dialogue-text");
const arrowLane=document.getElementById("arrow-lane");
const keys=["s","d","k","l"];
let arrows=[];

function updateHUD(){
  scoreEl.textContent=score;
  comboEl.textContent=combo;
  phaseEl.textContent=phase;
}

function spawnArrow(){
  const letter=keys[Math.floor(Math.random()*keys.length)];
  const arrow=document.createElement("div");
  arrow.className="arrow";
  arrow.textContent=letter.toUpperCase();
  arrow.style.left=(keys.indexOf(letter)*100)+"px";
  arrowLane.appendChild(arrow);
  arrows.push({el:arrow,letter,y:-100});
}

function gameLoop(){
  arrows.forEach((a,i)=>{
    a.y+=5+phase; // aumenta velocidade conforme fase
    a.el.style.top=a.y+"px";
    if(a.y>window.innerHeight){
      arrowLane.removeChild(a.el);
      arrows.splice(i,1);
      combo=0;
      updateHUD();
    }
  });
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

setInterval(spawnArrow,1500);

document.addEventListener("keydown",e=>{
  const key=e.key.toLowerCase();
  arrows.forEach((a,i)=>{
    if(a.letter===key && a.y>400 && a.y<500){
      score+=10*phase;
      combo++;
      arrowLane.removeChild(a.el);
      arrows.splice(i,1);
      updateHUD();
      if(score>100*phase){ // condição para passar de fase
        phase++;
        dialogue.textContent="Novo rival aparece! Prepare-se!";
        updateHUD();
      }
    }
  });
});
