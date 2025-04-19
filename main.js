let scene, camera, renderer;
let currentPlayer = 1;
let gameMode = 'pvp';
let boardState = Array(9).fill(0);
let score = { 1: 0, 2: 0 };
const CELL_SIZE = 1;
const API_URL = 'http://127.0.0.1:5000/predict';
let clickableCells = [];
let lastStartingPlayer = 2; 
let winningCombo = null;


function selectMode(mode) {
  document.getElementById('pvpBtn').classList.remove('active');
  document.getElementById('pvcBtn').classList.remove('active');
  document.getElementById(mode + 'Btn').classList.add('active');
  startGame(mode);
}

function startGame(mode) {
  gameMode = mode;
  winningCombo = null;
  currentPlayer = lastStartingPlayer === 1 ? 2 : 1;
  lastStartingPlayer = currentPlayer;
  boardState = Array(9).fill(0);
  hideWinModal();
  document.getElementById('difficultyContainer').style.display =
    mode === 'pvc' ? 'inline' : 'none';
  buildBoard();
  setTimeout(() => {
    buildBoard();
    updateTurnText();
    if (gameMode === 'pvc' && currentPlayer === 2) {
      handleComputerMove();
    }
  }, 100);
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('gameCanvas'),
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0xffffff); // white background
  renderer.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  buildBoard();
  animate();
}

function checkWin(player) {
  const w = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const combo of w) {
    if (combo.every(i => boardState[i] === player)) {
      winningCombo = combo; // store it
      return true;
    }
  }
  return false;
}


document.getElementById('restartBtn').addEventListener('click', (e) => {
  e.stopPropagation();      
  hideWinModal();           

  setTimeout(() => {
    startGame(gameMode);    
  }, 50); 
});

function handleComputerMove() {
  const difficulty = document.getElementById('difficulty').value;
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: boardState, difficulty }),
  })
  .then(res => res.json())
  .then(data => {
    boardState[data.move] = currentPlayer;
    if (checkWin(currentPlayer)) {
      showWinModal("Computer Wins!");
      score[2]++;
      updateScore();
      return;
    }
    if (boardState.every(cell => cell !== 0)) {
      showWinModal("It's a Draw!");
      return;
    }
    currentPlayer = 1;
    buildBoard();
    updateTurnText();
  });
}


function makeX(color = 0xff3333) {
  const arm = new THREE.BoxGeometry(0.8, 0.15, 0.15);
  const mat = new THREE.MeshBasicMaterial({ color });
  const a = new THREE.Mesh(arm, mat);
  const b = new THREE.Mesh(arm, mat);
  a.rotation.z = Math.PI / 4;
  b.rotation.z = -Math.PI / 4;
  const group = new THREE.Group();
  group.add(a, b);
  return group;
}

function makeO(color = 0x3399ff) {
  const geo = new THREE.TorusGeometry(0.4, 0.1, 16, 32);
  const mat = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

function buildBoard() {
    clickableCells = [];
    while (scene.children.length) scene.remove(scene.children[0]);
  
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = col - 1;
      const y = 1 - row;
  
      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE)),
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      border.position.set(x, y, 0);
      scene.add(border);
  
      if (boardState[i] === 1) {
        const color = winningCombo?.includes(i) ? 0x00cc00 : 0xff3333;
        const xMesh = makeX(color);
        xMesh.position.set(x, y, 0.05);
        scene.add(xMesh);
      } else if (boardState[i] === 2) {
        const color = winningCombo?.includes(i) ? 0x00cc00 : 0x3399ff;
        const oMesh = makeO(color);
        oMesh.position.set(x, y, 0.05);
        scene.add(oMesh);
      } else {
        const cell = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        );
        cell.position.set(x, y, 0.1); // ensure it's on top
        cell.userData.index = i;
        cell.callback = () => onCellClick(i);
        clickableCells.push(cell);
        scene.add(cell);
      }
    }
  }
  

function onCellClick(index) {
  if (boardState[index] !== 0) return;
  boardState[index] = currentPlayer;

  if (checkWin(currentPlayer)) {
    const name = getPlayerName(currentPlayer);
    showWinModal(`${name} Wins!`);
    score[currentPlayer]++;
    updateScore();
    return;
  }

  if (boardState.every(cell => cell !== 0)) {
    showWinModal("It's a Draw!");
    return;
  }

  currentPlayer = 3 - currentPlayer;
  buildBoard();
  updateTurnText();

  if (gameMode === 'pvc' && currentPlayer === 2) {
    handleComputerMove();
  }
}

function checkWin(player) {
  const w = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  return w.some(combo => combo.every(i => boardState[i] === player));
}

function getPlayerName(player) {
  if (gameMode === 'pvc' && player === 2) return 'Computer';
  return document.getElementById(`player${player}Name`).value || `Player ${player}`;
}

function updateScore() {
  document.getElementById('score1').textContent = `Score: ${score[1]}`;
  document.getElementById('score2').textContent = `Score: ${score[2]}`;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function showWinModal(text) {
  document.getElementById('winMessage').textContent = text;
  document.getElementById('winModal').style.display = 'flex';
}

function hideWinModal() {
  document.getElementById('winModal').style.display = 'none';
}

function updateTurnText() {
  const turnText = (gameMode === 'pvc' && currentPlayer === 2)
    ? "Computer's Turn"
    : `${getPlayerName(currentPlayer)}'s Turn`;
  document.getElementById('turnIndicator').textContent = turnText;
}


window.addEventListener('click', (e) => {
    const modal = document.getElementById('winModal');
    if (modal.style.display === 'flex') return; // block clicks if modal is open
  
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(clickableCells);
    if (hits.length && hits[0].object.callback) hits[0].object.callback();
  });
  
  
init();


  
  
