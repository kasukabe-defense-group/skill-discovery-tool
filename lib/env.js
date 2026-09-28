const fs = require('fs');
const path = require('path');

// Local dev only (.env.local, per CONTRIBUTING.md). On Vercel, env vars come from the project settings.
function loadEnv() {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
}

module.exports = { loadEnv };
