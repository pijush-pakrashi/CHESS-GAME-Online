require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/api/auth', require('./routes/auth'));

// ── Online Multiplayer via Socket.io ─────────────────────────────────────────
const rooms    = new Map(); // roomId → { white, black, fen, moves }
const waiting  = [];        // players waiting for a match

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  // Find or create a match
  socket.on('findMatch', ({ username }) => {
    socket.username = username || 'Guest';

    if (waiting.length > 0) {
      const opponent = waiting.shift();
      const roomId   = socket.id + '_' + opponent.id;

      rooms.set(roomId, {
        white: opponent.id, black: socket.id,
        whiteName: opponent.username, blackName: socket.username,
        fen: 'start', moves: []
      });

      socket.join(roomId);
      opponent.join(roomId);

      io.to(opponent.id).emit('matchFound', { roomId, color: 'white', opponent: socket.username });
      io.to(socket.id).emit('matchFound',   { roomId, color: 'black', opponent: opponent.username });
      console.log(`♟ Room ${roomId}: ${opponent.username} (W) vs ${socket.username} (B)`);
    } else {
      waiting.push(socket);
      socket.emit('waiting', { msg: 'Waiting for opponent...' });
    }
  });

  // Relay moves
  socket.on('move', ({ roomId, from, to, promotion }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.moves.push({ from, to, promotion });
    socket.to(roomId).emit('opponentMove', { from, to, promotion });
  });

  // Chat in room
  socket.on('chat', ({ roomId, msg }) => {
    socket.to(roomId).emit('chat', { from: socket.username, msg });
  });

  // Resign
  socket.on('resign', ({ roomId }) => {
    socket.to(roomId).emit('opponentResigned', { msg: socket.username + ' resigned!' });
    rooms.delete(roomId);
  });

  // Offer draw
  socket.on('offerDraw', ({ roomId }) => {
    socket.to(roomId).emit('drawOffered', { from: socket.username });
  });
  socket.on('acceptDraw', ({ roomId }) => {
    io.to(roomId).emit('drawAccepted');
    rooms.delete(roomId);
  });
  socket.on('declineDraw', ({ roomId }) => {
    socket.to(roomId).emit('drawDeclined');
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const idx = waiting.indexOf(socket);
    if (idx !== -1) waiting.splice(idx, 1);

    rooms.forEach((room, roomId) => {
      if (room.white === socket.id || room.black === socket.id) {
        socket.to(roomId).emit('opponentDisconnected', { msg: 'Opponent disconnected.' });
        rooms.delete(roomId);
      }
    });
    console.log('❌ Disconnected:', socket.id);
  });
});

// ── Auto-kill port if already in use ─────────────────────────────────────────
const { execSync } = require('child_process');

function killPortAndRetry() {
  try {
    console.log(`⚠️   Port ${PORT} is in use — killing old process...`);
    // Use PowerShell to find and kill the PID owning PORT
    const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    const pid = execSync(
      `"${PS}" -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`,
      { stdio: ['pipe','pipe','pipe'] }
    ).toString().trim();

    if (pid && /^\d+$/.test(pid)) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`✅  Killed old process (PID ${pid}). Retrying in 1s...`);
      setTimeout(() => {
        server.listen(PORT, () => console.log(`🚀  Server at http://localhost:${PORT}`));
      }, 1000);
    } else {
      console.error('❌  Could not find PID. Please close the old server and run npm start again.');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌  Auto-restart failed:', e.message);
    console.error(`   Run manually: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} -State Listen).OwningProcess -Force`);
    process.exit(1);
  }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    killPortAndRetry();
  } else {
    throw err;
  }
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    server.listen(PORT, () => console.log(`🚀  Server at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB failed:', err.message);
    console.log('⚠️   Starting WITHOUT database');
    server.listen(PORT, () => console.log(`🚀  Server at http://localhost:${PORT}`));
  });
