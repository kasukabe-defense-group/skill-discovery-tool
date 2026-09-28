const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

function headers(raw) {
  const h = { 'User-Agent': 'skill-discovery-tool' };
  if (!raw) { h.Accept = 'application/vnd.github+json'; h['X-GitHub-Api-Version'] = '2022-11-28'; }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await fn();
  if (value && value.ok) cache.set(key, { at: Date.now(), value });
  return value;
}

async function api(url) {
  return cached(url, async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { headers: headers(false), signal: ctrl.signal });
      const json = await res.json().catch(() => ({}));
      const limited = (res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0';
      return { ok: res.ok, status: res.status, json, limited: limited || /rate limit/i.test(json.message || '') };
    } catch (e) {
      return { ok: false, status: 0, json: {}, error: e.message };
    } finally { clearTimeout(timer); }
  });
}

async function raw(url, max = 4000) {
  const res = await cached('raw:' + url, async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const r = await fetch(url, { headers: headers(true), signal: ctrl.signal });
      if (!r.ok) return { ok: false };
      return { ok: true, text: (await r.text()).slice(0, max) };
    } catch (e) { return { ok: false }; } finally { clearTimeout(timer); }
  });
  return res.ok ? res.text : '';
}

const hasToken = () => Boolean(process.env.GITHUB_TOKEN);

function searchRepos(q, perPage = 8, sort) {
  return api(`https://api.github.com/search/repositories?per_page=${perPage}${sort ? `&sort=${sort}` : ''}&q=${encodeURIComponent(q)}`);
}
function searchCode(q, perPage = 8) {
  return api(`https://api.github.com/search/code?per_page=${perPage}&q=${encodeURIComponent(q)}`);
}
function getRepo(fullName) {
  return api(`https://api.github.com/repos/${fullName}`);
}
function rawFromHtml(htmlUrl) {
  // https://github.com/o/r/blob/<ref>/path -> https://raw.githubusercontent.com/o/r/<ref>/path
  const m = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/.exec(htmlUrl || '');
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}` : '';
}
function readme(fullName) {
  return raw(`https://raw.githubusercontent.com/${fullName}/HEAD/README.md`, 2500);
}

module.exports = { searchRepos, searchCode, getRepo, raw, rawFromHtml, readme, hasToken };
