/* Connect4-Futuristic
   PvP + simple AI (Easy/Medium/Hard)
   Features: undo, reset, scoreboard, win highlight, sounds (optional)
*/

const ROWS = 6, COLS = 7;
let board = [];               // 2D array [row][col]
let current = 1;              // 1 => red (player1), -1 => yellow (player2 or AI)
let history = [];             // stack of moves {r,c,player}
let gameOver = false;
let p1Score = 0, p2Score = 0;
let mute = false;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');
const muteBtn = document.getElementById('muteBtn');
const aiDifficulty = document.getElementById('aiDifficulty');
const p1scoreEl = document.getElementById('p1score');
const p2scoreEl = document.getElementById('p2score');

const dropSound = document.getElementById('dropSound');
const winSound = document.getElementById('winSound');

function playSound(el){
  if(mute) return;
  if(!el) return;
  try { el.currentTime = 0; el.play(); } catch(e){}
}

function resetBoard(){
  board = Array.from({length:ROWS}, ()=> Array(COLS).fill(0));
  history = [];
  current = 1;
  gameOver = false;
  renderBoard();
  updateStatus();
  boardEl.style.pointerEvents = 'auto';
}

function renderBoard(){
  boardEl.innerHTML = '';
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r; cell.dataset.col = c;
      if(board[r][c] === 1) cell.classList.add('red');
      if(board[r][c] === -1) cell.classList.add('yellow');
      boardEl.appendChild(cell);
    }
  }
}

function updateStatus(msg){
  if(msg){ statusEl.textContent = msg; return; }
  if(gameOver) return;
  statusEl.textContent = current === 1 ? "Player 1's Turn (🔴)" : (isPvP()? "Player 2's Turn (🟡)" : "AI's Turn (🟡)");
}

function isPvP(){
  return document.querySelector('input[name="mode"]:checked').value === 'pvp';
}

function columnDrop(col){
  if(gameOver) return false;
  for(let r=ROWS-1;r>=0;r--){
    if(board[r][col] === 0){
      board[r][col] = current;
      history.push({r,c:col,player:current});
      animateDrop(r,col,current);
      playSound(dropSound);
      const win = checkWin(r,col,current);
      if(win){
        gameOver = true;
        highlightWin(win);
        updateScores(current);
        updateStatus((current===1? "Player 1 (🔴) Wins!" : (isPvP()? "Player 2 (🟡) Wins!" : "AI (🟡) Wins!")));
        playSound(winSound);
        boardEl.style.pointerEvents = 'none';
      } else {
        if(isBoardFull()){
          gameOver = true;
          updateStatus("It's a Draw!");
        } else {
          current *= -1;
          updateStatus();
          if(!isPvP() && current === -1 && !gameOver){
            // AI move after short delay
            setTimeout(()=> aiMove(), 300);
          }
        }
      }
      return true;
    }
  }
  return false;
}

function isBoardFull(){
  return board[0].every(cell => cell!==0);
}

function animateDrop(r,c,player){
  // just re-render; visuals are CSS-based
  renderBoard();
}

/* win detection: returns array of winning positions if win else null */
function checkWin(r,c,player){
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    const line = [{r,c}];
    // forward
    let rr=r+dr, cc=c+dc;
    while(inBounds(rr,cc) && board[rr][cc]===player){ line.push({r:rr,c:cc}); rr+=dr; cc+=dc; }
    // backward
    rr=r-dr; cc=c-dc;
    while(inBounds(rr,cc) && board[rr][cc]===player){ line.push({r:rr,c:cc}); rr-=dr; cc-=dc; }
    if(line.length>=4) return line;
  }
  return null;
}

function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

function highlightWin(cells){
  // add .win to cells
  const all = document.querySelectorAll('.cell');
  cells.forEach(pos=>{
    // find element with data-row/col
    for(const el of all){
      if(+el.dataset.row===pos.r && +el.dataset.col===pos.c){
        el.classList.add('win');
      }
    }
  });
}

/* Undo */
undoBtn.addEventListener('click', ()=>{
  if(history.length===0 || gameOver) return;
  const last = history.pop();
  board[last.r][last.c] = 0;
  current = last.player;
  renderBoard();
  gameOver = false;
  boardEl.style.pointerEvents = 'auto';
  updateStatus();
});

/* Reset */
resetBtn.addEventListener('click', ()=> {
  resetBoard();
});

/* Mute */
muteBtn.addEventListener('click', ()=>{
  mute = !mute;
  muteBtn.textContent = mute ? '🔇' : '🔊';
});

/* Click handling: drop into column clicked */
boardEl.addEventListener('click', (e)=>{
  const cell = e.target.closest('.cell');
  if(!cell || gameOver) return;
  const col = +cell.dataset.col;
  // find top-most row that is empty is handled in columnDrop
  if(columnDrop(col)){
    // success
  }
});

/* Score update */
function updateScores(player){
  if(player===1) p1Score++;
  else p2Score++;
  p1scoreEl.textContent = p1Score;
  p2scoreEl.textContent = p2Score;
}

/* --- AI logic --- 
   We'll implement a lightweight AI:
   - easy: random valid column
   - medium: heuristic scoring of columns (lookahead 2)
   - hard: minimax with depth 4 and simple heuristic
*/
function aiMove(){
  if(gameOver) return;
  const diff = aiDifficulty.value;
  let col;
  if(diff==='easy') col = getRandomMove();
  else if(diff==='medium') col = getBestMove(2); // small depth
  else col = getBestMove(4); // harder
  if(col===null || col===undefined) col = getRandomMove();
  columnDrop(col);
}

