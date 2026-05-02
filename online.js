// ── Online Multiplayer Client ──────────────────────────────────────────────────
// Connects to server via Socket.io when user selects "Online" mode
// Hooks into main.js's displayMove to relay moves to opponent

let onlineSocket = null;
let onlineRoomId = null;
let onlineColor = null; // 'white' | 'black'
let onlineActive = false;

// Called when game mode changes (wired via updateGameOptions in main.js)
window.initOnlineMode = function () {
  const user = JSON.parse(localStorage.getItem('chess_user') || 'null');
  const name = user ? user.username : 'Guest_' + Math.floor(Math.random() * 9999);

  setOnlineStatus('⏳ Connecting to server...', '#d4a84a');

  if (onlineSocket) onlineSocket.disconnect();

  onlineSocket = io('http://localhost:4000');

  onlineSocket.on('connect', () => {
    setOnlineStatus('🔍 Finding opponent...', '#80c0ff');
    onlineSocket.emit('findMatch', { username: name });
  });

  onlineSocket.on('waiting', () => {
    setOnlineStatus('⏳ Waiting for opponent...', '#d4a84a');

    // Auto-fallback to local bot if no match after 5s
    setTimeout(() => {
      if (!onlineActive && onlineSocket) {
        onlineSocket.disconnect(); // stop waiting on server

        onlineRoomId = 'bot_room_' + Math.floor(Math.random() * 10000);
        onlineColor = 'white';
        onlineActive = true;
        window.isOnlineBotMatch = true;

        setOnlineStatus(`✅ Playing vs Server Bot — You are WHITE`, '#80e080');

        const pW = document.getElementById('player-white');
        const pB = document.getElementById('player-black');
        if (pW) pW.textContent = name.toUpperCase() + ' (YOU)';
        if (pB) pB.textContent = 'SERVER BOT';

        if (typeof getinit === 'function') getinit();
      }
    }, 5000);
  });

  onlineSocket.on('matchFound', ({ roomId, color, opponent }) => {
    onlineRoomId = roomId;
    onlineColor = color;
    onlineActive = true;

    setOnlineStatus(`✅ Playing vs ${opponent} — You are ${color.toUpperCase()}`, '#80e080');

    // Show player names
    const pW = document.getElementById('player-white');
    const pB = document.getElementById('player-black');
    if (color === 'white') {
      if (pW) pW.textContent = name.toUpperCase() + ' (YOU)';
      if (pB) pB.textContent = opponent.toUpperCase();
    } else {
      if (pB) pB.textContent = name.toUpperCase() + ' (YOU)';
      if (pW) pW.textContent = opponent.toUpperCase();
    }

    // Reset board for fresh game
    if (typeof getinit === 'function') getinit();
  });

  // Receive opponent's move
  onlineSocket.on('opponentMove', ({ from, to, promotion }) => {
    if (!onlineActive) return;
    const legalSquares = getPossibleMoves(from, {
      pieceColor: onlineColor === 'white' ? 'black' : 'white',
      pieceType: getPieceAtSquare(from, boardSquaresArray).pieceType,
      pieceId: getPieceAtSquare(from, boardSquaresArray).pieceId
    }, boardSquaresArray);
    displayMove(from, to, legalSquares);
  });

  // Chat
  onlineSocket.on('chat', ({ from, msg }) => {
    showChatToast(from + ': ' + msg);
  });

  // Opponent resigned
  onlineSocket.on('opponentResigned', ({ msg }) => {
    setOnlineStatus('🏆 ' + msg, '#80e080');
    if (typeof showGameOver === 'function') showGameOver('Opponent Resigned – YOU WIN!');
    onlineActive = false;
  });

  onlineSocket.on('opponentDisconnected', ({ msg }) => {
    setOnlineStatus('⚠️ ' + msg, '#ff9060');
    onlineActive = false;
  });

  onlineSocket.on('drawOffered', ({ from }) => {
    const accept = confirm(from + ' offers a draw. Accept?');
    if (accept) {
      onlineSocket.emit('acceptDraw', { roomId: onlineRoomId });
    } else {
      onlineSocket.emit('declineDraw', { roomId: onlineRoomId });
    }
  });

  onlineSocket.on('drawAccepted', () => {
    if (typeof showGameOver === 'function') showGameOver('Draw Agreed!');
    onlineActive = false;
  });

  onlineSocket.on('drawDeclined', () => {
    setOnlineStatus('Draw declined.', '#ff9060');
  });

  onlineSocket.on('connect_error', () => {
    setOnlineStatus('❌ Cannot connect to server. Start server first.', '#ff6060');
  });
};

