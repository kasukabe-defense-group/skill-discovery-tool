const { loadEnv } = require('../lib/env');
const gh = require('../lib/github');
const llm = require('../lib/llm');

loadEnv();

const STAGES = ['idea', 'plan', 'code', 'test', 'live'];
const RESULT_CACHE_MS = 30 * 60 * 1000;
const resultCache = new Map();

const REPO_TOPICS = [
  { topic: 'claude-skills', kind: 'Claude skill' },
  { topic: 'agent-skills', kind: 'Agent skill' },
  { topic: 'cursor-rules', kind: 'Cursor rules' },
  { topic: 'mcp-server', kind: 'MCP server' }
];
const CODE_QUERIES = [
  { q: 'filename:SKILL.md', kind: 'Claude skill' },
  { q: 'extension:mdc path:.cursor/rules', kind: 'Cursor rule' },
  { q: 'filename:.cursorrules', kind: 'Cursor rules' }
];
const STOP = new Set('a an the and or for with that this to of in on my our your is are be it app apps website site web tool tools project build building make want need some into from using use people can will which who where what when'.split(' '));

/* ---------- helpers ---------- */

function clean(s, max) { return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }

function parseInput(body) {
  let b = body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const input = {
    description: clean(b.description, 1000),
    name: clean(b.name, 80),
    stage: (Array.isArray(b.stage) ? b.stage : []).filter((s) => STAGES.includes(s)),
    help: (Array.isArray(b.help) ? b.help : []).filter((s) => llm.CATEGORIES.includes(s))
  };
  return input.description.length >= 3 ? input : null;
}

function fallbackKeywords(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  return [...new Set(words)].slice(0, 3);
}

function kindFromTopics(topics, name) {
  const t = topics || [];
  if (/skill/i.test(name || '')) return 'Agent skill';
  if (t.some((x) => /mcp/.test(x))) return 'MCP server';
  if (t.some((x) => /cursor/.test(x))) return 'Cursor rules';
  if (t.some((x) => /copilot/.test(x))) return 'Copilot instructions';
  if (t.some((x) => /claude-skill|agent-skill|skill/.test(x))) return 'Claude skill';
  return null;
}

