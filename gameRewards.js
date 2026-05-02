// ── Game Rewards: Confetti, Coins, Level-Up ───────────────────────────────────
const API = 'http://localhost:4000/api/auth';

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
window.launchConfetti = function(durationMs = 4000) {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    Object.assign(canvas.style, {
      position:'fixed', top:0, left:0, width:'100%', height:'100%',
      pointerEvents:'none', zIndex:99999
    });
    document.body.appendChild(canvas);
  }
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const COLORS = ['#f0c870','#ff6b6b','#74c0fc','#8ce99a','#ffa94d','#da77f2','#ffffff','#ff8fab'];
  const SHAPES = ['rect','circle','triangle'];
  const N = 220;

  const particles = Array.from({ length: N }, (_, i) => ({
    x:   Math.random() * canvas.width,
    y:   -30 - Math.random() * 300,
    w:   5 + Math.random() * 12,
    h:   4 + Math.random() * 8,
    color: COLORS[i % COLORS.length],
    shape: SHAPES[Math.floor(Math.random() * 3)],
    vx:  (Math.random() - 0.5) * 5,
    vy:  1.5 + Math.random() * 4,
    rot: Math.random() * 360,
    rv:  (Math.random() - 0.5) * 10,
    opacity: 1
  }));

  const endTime = Date.now() + durationMs;

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const remaining = endTime - Date.now();

    particles.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rv;
      p.vy  += 0.07;
      if (remaining < 800) p.opacity = Math.max(0, p.opacity - 0.02);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(0, -p.h); ctx.lineTo(p.w / 2, p.h / 2); ctx.lineTo(-p.w / 2, p.h / 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      if (p.y > canvas.height + 20 && remaining > 1200) {
        p.x = Math.random() * canvas.width;
        p.y = -20;
        p.opacity = 1;
        p.vx = (Math.random() - 0.5) * 5;
        p.vy = 1.5 + Math.random() * 4;
      }
    });

    if (Date.now() < endTime) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  frame();
};

// ─── FLOATING COIN TEXT ───────────────────────────────────────────────────────
window.showCoinReward = function(coins) {
  const el = document.createElement('div');
  el.textContent = '+' + coins + ' 🪙';
  Object.assign(el.style, {
    position: 'fixed', top: '40%', left: '50%',
    transform: 'translate(-50%,-50%)',
    fontFamily: "'Cinzel', serif", fontSize: '2.5rem',
    color: '#f0c870', textShadow: '0 0 30px #d4a84a, 0 0 60px rgba(212,168,74,.5)',
    zIndex: 100001, pointerEvents: 'none',
    animation: 'coinFloat 2.5s ease forwards'
  });
  document.body.appendChild(el);

  // inject keyframe if not present
  if (!document.getElementById('coinFloatStyle')) {
    const s = document.createElement('style');
    s.id = 'coinFloatStyle';
    s.textContent = `
      @keyframes coinFloat {
        0%   { opacity:0; transform:translate(-50%,-50%) scale(0.5); }
        20%  { opacity:1; transform:translate(-50%,-80%) scale(1.2); }
        70%  { opacity:1; transform:translate(-50%,-150%) scale(1); }
        100% { opacity:0; transform:translate(-50%,-200%) scale(0.8); }
      }
      @keyframes levelFlash {
        0%,100% { opacity:0; transform:translate(-50%,-50%) scale(0.6); }
        20%,80% { opacity:1; transform:translate(-50%,-50%) scale(1); }
      }
    `;
    document.head.appendChild(s);
  }
  setTimeout(() => el.remove(), 2600);
};

