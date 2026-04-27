function proximaFase(){
  faseAtual++;
  if(faseAtual < fases.length){
    mostrarDialogo();
    // aumenta velocidade
    arrowSpeed += 1;
    spawnInterval -= 200;
  } else {
    alert("Parabéns! Você venceu todos os rivais!");
  }
}