function prettyName(s) {
  return String(s || '').replace(/\.(md|mdc|cursorrules)$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function frontmatter(text) {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(text || '');
  const out = {};
  if (!m) return out;
  m[1].split('\n').forEach((line) => {
    const kv = /^(\w+)\s*:\s*(.*)$/.exec(line);
    if (kv) out[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, '').trim();
  });
  return out;
}

function excerptOf(text) {
  return String(text || '')
    .replace(/^---[\s\S]*?\n---/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`|_-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 650);
}

function quality(c) {
  const stars = Math.min(1, Math.log10((c.stars || 0) + 1) / 4);
  const days = c.updated ? (Date.now() - Date.parse(c.updated)) / 864e5 : 9999;
  const fresh = days < 90 ? 1 : days < 365 ? 0.5 : 0;
  return stars * 0.7 + fresh * 0.3;
}

function keywordHits(c, keywords) {
  const hay = `${c.name} ${c.description} ${(c.topics || []).join(' ')} ${c.path}`.toLowerCase();
  return keywords.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
}

/* ---------- the pipeline ---------- */

async function run(input, send) {
  const warnings = [];

  // 1. understand
  send({ type: 'step', step: 'understand', text: 'Reading your idea' });
  let domain = [], capabilities = [], categories, provider = 'none';
  try {
    const u = await llm.understand(input);
    domain = u.domain; capabilities = u.capabilities; categories = u.categories; provider = u.provider;
  } catch (e) {
    warnings.push('The AI could not read the idea, so keywords were picked from your words directly.');
  }
  if (!domain.length && !capabilities.length) capabilities = fallbackKeywords(`${input.description} ${input.name}`);
  if (!domain.length && !capabilities.length) capabilities = ['developer tools'];
  const keywords = domain.concat(capabilities);
  categories = categories && categories.length ? categories : input.help;
  send({ type: 'keywords', keywords, domain, capabilities, categories });

  // 2. search GitHub. Domain terms find niche matches; capability terms find the well-used general skills.
  send({ type: 'step', step: 'github', text: `Searching GitHub for ${keywords.slice(0, 3).map((k) => `“${k}”`).join(', ')}` });
  const repoQueries = [];
  if (domain[0]) {
    repoQueries.push({ q: `${domain[0]} topic:claude-skills`, kind: 'Claude skill' }, { q: `${domain[0]} topic:mcp-server`, kind: 'MCP server' });
  }
  const capTopics = [['claude-skills', 'Claude skill'], ['mcp-server', 'MCP server'], ['cursor-rules', 'Cursor rules'], ['agent-skills', 'Agent skill']];
  capabilities.forEach((cap, i) => {
    const a = capTopics[i % capTopics.length], b = capTopics[(i + 1) % capTopics.length];
    repoQueries.push({ q: `${cap} topic:${a[0]}`, kind: a[1], sort: 'stars' }, { q: `${cap} topic:${b[0]}`, kind: b[1], sort: 'stars' });
  });
  const codeTerm = capabilities[0] || domain[0];
  const codeQueries = gh.hasToken() ? CODE_QUERIES.map((c) => ({ q: `${codeTerm} ${c.q}`, kind: c.kind })) : [];
  if (!gh.hasToken()) warnings.push('No GitHub token set, so only repositories were searched (not individual SKILL.md or rule files).');

  const [repoRes, codeRes] = await Promise.all([
    Promise.all(repoQueries.slice(0, 8).map((r) => gh.searchRepos(r.q, 8, r.sort).then((res) => ({ res, kind: r.kind })))),
    Promise.all(codeQueries.map((c) => gh.searchCode(c.q).then((res) => ({ res, kind: c.kind }))))
  ]);

  let limited = false;
  const byId = new Map();

  repoRes.forEach(({ res, kind }) => {
    if (res.limited) limited = true;
    (res.ok && res.json.items ? res.json.items : []).forEach((it) => {
      if (it.archived || it.fork) return;
      const id = `r:${it.full_name}`;
      if (byId.has(id)) return;
      byId.set(id, {
        id, source: 'repo',
        kind: kindFromTopics(it.topics, it.name) || kind,
        name: prettyName(it.name),
        repo: it.full_name, url: it.html_url, path: '',
        stars: it.stargazers_count || 0, forks: it.forks_count || 0,
        updated: it.pushed_at, license: it.license && it.license.spdx_id && it.license.spdx_id !== 'NOASSERTION' ? it.license.spdx_id : null,
        description: clean(it.description, 300), topics: it.topics || []
      });
    });
  });

  const codeRepos = new Set();
  codeRes.forEach(({ res, kind }) => {
    if (res.limited) limited = true;
    (res.ok && res.json.items ? res.json.items : []).forEach((it) => {
      const full = it.repository && it.repository.full_name;
      if (!full || (it.repository && it.repository.fork)) return;
      const id = `c:${full}:${it.path}`;
      if (byId.has(id)) return;
      const parts = it.path.split('/');
      const name = /SKILL\.md$/i.test(it.path) && parts.length > 1 ? parts[parts.length - 2]
        : /\.cursorrules$/.test(it.path) ? `${it.repository.name} rules` : parts[parts.length - 1];
      codeRepos.add(full);
      byId.set(id, {
        id, source: 'file', kind, name: prettyName(name),
        repo: full, url: it.html_url, path: it.path, rawUrl: gh.rawFromHtml(it.html_url),
        stars: 0, forks: 0, updated: null, license: null, description: clean(it.repository.description, 300), topics: []
      });
    });
  });

  // stars + activity for repos found through file search
  const repoInfo = new Map();
  await Promise.all([...codeRepos].slice(0, 14).map(async (full) => {
    const r = await gh.getRepo(full);
    if (r.ok) repoInfo.set(full, r.json);
  }));
  byId.forEach((c) => {
    const info = repoInfo.get(c.repo);
    if (c.source === 'file' && info) {
      c.stars = info.stargazers_count || 0; c.forks = info.forks_count || 0; c.updated = info.pushed_at;
      c.license = info.license && info.license.spdx_id !== 'NOASSERTION' ? info.license.spdx_id : null;
      c.topics = info.topics || [];
    }
  });

  let candidates = [...byId.values()];
  if (!candidates.length) {
    if (limited) throw Object.assign(new Error('GitHub is limiting searches right now. Wait a minute and try again.'), { public: true });
    send({ type: 'found', count: 0, sample: [] });
    return { results: [], meta: { keywords, categories, provider, candidates: 0, usedToken: gh.hasToken(), warnings } };
  }
  if (limited) warnings.push('GitHub limited some searches, so results may be incomplete.');

  candidates.forEach((c) => { c.pre = Math.log10(c.stars + 1) + keywordHits(c, keywords) * 1.5 + (c.source === 'file' ? 1 : 0); });
  candidates.sort((a, b) => b.pre - a.pre);
  // One account publishing dozens of near-identical repos should not crowd everyone else out.
  const perOwner = new Map();
  const seenNames = new Set();
  candidates = candidates.filter((c) => {
    const nameKey = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenNames.has(nameKey)) return false;
    seenNames.add(nameKey);
    const owner = c.repo.split('/')[0].toLowerCase();
    const n = (perOwner.get(owner) || 0) + 1;
    perOwner.set(owner, n);
    return n <= 2;
  }).slice(0, 24);
  send({ type: 'found', count: byId.size, sample: candidates.slice(0, 5).map((c) => c.name) });

  // 3. read the candidates
  send({ type: 'step', step: 'read', text: 'Reading the candidates' });
  await Promise.all(candidates.map(async (c, i) => {
    if (c.source === 'file' && c.rawUrl) {
      const text = await gh.raw(c.rawUrl);
      const fm = frontmatter(text);
      if (fm.name) c.name = prettyName(fm.name);
      if (fm.description) c.description = clean(fm.description, 300);
      c.excerpt = excerptOf(text);
    } else if (c.source === 'repo' && i < 10) {
      c.excerpt = excerptOf(await gh.readme(c.repo));
    }
  }));

  // 4. rank
  send({ type: 'step', step: 'rank', text: 'Ranking by fit, stars and activity' });
  const shortIds = new Map();
  const forLLM = candidates.map((c, i) => { const sid = `c${i + 1}`; shortIds.set(sid, c); return Object.assign({}, c, { id: sid }); });
  let picks = [];
  let rankFailed = false;
  try {
    const r = await llm.rank(input, forLLM);
    picks = r.picks.filter((p) => Number(p.fit) >= 40); provider = r.provider;
  } catch (e) {
    rankFailed = true;
    warnings.push('The AI ranking step failed, so results are ordered by keyword match and stars.');
  }

  let results = [];
  const used = new Set();
  picks.forEach((p) => {
    const c = shortIds.get(String(p.id));
    if (!c || used.has(c.id)) return;
    used.add(c.id);
    const fit = Math.max(0, Math.min(100, Number(p.fit) || 0));
    results.push(Object.assign(publicFields(c), {
      category: llm.CATEGORIES.includes(p.category) ? p.category : guessCategory(c, categories),
      fit,
      score: Math.round(fit * 0.75 + quality(c) * 25),
      reason: clean(p.reason, 160),
      bio: clean(p.bio, 400),
      useWhen: (Array.isArray(p.useWhen) ? p.useWhen : []).map((u) => clean(u, 120)).filter(Boolean).slice(0, 3),
      prompt: clean(p.prompt, 300)
    }));
  });
  results.sort((a, b) => b.score - a.score);

  if (rankFailed) {
    candidates.filter((c) => !used.has(c.id)).slice(0, 4 - results.length).forEach((c) => {
      results.push(Object.assign(publicFields(c), {
        category: guessCategory(c, categories), fit: null, score: null,
        reason: `Matches “${keywords[0]}” on GitHub`,
        bio: c.description || '', useWhen: [], prompt: ''
      }));
    });
  }
  results = results.slice(0, 10);

  return { results, meta: { keywords, categories, provider, candidates: byId.size, usedToken: gh.hasToken(), warnings } };
}

function guessCategory(c, categories) {
  const hay = `${c.name} ${c.description} ${(c.topics || []).join(' ')}`.toLowerCase();
  if (/test|qa|playwright|jest|cypress/.test(hay)) return 'Testing';
  if (/deploy|docker|ci\b|kubernetes|vercel|release/.test(hay)) return 'Deployment';
  if (/design|figma|ui\/ux|brand|logo/.test(hay)) return 'Design';
  if (/react|frontend|css|tailwind|vue|nextjs|svelte/.test(hay)) return 'Frontend';
  if (/writing|content|docs|seo|copy|blog/.test(hay)) return 'Content';
  if (/api|backend|database|sql|server|auth/.test(hay)) return 'Backend';
  return (categories && categories[0]) || 'Backend';
}

function publicFields(c) {
  return {
    id: c.id, kind: c.kind, name: c.name, repo: c.repo,
    url: /^https:\/\/github\.com\//.test(c.url) ? c.url : `https://github.com/${c.repo}`,
    path: c.path, stars: c.stars, forks: c.forks, updated: c.updated, license: c.license,
    description: c.description
  };
}

/* ---------- handler (Vercel function signature; also used by serve.js) ---------- */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('Allow', 'POST'); res.end('Use POST'); return;
  }
  const input = parseInput(req.body);
  if (!input) {
    res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Describe what you are building in at least a few words.' })); return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  const send = (obj) => res.write(JSON.stringify(obj) + '\n');

  const key = JSON.stringify([input.description.toLowerCase(), input.name.toLowerCase(), input.stage.slice().sort(), input.help.slice().sort()]);
  const hit = resultCache.get(key);
  if (hit && Date.now() - hit.at < RESULT_CACHE_MS) {
    send({ type: 'keywords', keywords: hit.value.meta.keywords, categories: hit.value.meta.categories });
    send({ type: 'found', count: hit.value.meta.candidates, sample: hit.value.results.slice(0, 5).map((r) => r.name) });
    send(Object.assign({ type: 'done', cached: true }, hit.value));
    res.end(); return;
  }

  try {
    const value = await run(input, send);
    if (value.results.length) resultCache.set(key, { at: Date.now(), value });
    send(Object.assign({ type: 'done' }, value));
  } catch (e) {
    console.error('[search]', e);
    send({ type: 'error', message: e.public ? e.message : 'Something went wrong while searching. Try again in a moment.' });
  }
  res.end();
};