// Send a move to opponent
window.sendOnlineMove = function (from, to, promotion) {
  if (onlineSocket && onlineRoomId && onlineActive) {
    onlineSocket.emit('move', { roomId: onlineRoomId, from, to, promotion });
  }
};

// Resign button for online
window.onlineResign = function () {
  if (onlineSocket && onlineRoomId) {
    onlineSocket.emit('resign', { roomId: onlineRoomId });
    onlineActive = false;
    setOnlineStatus('You resigned.', '#ff9060');
  }
};

// Offer draw
window.onlineOfferDraw = function () {
  if (onlineSocket && onlineRoomId) {
    onlineSocket.emit('offerDraw', { roomId: onlineRoomId });
    setOnlineStatus('Draw offered...', '#d4a84a');
  }
};

// Helper: update the status bar
function setOnlineStatus(msg, color) {
  const el = document.getElementById('online-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || '#f0c870';
  el.style.display = 'block';
}

// Helper: small chat toast
function showChatToast(msg) {
  const el = document.createElement('div');
  el.textContent = '💬 ' + msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '120px', left: '20px',
    background: 'rgba(20,8,0,.9)', border: '1px solid #4a2a08',
    borderRadius: '8px', padding: '8px 14px',
    fontFamily: "'Cinzel',serif", fontSize: '.82rem', color: '#d4a84a',
    zIndex: 50000, animation: 'coinFloat 3s ease forwards'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// Patch updateGameOptions to detect online mode
const _origUpdateGameOptions = window.updateGameOptions;
window.updateGameOptions = function () {
  if (typeof _origUpdateGameOptions === 'function') _origUpdateGameOptions();
  const mode = document.getElementById('gameMode')?.value;
  const statusEl = document.getElementById('online-status');
  if (mode === 'online') {
    const user = JSON.parse(localStorage.getItem('chess_user') || 'null');
    if (!user) {
      if (statusEl) { statusEl.textContent = '⚠️ Please LOGIN to use Online mode'; statusEl.style.color = '#ff9060'; statusEl.style.display = 'block'; }
      document.getElementById('gameMode').value = 'localMultiplayer';
      setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
      return;
    }
    initOnlineMode();
  } else {
    if (statusEl) statusEl.style.display = 'none';
    if (onlineSocket) { onlineSocket.disconnect(); onlineSocket = null; onlineActive = false; }
  }
};

// Patch displayMove to relay moves when online
const _origDisplayMove = window.displayMove;
// We patch AFTER main.js loads (DOMContentLoaded is too early, use a tiny delay)
window.addEventListener('load', () => {
  const orig = window.displayMove;
  if (!orig) return;
  window.displayMove = function (from, to, legal) {
    orig(from, to, legal);
    // only relay our own moves
    if (onlineActive && onlineColor) {
      const myTurn = (onlineColor === 'white' && !isWhiteTurn) || (onlineColor === 'black' && isWhiteTurn);
      // isWhiteTurn flipped AFTER the move, so check opposite
      if (myTurn) {
        if (window.isOnlineBotMatch) {
          // Trigger local bot to respond
          setTimeout(() => {
            if (typeof getBestMoveAI === 'function') {
              getBestMoveAI(boardSquaresArray, 3, (bestMoveStr) => {
                if (!bestMoveStr) return;
                const fromSq = bestMoveStr.slice(0, 2);
                const toSq = bestMoveStr.slice(2, 4);
                const legalSq = getPossibleMoves(fromSq, {
                  pieceColor: 'black',
                  pieceType: getPieceAtSquare(fromSq, boardSquaresArray).pieceType,
                  pieceId: getPieceAtSquare(fromSq, boardSquaresArray).pieceId
                }, boardSquaresArray);
                orig(fromSq, toSq, legalSq);
              });
            }
          }, 800);
        } else {
          sendOnlineMove(from, to, null);
        }
      }
    }
  };
});
