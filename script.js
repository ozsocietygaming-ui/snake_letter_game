
// Pixel Snake: Letter Quest
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cell = 24; // pixel size
const cols = canvas.width / cell; // 20
const rows = canvas.height / cell; // 20

const sequence = ['A','Y','O','U','B','-','D','E','R','R','E','C','H','E']; // target order
let seqIndex = 0;
let targetPos = null;

let snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}];
let dir = {x:1,y:0};
let pendingDir = null;
let speed = 8; // frames per second
let tick = 0;
let running = true;
let score = 0;

const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restart');
const nextLetterEl = document.getElementById('nextLetter');
const lenEl = document.getElementById('len');
const controls = document.getElementById('controls');

// show initial
nextLetterEl.textContent = sequence[seqIndex];

// spawn first letter
function placeTarget() {
  // place at random empty cell
  while(true) {
    const x = Math.floor(Math.random()*cols);
    const y = Math.floor(Math.random()*rows);
    if(!snake.some(s=>s.x===x && s.y===y)) {
      targetPos = {x,y};
      break;
    }
  }
}
placeTarget();

// draw pixelated world
function draw() {
  // background warm checker
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      ctx.fillStyle = (c%2===0) ? '#fff3e0' : '#ffe8cc';
      ctx.fillRect(c*cell, r*cell, cell, cell);
    }
  }
  // draw grid subtle lines
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  for(let i=0;i<=cols;i++){ ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke(); }
  for(let i=0;i<=rows;i++){ ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke(); }

  // draw target letter or star
  ctx.save();
  if(seqIndex < sequence.length){
    // draw tile
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, targetPos.x*cell+3, targetPos.y*cell+3, cell-6, cell-6, 4, true, false);
    // letter
    ctx.fillStyle = '#5b3b23';
    ctx.font = (cell-8)+'px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline='middle';
    ctx.fillText(sequence[seqIndex], targetPos.x*cell + cell/2, targetPos.y*cell + cell/2 + 1);
  } else {
    // star finish
    ctx.fillStyle = '#ffd54a';
    drawStar(ctx, targetPos.x*cell + cell/2, targetPos.y*cell + cell/2, cell/2 - 4);
  }
  ctx.restore();

  // draw snake (head with brighter color)
  for(let i=snake.length-1;i>=0;i--){
    const s = snake[i];
    const shade = i===snake.length-1 ? '#4b3832' : '#7b5a45';
    ctx.fillStyle = shade;
    roundRect(ctx, s.x*cell+2, s.y*cell+2, cell-4, cell-4, 5, true, false);
    // small eye on head
    if(i===snake.length-1){
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(s.x*cell + cell - 9, s.y*cell + 6, 4, 4);
    }
  }
}

// helpers
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for(let i=0;i<5;i++){
    ctx.lineTo(cx + r * Math.cos((18 + i*72)*Math.PI/180), cy - r * Math.sin((18 + i*72)*Math.PI/180));
    ctx.lineTo(cx + (r/2.5) * Math.cos((54 + i*72)*Math.PI/180), cy - (r/2.5) * Math.sin((54 + i*72)*Math.PI/180));
  }
  ctx.closePath();
  ctx.fill();
}

// game tick
function step() {
  if(!running) return;
  tick++;
  // apply pending direction
  if(pendingDir) { dir = pendingDir; pendingDir = null; }

  // move snake head
  const head = {x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y};

  // wrap around edges
  if(head.x < 0) head.x = cols - 1;
  if(head.x >= cols) head.x = 0;
  if(head.y < 0) head.y = rows - 1;
  if(head.y >= rows) head.y = 0;

  // check self-collision -> game over
  if(snake.some(seg => seg.x===head.x && seg.y===head.y)){
    endGame(false);
    return;
  }

  // add head
  snake.push(head);

  // check target eaten
  if(head.x === targetPos.x && head.y === targetPos.y){
    // if there are still letters, advance sequence
    if(seqIndex < sequence.length){
      seqIndex++;
      lenEl.textContent = snake.length;
      // grow: do NOT remove tail (we already grew by pushing head)
      if(seqIndex < sequence.length){
        placeTarget();
        nextLetterEl.textContent = sequence[seqIndex];
      } else {
        // all letters eaten -> spawn star
        placeTarget();
        nextLetterEl.textContent = '★';
      }
    } else {
      // star eaten -> win
      endGame(true);
      return;
    }
  } else {
    // normal move: remove tail to keep length
    snake.shift();
  }

  // speed scaling: as snake length grows, increase fps indirectly
  const baseSpeed = 8;
  speed = baseSpeed + Math.floor(snake.length / 3);

  draw();
}

// input handlers
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp' || e.key === 'w') { if(dir.y!==1) pendingDir = {x:0,y:-1}; }
  if(e.key === 'ArrowDown' || e.key === 's') { if(dir.y!==-1) pendingDir = {x:0,y:1}; }
  if(e.key === 'ArrowLeft' || e.key === 'a') { if(dir.x!==1) pendingDir = {x:-1,y:0}; }
  if(e.key === 'ArrowRight' || e.key === 'd') { if(dir.x!==-1) pendingDir = {x:1,y:0}; }
});

// mobile controls
document.getElementById('up').addEventListener('click', ()=>{ if(dir.y!==1) pendingDir={x:0,y:-1}; });
document.getElementById('down').addEventListener('click', ()=>{ if(dir.y!==-1) pendingDir={x:0,y:1}; });
document.getElementById('left').addEventListener('click', ()=>{ if(dir.x!==1) pendingDir={x:-1,y:0}; });
document.getElementById('right').addEventListener('click', ()=>{ if(dir.x!==-1) pendingDir={x:1,y:0}; });

// show controls for small devices
if(window.innerWidth < 600) document.getElementById('controls').classList.remove('hidden');

// main loop timing
let lastTime = performance.now();
function mainLoop(now){
  const delta = now - lastTime;
  const interval = 1000 / speed;
  if(delta >= interval){
    lastTime = now - (delta % interval);
    step();
  }
  if(running) requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

function placeTarget(){
  while(true){
    const x = Math.floor(Math.random()*cols);
    const y = Math.floor(Math.random()*rows);
    if(!snake.some(s=>s.x===x && s.y===y)){
      targetPos = {x,y};
      break;
    }
  }
}

function endGame(win){
  running = false;
  overlay.classList.remove('hidden');
  overlay.style.position = 'absolute'; overlay.style.left=0; overlay.style.top=0; overlay.style.width='100%'; overlay.style.height='100%';
  overlayText.textContent = win ? 'You Win! ⭐ All letters collected.' : 'Game Over! You collided with yourself.';
}

restartBtn.addEventListener('click', ()=>{
  // reset state
  seqIndex = 0; nextLetterEl.textContent = sequence[seqIndex];
  snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}];
  dir = {x:1,y:0}; pendingDir=null; speed=8; tick=0; running=true; score=0; lenEl.textContent = snake.length;
  placeTarget();
  overlay.classList.add('hidden');
  requestAnimationFrame(mainLoop);
});

// initial HUD update
lenEl.textContent = snake.length;
