// Variáveis de estado do jogo
let score = 0;
let clickPower = 1; // Quantos pontos ganha por clique
let autoClickers = 0; // Quantos pontos ganha por segundo

// Custos dos upgrades
let costUpgrade1 = 10;
let costUpgrade2 = 50;

// Pegando os elementos do HTML
const scoreElement = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');

const upgrade1Btn = document.getElementById('upgrade1');
const upgrade1CostEl = document.getElementById('upgrade1-cost');

const upgrade2Btn = document.getElementById('upgrade2');
const upgrade2CostEl = document.getElementById('upgrade2-cost');

// Função para atualizar a tela
function updateScreen() {
    scoreElement.innerText = Math.floor(score);
    upgrade1CostEl.innerText = costUpgrade1;
    upgrade2CostEl.innerText = costUpgrade2;

    // Desativa o botão se não tiver dinheiro suficiente
    upgrade1Btn.disabled = score < costUpgrade1;
    upgrade2Btn.disabled = score < costUpgrade2;
}

// Evento: Quando o botão principal é clicado
clickBtn.addEventListener('click', () => {
    score += clickPower;
    updateScreen();
});

// Evento: Comprar Upgrade 1 (Força do Clique)
upgrade1Btn.addEventListener('click', () => {
    if (score >= costUpgrade1) {
        score -= costUpgrade1; // Gasta os pontos
        clickPower += 1; // Aumenta a força do clique
        costUpgrade1 = Math.floor(costUpgrade1 * 1.5); // Aumenta o custo para a próxima vez
        updateScreen();
    }
});

// Evento: Comprar Upgrade 2 (Auto-Clicker)
upgrade2Btn.addEventListener('click', () => {
    if (score >= costUpgrade2) {
        score -= costUpgrade2;
        autoClickers += 1;
        costUpgrade2 = Math.floor(costUpgrade2 * 1.5);
        updateScreen();
    }
});

// Loop do Auto-Clicker (Roda a cada 1 segundo / 1000 milissegundos)
setInterval(() => {
    if (autoClickers > 0) {
        score += autoClickers;
        updateScreen();
    }
}, 1000);

// Atualiza a tela assim que o jogo abre
updateScreen();
