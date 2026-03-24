// ==================== MINI CRAFT 3D ====================
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight - 56);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 20, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 56), 0.1, 1000);
camera.position.set(8, 12, 25);

// Luzes (estilo Minecraft)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffeecc, 1.2);
sunLight.position.set(50, 80, 30);
scene.add(sunLight);

// Variáveis do jogo
const BLOCK_SIZE = 1;
const WORLD_RADIUS = 16; // mundo 32x32
let blocksMap = new Map();     // chave: "x,y,z" → tipo
let blockMeshes = [];          // array para raycasting
let selectedBlockType = 1;

const BLOCK_TYPES = {
    1: { name: 'grama',  color: 0x4CAF50 },
    2: { name: 'terra',  color: 0x8B4513 },
    3: { name: 'pedra',  color: 0x777777 },
    4: { name: 'madeira',color: 0xA0522D },
    5: { name: 'folhas', color: 0x228B22 }
};

let player = { flying: true };
let keys = {};
let pointerLocked = false;

// Destaque do bloco (a "seta" que acompanha o mouse)
const highlightGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
const highlightMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
const highlight = new THREE.LineSegments(highlightGeo, highlightMat);
scene.add(highlight);
highlight.visible = false;

// Raycaster
const raycaster = new THREE.Raycaster();

// ====================== GERAÇÃO DO MUNDO ======================
function generateWorld() {
    // limpa mundo antigo
    blockMeshes.forEach(mesh => scene.remove(mesh));
    blockMeshes = [];
    blocksMap.clear();

    // Chão com variação (hills)
    for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
        for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
            const height = Math.floor(3 + Math.sin(x * 0.3) * 2.5 + Math.cos(z * 0.3) * 2.5);
            
            for (let y = 0; y <= height; y++) {
                let type = 3; // pedra
                if (y === height) type = 1;      // grama
                else if (y >= height - 3) type = 2; // terra
                addBlock(x, y, z, type);
            }

            // Árvores aleatórias
            if (Math.random() > 0.88 && height > 3) {
                const treeH = 4 + Math.floor(Math.random() * 3);
                // tronco
                for (let h = 1; h <= treeH; h++) {
                    addBlock(x, height + h, z, 4);
                }
                // folhas
                for (let ly = -2; ly <= 2; ly++) {
                    for (let lx = -2; lx <= 2; lx++) {
                        for (let lz = -2; lz <= 2; lz++) {
                            if (Math.abs(lx) + Math.abs(ly) + Math.abs(lz) < 5) {
                                const tx = x + lx;
                                const ty = height + treeH + ly;
                                const tz = z + lz;
                                if (!blocksMap.has(`${tx},${ty},${tz}`)) {
                                    addBlock(tx, ty, tz, 5);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Posição inicial do jogador (acima do chão)
    camera.position.set(0, 15, 20);
}

function addBlock(x, y, z, type) {
    const key = `${x},${y},${z}`;
    if (blocksMap.has(key)) return;

    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const material = new THREE.MeshLambertMaterial({ 
        color: BLOCK_TYPES[type].color,
        flatShading: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    scene.add(mesh);

    blocksMap.set(key, type);
    blockMeshes.push(mesh);
}

function removeBlock(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    if (!blocksMap.has(key)) return;

    const mesh = blockMeshes.find(m => 
        Math.floor(m.position.x - 0.5) === Math.floor(x) &&
        Math.floor(m.position.y - 0.5) === Math.floor(y) &&
        Math.floor(m.position.z - 0.5) === Math.floor(z)
    );

    if (mesh) {
        scene.remove(mesh);
        blockMeshes.splice(blockMeshes.indexOf(mesh), 1);
    }
    blocksMap.delete(key);
}

// ====================== CONTROLES ======================
function createHotbar() {
    const hotbarEl = document.getElementById('hotbar');
    hotbarEl.innerHTML = '';
    Object.keys(BLOCK_TYPES).forEach((typeStr, i) => {
        const type = parseInt(typeStr);
        const slot = document.createElement('div');
        slot.className = `slot ${i === 0 ? 'selected' : ''}`;
        slot.innerHTML = `<div style="width:100%;height:100%;background:#${BLOCK_TYPES[type].color.toString(16)};display:flex;align-items:center;justify-content:center;font-size:36px;">${type === 1 ? '🌱' : type === 2 ? '🟫' : type === 3 ? '🪨' : type === 4 ? '🪵' : '🌳'}</div>`;
        slot.onclick = () => {
            selectedBlockType = type;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
        };
        hotbarEl.appendChild(slot);
    });
}

// Pointer Lock
canvas.addEventListener('click', () => {
    if (!pointerLocked) canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
    if (!pointerLocked) return;
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
});

// Teclas
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key >= '1' && e.key <= '5') {
        selectedBlockType = parseInt(e.key);
        document.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('selected', i === selectedBlockType - 1));
    }
    if (e.key.toLowerCase() === 'r') generateWorld();
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Clique do mouse (quebrar / colocar)
canvas.addEventListener('mousedown', (e) => {
    if (!pointerLocked) return;
    e.preventDefault();

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(blockMeshes);

    if (intersects.length === 0) return;

    const intersect = intersects[0];
    const normal = intersect.face.normal;
    const point = intersect.point;

    // Posição exata do bloco atingido
    const bx = Math.floor(point.x - normal.x * 0.001);
    const by = Math.floor(point.y - normal.y * 0.001);
    const bz = Math.floor(point.z - normal.z * 0.001);

    if (e.button === 0) { // ESQUERDO = QUEBRAR
        removeBlock(bx, by, bz);
    } 
    else if (e.button === 2) { // DIREITO = COLOCAR
        // Posição do novo bloco (do lado da face)
        const placeX = bx + normal.x;
        const placeY = by + normal.y;
        const placeZ = bz + normal.z;

        // Não colocar dentro do jogador
        const dx = placeX + 0.5 - camera.position.x;
        const dy = placeY + 0.5 - camera.position.y;
        const dz = placeZ + 0.5 - camera.position.z;
        if (dx * dx + dy * dy + dz * dz > 2) {
            addBlock(placeX, placeY, placeZ, selectedBlockType);
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// ====================== LOOP PRINCIPAL ======================
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.35;

    // Movimento WASD (horizontal) + Space/Shift (vertical)
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    const right   = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));

    if (keys['w']) camera.position.addScaledVector(forward, speed);
    if (keys['s']) camera.position.addScaledVector(forward, -speed);
    if (keys['a']) camera.position.addScaledVector(right, -speed);
    if (keys['d']) camera.position.addScaledVector(right, speed);
    if (keys[' ']) camera.position.y += speed;
    if (keys['shift']) camera.position.y -= speed;

    // Raycasting para destacar o bloco (a "seta" que acompanha o mouse)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(blockMeshes);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const pos = intersect.point.clone().add(intersect.face.normal.clone().multiplyScalar(0.001));
        const bx = Math.floor(pos.x);
        const by = Math.floor(pos.y);
        const bz = Math.floor(pos.z);

        highlight.position.set(bx + 0.5, by + 0.5, bz + 0.5);
        highlight.visible = true;
    } else {
        highlight.visible = false;
    }

    renderer.render(scene, camera);
}

// ====================== INICIALIZAÇÃO ======================
function init() {
    generateWorld();
    createHotbar();
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / (window.innerHeight - 56);
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 56);
    });

    console.log('%c✅ MiniCraft 3D carregado! Raycasting + destaque do bloco funcionando!', 'color:#4caf50;font-size:16px');
}

window.onload = init;