// ─── LEVEL-UP BANNER ──────────────────────────────────────────────────────────
window.showLevelUp = function(newLevel, bonusCoins) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="font-size:2.5rem;margin-bottom:6px">🏆</div>
    <div style="font-family:'Cinzel',serif;font-size:1.4rem;color:#f0c870;letter-spacing:3px">LEVEL UP!</div>
    <div style="font-family:'Cinzel',serif;font-size:2rem;color:#ffe080;margin:6px 0">Level ${newLevel}</div>
    <div style="font-size:1rem;color:#d4a84a">+${bonusCoins} 🪙 Bonus Coins</div>
  `;
  Object.assign(el.style, {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'linear-gradient(145deg,rgba(80,40,5,.97),rgba(20,8,0,.98))',
    border: '2px solid #c8900a',
    borderRadius: '16px', padding: '30px 50px',
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(200,145,10,.5), 0 0 120px rgba(200,145,10,.2)',
    zIndex: 100002, pointerEvents: 'none',
    animation: 'levelFlash 3s ease forwards'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3100);
};

// ─── WIN STREAK TOAST ────────────────────────────────────────────────────────
window.showStreakToast = function(streak) {
  if (streak < 2) return;
  const el = document.createElement('div');
  el.textContent = '🔥 ' + streak + '-Win Streak!';
  Object.assign(el.style, {
    position: 'fixed', bottom: '80px', right: '20px',
    background: 'linear-gradient(135deg,#c84010,#8b2005)',
    border: '1.5px solid #e06030', borderRadius: '10px',
    padding: '10px 20px',
    fontFamily: "'Cinzel',serif", fontSize: '1rem', color: '#fff',
    zIndex: 100001, animation: 'coinFloat 3s ease forwards'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3100);
};

// ─── WIN EMOTION OVERLAY ──────────────────────────────────────────────────────
window.showWinEmotion = function() {
  _injectEmotionStyles();
  const el = document.createElement('div');
  el.id = 'emotion-overlay';
  el.innerHTML = `
    <div class="emotion-emoji" id="emotion-emoji">🏆</div>
    <div class="emotion-title" id="emotion-title">VICTORY!</div>
    <div class="emotion-sub" id="emotion-sub">You crushed it, Champion!</div>
    <div class="emotion-emojis-rain" id="emoji-rain"></div>
  `;
  el.className = 'emotion-overlay win-overlay';
  document.body.appendChild(el);
  // Rain of winner emojis
  const winEmojis = ['🏆','👑','⚡','🥇','🎯','✨','🔥','💪'];
  const rain = el.querySelector('#emoji-rain');
  for (let i = 0; i < 18; i++) {
    const e = document.createElement('span');
    e.className = 'rain-emoji';
    e.textContent = winEmojis[Math.floor(Math.random() * winEmojis.length)];
    e.style.cssText = `left:${Math.random()*100}%;animation-delay:${(Math.random()*2).toFixed(2)}s;animation-duration:${(1.5+Math.random()*2).toFixed(2)}s;font-size:${1.2+Math.random()*1.5}rem`;
    rain.appendChild(e);
  }
  setTimeout(() => el.classList.add('emotion-show'), 50);
  setTimeout(() => { el.classList.remove('emotion-show'); setTimeout(() => el.remove(), 600); }, 4000);
};

// ─── LOSS EMOTION OVERLAY ─────────────────────────────────────────────────────
window.showLossEmotion = function() {
  _injectEmotionStyles();
  const el = document.createElement('div');
  el.id = 'emotion-overlay';
  el.innerHTML = `
    <div class="emotion-emoji shake-emoji">😢</div>
    <div class="emotion-title loss-title">DEFEATED!</div>
    <div class="emotion-sub">Don't give up — try again!</div>
    <div class="emotion-emojis-rain" id="emoji-rain"></div>
  `;
  el.className = 'emotion-overlay loss-overlay';
  document.body.appendChild(el);
  const lossEmojis = ['😢','💔','❌','😞','🥀','⚰️','😭','🙁'];
  const rain = el.querySelector('#emoji-rain');
  for (let i = 0; i < 14; i++) {
    const e = document.createElement('span');
    e.className = 'rain-emoji loss-rain';
    e.textContent = lossEmojis[Math.floor(Math.random() * lossEmojis.length)];
    e.style.cssText = `left:${Math.random()*100}%;animation-delay:${(Math.random()*1.5).toFixed(2)}s;animation-duration:${(2+Math.random()*2).toFixed(2)}s;font-size:${1+Math.random()*1.2}rem`;
    rain.appendChild(e);
  }
  setTimeout(() => el.classList.add('emotion-show'), 50);
  setTimeout(() => { el.classList.remove('emotion-show'); setTimeout(() => el.remove(), 600); }, 4200);
};

// ─── DRAW EMOTION OVERLAY ─────────────────────────────────────────────────────
window.showDrawEmotion = function() {
  _injectEmotionStyles();
  const el = document.createElement('div');
  el.id = 'emotion-overlay';
  el.innerHTML = `
    <div class="emotion-emoji">🤝</div>
    <div class="emotion-title draw-title">DRAW!</div>
    <div class="emotion-sub">A battle of equals — well played!</div>
  `;
  el.className = 'emotion-overlay draw-overlay';
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('emotion-show'), 50);
  setTimeout(() => { el.classList.remove('emotion-show'); setTimeout(() => el.remove(), 600); }, 3200);
};

// ─── INJECT STYLES (once) ─────────────────────────────────────────────────────
function _injectEmotionStyles() {
  if (document.getElementById('emotion-styles')) return;
  const s = document.createElement('style');
  s.id = 'emotion-styles';
  s.textContent = `
    .emotion-overlay {
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 200000;
      pointer-events: none; opacity: 0; transform: scale(0.8);
      transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }
    .emotion-overlay.emotion-show { opacity: 1; transform: scale(1); }
    .win-overlay  { background: radial-gradient(ellipse, rgba(10,30,5,0.92) 0%, rgba(0,0,0,0.85) 100%); }
    .loss-overlay { background: radial-gradient(ellipse, rgba(30,5,5,0.92) 0%, rgba(0,0,0,0.85) 100%); }
    .draw-overlay { background: radial-gradient(ellipse, rgba(10,10,30,0.88) 0%, rgba(0,0,0,0.82) 100%); }
    .emotion-emoji {
      font-size: 6rem; animation: emotionBounce 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
      filter: drop-shadow(0 0 30px rgba(255,255,255,0.4));
    }
    .shake-emoji { animation: emotionBounce 0.8s ease forwards, emotionShake 0.5s 0.8s ease infinite; }
    .emotion-title {
      font-family: 'Cinzel', serif; font-size: clamp(2rem, 7vw, 4rem);
      letter-spacing: 6px; margin: 10px 0 6px;
      animation: emotionSlideUp 0.6s 0.3s ease forwards; opacity: 0;
    }
    .win-overlay  .emotion-title { color: #f0c870; text-shadow: 0 0 40px #c8900a, 0 0 80px rgba(200,145,10,0.5); }
    .loss-title   { color: #ff6060; text-shadow: 0 0 40px #c83030, 0 0 80px rgba(200,50,50,0.4); }
    .draw-title   { color: #80c0ff; text-shadow: 0 0 40px #4080c0; }
    .emotion-sub {
      font-family: 'Inter', sans-serif; font-size: clamp(0.9rem, 2.5vw, 1.2rem);
      color: rgba(255,255,255,0.7); letter-spacing: 2px;
      animation: emotionSlideUp 0.6s 0.5s ease forwards; opacity: 0;
    }
    .emotion-emojis-rain { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .rain-emoji {
      position: absolute; top: -60px; animation: rainFall linear forwards;
      filter: drop-shadow(0 0 6px rgba(255,200,50,0.5));
    }
    .loss-rain { filter: drop-shadow(0 0 6px rgba(255,80,80,0.5)); }
    @keyframes rainFall {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh) rotate(360deg); opacity: 0.3; }
    }
    @keyframes emotionBounce {
      0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
      70%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes emotionShake {
      0%,100% { transform: translateX(0); }
      25%      { transform: translateX(-8px); }
      75%      { transform: translateX(8px); }
    }
    @keyframes emotionSlideUp {
      0%   { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

// ─── SAVE RESULT & TRIGGER ALL REWARDS ───────────────────────────────────────
window.saveGameResult = async function(result) {
  const token = localStorage.getItem('chess_token');

  // Always show emotion animation (even for guests)
  if (result === 'win')       showWinEmotion();
  else if (result === 'loss') showLossEmotion();
  else if (result === 'draw') showDrawEmotion();

  // Clear saved game since it's over
  localStorage.removeItem('chess_saved_game');

  if (!token) return { coinsEarned: 0 };

  try {
    const res  = await fetch(API + '/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ result })
    });
    const data = await res.json();
    if (!res.ok) return { coinsEarned: 0 };

    // Update cached user
    localStorage.setItem('chess_user', JSON.stringify(data.user));

    // Update header
    const coinEl = document.getElementById('header-coins');
    if (coinEl) coinEl.textContent = '🪙 ' + data.user.coins;
    const lvlEl = document.getElementById('header-level');
    if (lvlEl) lvlEl.textContent = 'Lv.' + data.user.level;

    // Update XP bar
    updateXPBar(data.user);

    return data;
  } catch (e) {
    console.warn('Offline – result not saved');
    return { coinsEarned: 0 };
  }
};

// ─── XP BAR UPDATE ────────────────────────────────────────────────────────────
window.updateXPBar = function(user) {
  const bar = document.getElementById('xp-fill');
  const txt = document.getElementById('xp-text');
  if (!bar || !txt) return;
  const needed = user.xpForNextLevel || (user.level * 150);
  const pct    = Math.min(100, Math.round((user.xp / needed) * 100));
  bar.style.width = pct + '%';
  txt.textContent = user.xp + ' / ' + needed + ' XP';
};

// ─── AUTO-SAVE game state (called after each move) ────────────────────────────
window.autoSaveGame = function() {
  try {
    const token = localStorage.getItem('chess_token');
    if (!token) return; // only save for logged-in users
    const user = JSON.parse(localStorage.getItem('chess_user') || 'null');
    const userId = user ? (user.id || user._id) : null;
    if (!userId) return;
    
    const fen  = typeof generateFEN === 'function' ? generateFEN(boardSquaresArray) : null;
    const mode = document.getElementById('gameMode')?.value || 'localMultiplayer';
    const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    if (fen && !fen.startsWith(startFEN)) {
      localStorage.setItem(`chess_saved_game_${userId}`, JSON.stringify({
        fen, mode, turn: typeof isWhiteTurn !== 'undefined' ? isWhiteTurn : true,
        savedAt: Date.now()
      }));
    }
  } catch(e) {}
};

// ─── INIT: load user into header on page load ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('chess_user') || 'null');
  if (!user) return;
  const coinEl = document.getElementById('header-coins');
  const lvlEl  = document.getElementById('header-level');
  if (coinEl) coinEl.textContent = '🪙 ' + user.coins;
  if (lvlEl)  lvlEl.textContent  = 'Lv.' + (user.level || 1);
  updateXPBar(user);
});
