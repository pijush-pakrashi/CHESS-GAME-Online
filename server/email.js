const nodemailer = require('nodemailer');

// ── Transporter (Gmail) ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Gmail App Password (not your normal password)
  }
});

// ── In-memory OTP store  { email → { otp, expires, type } } ──────────────────
const otpStore = new Map();

// Cleanup expired OTPs every 10 min
setInterval(() => {
  const now = Date.now();
  otpStore.forEach((v, k) => { if (v.expires < now) otpStore.delete(k); });
}, 600000);

// ── Generate 6-digit OTP ──────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP email ────────────────────────────────────────────────────────────
async function sendOTPEmail(email, otp, type = 'verify') {
  const isReset = type === 'reset';
  const subject = isReset ? '♟ Chess Engine – Password Reset OTP' : '♟ Chess Engine – Email Verification OTP';
  const action  = isReset ? 'reset your password' : 'verify your email';

  const html = `
  <div style="background:#0d0804;padding:32px;font-family:'Georgia',serif;max-width:480px;margin:auto;border-radius:12px;border:1px solid #7a4810">
    <h1 style="font-size:1.6rem;color:#f0c870;letter-spacing:2px;text-align:center;margin-bottom:6px">♔ CHESS ENGINE</h1>
    <p style="color:#a07840;text-align:center;font-size:.85rem;margin-bottom:24px;letter-spacing:1px">PLAY · EARN · COMPETE</p>
    <hr style="border-color:#3a1a08;margin-bottom:24px"/>
    <p style="color:#d4b070;font-size:1rem;margin-bottom:8px">Hello,</p>
    <p style="color:#a07840;font-size:.9rem;margin-bottom:24px">Use the code below to ${action}:</p>
    <div style="background:#1a0a02;border:2px solid #c8900a;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px">
      <span style="font-size:2.8rem;font-weight:bold;letter-spacing:10px;color:#f0c870">${otp}</span>
    </div>
    <p style="color:#7a5030;font-size:.82rem;text-align:center">⏳ This code expires in <strong style="color:#d4a84a">10 minutes</strong></p>
    <p style="color:#5a3820;font-size:.75rem;text-align:center;margin-top:16px">If you didn't request this, ignore this email.</p>
  </div>`;

  await transporter.sendMail({
    from: `"Chess Engine" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html
  });
}

// ── Store OTP ─────────────────────────────────────────────────────────────────
function storeOTP(email, otp, type) {
  otpStore.set(email.toLowerCase(), {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 min
    type
  });
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
function verifyOTP(email, code) {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry)                    return { ok: false, error: 'OTP not found or expired' };
  if (Date.now() > entry.expires) { otpStore.delete(email.toLowerCase()); return { ok: false, error: 'OTP expired' }; }
  if (entry.otp !== code.trim()) return { ok: false, error: 'Wrong OTP code' };
  otpStore.delete(email.toLowerCase());
  return { ok: true };
}

module.exports = { sendOTPEmail, storeOTP, verifyOTP, generateOTP };
