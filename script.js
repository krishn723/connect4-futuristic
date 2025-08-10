let board = [];
let currentPlayer = 'red';
let gameOver = false;
let mode = '';
let difficulty = 'easy';

const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const lobby = document.getElementById('lobby');
const gameSection = document.getElementById('game-section');
const difficultyContainer = document.getElementById('difficulty-container');

function setMode(selectedMode) {
    mode = selectedMode;
    if (mode === 'ai') {
        difficultyContainer.classList.remove('hidden');
    } else {
        difficultyContainer.classList.add('hidden');
    }
}

function setDifficulty(level) {
    difficulty = level;
}

function startGame() {
    if (!mode) {
        alert("Please select a game mode.");
        return;
    }
    if (mode === 'ai' && !difficulty) {
        alert("Please select AI difficulty.");
        return;
    }
    initBoard();
    lobby.classList.add('hidden');
    gameSection.classList.remove('hidden');
}

function initBoard() {
    board = Array(6).fill().map(() => Array(7).fill(''));
    renderBoard();
    currentPlayer = 'red';
    gameOver = false;
    turnIndicator.textContent = "Player 1's Turn (Red)";
}

function renderBoard() {
    boardElement.innerHTML = '';
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            if (cell) cellDiv.classList.add(cell);
            cellDiv.addEventListener('click', () => handleMove(c));
            boardElement.appendChild(cellDiv);
        });
    });
}

function handleMove(col) {
    if (gameOver) return;

    for (let r = 5; r >= 0; r--) {
        if (!board[r][col]) {
            board[r][col] = currentPlayer;
            break;
        }
    }

    renderBoard(); // Show last move immediately

    if (checkWin(currentPlayer)) {
        turnIndicator.textContent = `${capitalize(currentPlayer)} Wins!`;
        gameOver = true;
        return;
    }

    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    turnIndicator.textContent = `${capitalize(currentPlayer)}'s Turn`;

    if (mode === 'ai' && currentPlayer === 'yellow' && !gameOver) {
        setTimeout(aiMove, 300);
    }
}

function aiMove() {
    let move;
    if (difficulty === 'easy') {
        move = getRandomMove();
    } else {
        move = getBestMove(difficulty === 'hard' ? 5 : 2);
    }
    handleMove(move);
}

function getRandomMove() {
    let available = [];
    for (let c = 0; c < 7; c++) {
        if (!board[0][c]) available.push(c);
    }
    return available[Math.floor(Math.random() * available.length)];
}

function getBestMove(depth) {
    let bestScore = -Infinity;
    let bestCol = null;
    for (let c = 0; c < 7; c++) {
        let r = getAvailableRow(c);
        if (r !== null) {
            board[r][c] = 'yellow';
            let score = minimax(board, depth - 1, false, -Infinity, Infinity);
            board[r][c] = '';
            if (score > bestScore) {
                bestScore = score;
                bestCol = c;
            }
        }
    }
    return bestCol !== null ? bestCol : getRandomMove();
}

function minimax(board, depth, isMaximizing, alpha, beta) {
    if (checkWin('yellow')) return 1000 + depth;
    if (checkWin('red')) return -1000 - depth;
    if (depth === 0 || isBoardFull()) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let c = 0; c < 7; c++) {
            let r = getAvailableRow(c);
            if (r !== null) {
                board[r][c] = 'yellow';
                let eval = minimax(board, depth - 1, false, alpha, beta);
                board[r][c] = '';
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let c = 0; c < 7; c++) {
            let r = getAvailableRow(c);
            if (r !== null) {
                board[r][c] = 'red';
                let eval = minimax(board, depth - 1, true, alpha, beta);
                board[r][c] = '';
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
        }
        return minEval;
    }
}

function getAvailableRow(col) {
    for (let r = 5; r >= 0; r--) {
        if (!board[r][col]) return r;
    }
    return null;
}

function isBoardFull() {
    return board[0].every(cell => cell);
}

function checkWin(player) {
    // Horizontal, vertical, diagonal checks
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
        }
    }
    for (let c = 0; c < 7; c++) {
        for (let r = 0; r < 3; r++) {
            if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
        }
    }
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
        }
    }
    for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) return true;
        }
    }
    return false;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function restartGame() {
    lobby.classList.remove('hidden');
    gameSection.classList.add('hidden');
    mode = '';
}