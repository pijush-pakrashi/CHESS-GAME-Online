/**
 * killport.js — kills any process using PORT before the server starts.
 * Uses spawnSync with shell:false to avoid broken PATH/COMSPEC issues.
 */
const { spawnSync } = require('child_process');
const PORT = process.env.PORT || 4000;

const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

console.log(`🔍  Checking if port ${PORT} is free...`);

// Ask PowerShell for the PID owning the port (no shell, direct exe call)
const query = spawnSync(
  PS,
  [
    '-NoProfile', '-NonInteractive', '-Command',
    `(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess`
  ],
  { encoding: 'utf8', timeout: 8000 }
);

if (query.error) {
  // PowerShell unavailable — silently continue, server.js will handle EADDRINUSE
  console.log('⚠️   Could not query port (PowerShell unavailable), continuing...');
  process.exit(0);
}

const pid = (query.stdout || '').trim();

if (!pid || !/^\d+$/.test(pid)) {
  console.log(`✅  Port ${PORT} is free.`);
  process.exit(0);
}

console.log(`⚠️   Port ${PORT} is in use by PID ${pid} — killing it...`);

const kill = spawnSync(
  'C:\\Windows\\System32\\taskkill.exe',
  ['/PID', pid, '/F'],
  { encoding: 'utf8', timeout: 5000 }
);

if (kill.status === 0) {
  console.log(`✅  Killed PID ${pid}. Starting server...\n`);
} else {
  console.warn(`⚠️   Kill may have failed: ${kill.stderr || kill.stdout}`);
}

// Small pause to let OS release the port
const sleep = spawnSync(PS, ['-NoProfile', '-Command', 'Start-Sleep -Milliseconds 600'], { timeout: 3000 });