/* Random valid move */
function getRandomMove(){
  const moves = [];
  for(let c=0;c<COLS;c++) if(board[0][c]===0) moves.push(c);
  if(moves.length===0) return null;
  return moves[Math.floor(Math.random()*moves.length)];
}

/* Simple heuristic evaluation for board for player (1 or -1) */
function evaluateBoard(tempBoard){
  // scoring patterns: center control, 2/3 in a row, block opponent
  let score = 0;
  const centerCol = Math.floor(COLS/2);
  // center column preference
  for(let r=0;r<ROWS;r++){
    if(tempBoard[r][centerCol] === -1) score += 3; // AI is -1
    else if(tempBoard[r][centerCol] === 1) score -= 3;
  }
  // check all windows of 4
  const windowScore = (windowArr)=>{
    let s=0, aiCount=0, plCount=0, empty=0;
    for(const v of windowArr){
      if(v===-1) aiCount++;
      else if(v===1) plCount++;
      else empty++;
    }
    if(aiCount===4) s += 1000;
    else if(aiCount===3 && empty===1) s += 50;
    else if(aiCount===2 && empty===2) s += 10;

    if(plCount===3 && empty===1) s -= 80; // block
    if(plCount===2 && empty===2) s -= 5;
    return s;
  };

  // horizontal windows
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS-3;c++){
      const win = [tempBoard[r][c], tempBoard[r][c+1], tempBoard[r][c+2], tempBoard[r][c+3]];
      score += windowScore(win);
    }
  }
  // vertical
  for(let c=0;c<COLS;c++){
    for(let r=0;r<ROWS-3;r++){
      const win = [tempBoard[r][c], tempBoard[r+1][c], tempBoard[r+2][c], tempBoard[r+3][c]];
      score += windowScore(win);
    }
  }
  // diag down-right
  for(let r=0;r<ROWS-3;r++){
    for(let c=0;c<COLS-3;c++){
      const win = [tempBoard[r][c], tempBoard[r+1][c+1], tempBoard[r+2][c+2], tempBoard[r+3][c+3]];
      score += windowScore(win);
    }
  }
  // diag down-left
  for(let r=0;r<ROWS-3;r++){
    for(let c=3;c<COLS;c++){
      const win = [tempBoard[r][c], tempBoard[r+1][c-1], tempBoard[r+2][c-2], tempBoard[r+3][c-3]];
      score += windowScore(win);
    }
  }
  return score;
}

/* Simulate dropping on temp board */
function simulateDrop(tempBoard, col, player){
  for(let r=ROWS-1;r>=0;r--){
    if(tempBoard[r][col]===0){ tempBoard[r][col]=player; return true; }
  }
  return false;
}

/* Return best column using minimax-like search with alpha-beta (depth small) */
function getBestMove(depth){
  const validCols = [];
  for(let c=0;c<COLS;c++) if(board[0][c]===0) validCols.push(c);
  if(validCols.length===0) return null;

  let bestScore = -Infinity, bestCol = validCols[0];
  for(const col of validCols){
    const temp = board.map(r=>r.slice());
    simulateDrop(temp,col,-1); // AI plays as -1
    const score = minimax(temp, depth-1, false, -Infinity, Infinity);
    if(score > bestScore){
      bestScore = score; bestCol = col;
    }
  }
  return bestCol;
}

/* minimax with alpha-beta */
function minimax(tempBoard, depth, maximizing, alpha, beta){
  // check terminal
  if(depth===0) return evaluateBoard(tempBoard);

  // check immediate win / loss
  if(checkImmediateWin(tempBoard, -1)) return 1000000;
  if(checkImmediateWin(tempBoard, 1)) return -1000000;

  const validCols = [];
  for(let c=0;c<COLS;c++) if(tempBoard[0][c]===0) validCols.push(c);
  if(validCols.length===0) return 0;

  if(maximizing){
    let value = -Infinity;
    for(const col of validCols){
      const tb = tempBoard.map(r=>r.slice());
      simulateDrop(tb,col,-1);
      value = Math.max(value, minimax(tb, depth-1, false, alpha, beta));
      alpha = Math.max(alpha, value);
      if(alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for(const col of validCols){
      const tb = tempBoard.map(r=>r.slice());
      simulateDrop(tb,col,1);
      value = Math.min(value, minimax(tb, depth-1, true, alpha, beta));
      beta = Math.min(beta, value);
      if(alpha >= beta) break;
    }
    return value;
  }
}

/* check immediate win for player on temp board */
function checkImmediateWin(tempBoard, player){
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(tempBoard[r][c]!==player) continue;
      if(checkWinTemp(tempBoard,r,c,player)) return true;
    }
  }
  return false;
}
function checkWinTemp(tb,r,c,player){
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    let cnt = 1;
    let rr=r+dr, cc=c+dc;
    while(inBounds(rr,cc) && tb[rr][cc]===player){ cnt++; rr+=dr; cc+=dc; }
    rr=r-dr; cc=c-dc;
    while(inBounds(rr,cc) && tb[rr][cc]===player){ cnt++; rr-=dr; cc-=dc; }
    if(cnt>=4) return true;
  }
  return false;
}

/* Utils */
function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

/* Initialize and set up */
resetBoard(); // create empty board

// update when mode selection changes (if PvP and it was AI's turn, nothing)
document.querySelectorAll('input[name="mode"]').forEach(el=>{
  el.addEventListener('change', ()=>{
    resetBoard();
  });
});