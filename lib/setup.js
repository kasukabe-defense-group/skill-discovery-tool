// Asks for API keys in the terminal and saves them to .env.local (git-ignored).
// Runs automatically from serve.js when keys are missing; `npm run setup` re-enters them.
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

const KEYS = [
  { name: 'GROQ_API_KEY', label: 'Groq API key', hint: 'console.groq.com/keys', optional: false, check: checkGroq },
  { name: 'GEMINI_API_KEY', label: 'Google AI Studio (Gemini) key', hint: 'aistudio.google.com/apikey — backup AI, Enter to skip', optional: true, check: checkGemini },
  { name: 'GITHUB_TOKEN', label: 'GitHub token', hint: 'github.com/settings/tokens — fine-grained, public read-only, Enter to skip', optional: true, check: checkGitHub }
];

function readEnvFile() {
  const out = {};
  if (!fs.existsSync(ENV_FILE)) return out;
  fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

function writeEnvFile(values) {
  const body = [
    '# Local secrets. Git-ignored: never commit this file.',
    ...KEYS.map((k) => `${k.name}=${values[k.name] || ''}`)
  ].join('\n') + '\n';
  fs.writeFileSync(ENV_FILE, body, { mode: 0o600 });
}

function missingRequired(values) {
  return KEYS.filter((k) => !k.optional && !values[k.name]);
}

// Hidden prompt: echoes * for each character, so keys never appear on screen.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = '';
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(value.trim());
          return;
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length) { value = value.slice(0, -1); process.stdout.write('\b \b'); }
          continue;
        }
        if (ch >= ' ') { value += ch; process.stdout.write('*'); }
      }
    };
    stdin.on('data', onData);
  });
}

async function checkGroq(key) {
  const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
  return r.ok;
}
async function checkGemini(key) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key } });
  return r.ok;
}
async function checkGitHub(key) {
  const r = await fetch('https://api.github.com/rate_limit', { headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'skill-discovery-setup' } });
  return r.ok;
}

async function prompt(existing, reset) {
  const values = Object.assign({}, existing);
  console.log('\n  Skill Discovery setup');
  console.log('  Keys are saved only to .env.local on this machine. It is git-ignored and never sent to the browser.\n');
  for (const k of KEYS) {
    if (values[k.name] && !reset) continue;
    for (;;) {
      const answer = await askHidden(`  ${k.label} (${k.hint}): `);
      if (!answer) {
        if (k.optional) { values[k.name] = values[k.name] && !reset ? values[k.name] : ''; break; }
        console.log('  This one is required.');
        continue;
      }
      let ok = false;
      try { ok = await k.check(answer); } catch (e) { ok = false; }
      if (ok) { console.log('  ✓ Works.'); values[k.name] = answer; break; }
      console.log('  ✗ That key was rejected (or the service is unreachable). Try again, or press Enter to skip if optional.');
    }
  }
  writeEnvFile(values);
  console.log('\n  Saved to .env.local\n');
  return values;
}

// Called by serve.js before the server starts.
async function ensureKeys() {
  const existing = readEnvFile();
  const merged = Object.assign({}, existing);
  KEYS.forEach((k) => { if (process.env[k.name]) merged[k.name] = process.env[k.name]; });
  if (!missingRequired(merged).length) return;
  if (!process.stdin.isTTY) {
    console.warn('\n  API keys are missing. Run `npm run setup` in a terminal to add them.');
    console.warn('  Until then, GitHub search still runs but without AI keyword reading or ranking.\n');
    return;
  }
  const saved = await prompt(existing, false);
  KEYS.forEach((k) => { if (saved[k.name]) process.env[k.name] = saved[k.name]; });
}

module.exports = { ensureKeys };

if (require.main === module) {
  if (!process.stdin.isTTY) { console.error('Run this in an interactive terminal.'); process.exit(1); }
  const reset = process.argv.includes('--reset');
  prompt(readEnvFile(), reset).then(() => process.exit(0));
}
