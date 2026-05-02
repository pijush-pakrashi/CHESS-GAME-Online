const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const { sendOTPEmail, storeOTP, verifyOTP, generateOTP } = require('../email');
const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chess_super_secret';

// ── helpers ───────────────────────────────────────────────────────────────────
function safeUser(u) {
  return {
    id: u._id, username: u.username, email: u.email,
    coins: u.coins, xp: u.xp, level: u.level,
    wins: u.wins, losses: u.losses, draws: u.draws,
    gamesPlayed: u.gamesPlayed, winStreak: u.winStreak,
    bestStreak: u.bestStreak, avatar: u.avatar, createdAt: u.createdAt,
    xpForNextLevel: User.xpForLevel(u.level)
  };
}
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  try { req.userId = jwt.verify(h.split(' ')[1], JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Username or email already taken' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET PROFILE ───────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(safeUser(user));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RECORD GAME RESULT ────────────────────────────────────────────────────────
router.post('/result', auth, async (req, res) => {
  try {
    const { result } = req.body; // 'win' | 'loss' | 'draw'
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });

    let coinsEarned = 0;
    let xpEarned    = 0;
    const oldLevel  = user.level;

    user.gamesPlayed += 1;

    if (result === 'win') {
      user.wins      += 1;
      coinsEarned    = 50;
      xpEarned       = 100;
      user.coins     += coinsEarned;
      user.winStreak += 1;
      if (user.winStreak > user.bestStreak) user.bestStreak = user.winStreak;
    } else if (result === 'loss') {
      user.losses    += 1;
      xpEarned       = 10;
      user.winStreak = 0;
    } else if (result === 'draw') {
      user.draws  += 1;
      coinsEarned = 10;
      xpEarned    = 30;
      user.coins  += coinsEarned;
    }

    const leveledUp  = user.addXP(xpEarned);
    const levelBonus = leveledUp ? (user.level - oldLevel) * 5 : 0;
    // levelBonus coins already added inside addXP

    await user.save();
    res.json({
      user: safeUser(user),
      coinsEarned,
      xpEarned,
      leveledUp,
      newLevel: user.level,
      oldLevel,
      levelBonus
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PING (active player tracking) ────────────────────────────────────────────
const activePlayers = new Map(); // userId → lastSeen timestamp
router.post('/ping', auth, (req, res) => {
  activePlayers.set(req.userId.toString(), Date.now());
  // Clean stale (>2 min)
  const cutoff = Date.now() - 120000;
  activePlayers.forEach((ts, id) => { if (ts < cutoff) activePlayers.delete(id); });
  res.json({ online: activePlayers.size });
});

// ── ADMIN STATS ───────────────────────────────────────────────────────────────
router.get('/admin/stats', async (req, res) => {
  const adminPwd = req.headers['x-admin-key'];
  if (adminPwd !== (process.env.ADMIN_KEY || 'chess_admin_2024')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const totalUsers    = await User.countDocuments();
    const topPlayers    = await User.find({}, 'username wins coins level winStreak')
                            .sort({ wins: -1 }).limit(10);
    const cutoff        = Date.now() - 120000;
    activePlayers.forEach((ts, id) => { if (ts < cutoff) activePlayers.delete(id); });
    res.json({
      totalUsers,
      activePlayers: activePlayers.size,
      topPlayers
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CHECK EMAIL EXISTS ────────────────────────────────────────────────────────
// Real-time check as user types email in registration form
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ available: false, error: 'No email' });

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.json({ valid: false, error: 'Invalid email format' });

  const exists = await User.findOne({ email: email.toLowerCase() });
  res.json({ valid: true, available: !exists, error: exists ? 'Email already registered' : null });
});

// ── SEND REGISTRATION OTP ─────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const otp = generateOTP();
    storeOTP(email, otp, 'verify');
    await sendOTPEmail(email, otp, 'verify');
    res.json({ message: 'OTP sent to ' + email });
  } catch (e) {
    console.error('OTP send error:', e.message);
    res.status(500).json({ error: 'Failed to send email. Check EMAIL_USER/EMAIL_PASS in .env' });
  }
});

// ── VERIFY OTP + REGISTER ─────────────────────────────────────────────────────
router.post('/verify-register', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;
    if (!username || !email || !password || !otp)
      return res.status(400).json({ error: 'All fields required' });

    const result = verifyOTP(email, otp);
    if (!result.ok) return res.status(400).json({ error: result.error });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Username or email already taken' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email: email.toLowerCase(), password: hash });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SEND FORGOT-PASSWORD OTP ──────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'No account with that email' });

    const otp = generateOTP();
    storeOTP(email, otp, 'reset');
    await sendOTPEmail(email, otp, 'reset');
    res.json({ message: 'Password reset OTP sent to ' + email });
  } catch (e) {
    console.error('Forgot password error:', e.message);
    res.status(500).json({ error: 'Failed to send email. Check EMAIL_USER/EMAIL_PASS in .env' });
  }
});

// ── RESET PASSWORD WITH OTP ───────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password min 6 characters' });

    const result = verifyOTP(email, otp);
    if (!result.ok) return res.status(400).json({ error: result.error });

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: email.toLowerCase() }, { password: hash });
    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const top = await User.find({}, 'username wins coins level xp winStreak')
      .sort({ wins: -1, coins: -1 }).limit(10);
    res.json(top);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPLOAD AVATAR ─────────────────────────────────────────────────────────────
// Accepts base64-encoded image string (max ~2MB after b64)
router.post('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body; // base64 data URL: "data:image/jpeg;base64,..."
    if (!avatar) return res.status(400).json({ error: 'No avatar data' });
    if (avatar.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Image too large (max 1.5MB)' });
    const allowed = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp', 'data:image/gif'];
    const ok = allowed.some(t => avatar.startsWith(t));
    if (!ok) return res.status(400).json({ error: 'Only JPEG/PNG/WEBP/GIF allowed' });

    const user = await User.findByIdAndUpdate(
      req.userId, { avatar }, { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ avatar: user.avatar, user: safeUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
