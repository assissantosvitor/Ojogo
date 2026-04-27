const fases = [
  { nome:"Praça da Cidade", dialogo:"Você não vai me vencer no ritmo da rua!" },
  { nome:"Clube Neon", dialogo:"Prepare-se para luzes e sons que vão te confundir!" },
  { nome:"Castelo do Mago", dialogo:"Minha magia controla cada nota!" }
];

let faseAtual = 0;
function mostrarDialogo(){
  document.getElementById("dialogue-text").textContent = fases[faseAtual].dialogo;
}
