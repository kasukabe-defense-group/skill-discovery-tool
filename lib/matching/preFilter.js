const DEFAULT_LIMIT = 25;

// Plain literal check -- a skill must actually list the picked platform,
// full stop. Having 2+ platforms listed does NOT make a skill an automatic
// match; that's a display rule (PlatformBadge's "Multi-platform" label),
// unrelated to this filter.
export function matchesPlatform(skill, platform) {
  if (!platform) return true;
  return Array.isArray(skill.platform) && skill.platform.includes(platform);
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function keywordScore(skill, descriptionTokens) {
  if (descriptionTokens.length === 0) return 0;
  const haystack = tokenize(
    [skill.name, skill.shortDescription, ...(skill.tags || [])].join(" ")
  );
  const haystackSet = new Set(haystack);
  let score = 0;
  for (const token of descriptionTokens) {
    if (haystackSet.has(token)) score += 1;
  }
  return score;
}

function categoryScore(skill, help) {
  let score = 0;
  if (help.includes(skill.category)) score += 3;
  for (const tag of skill.tags || []) {
    if (help.includes(tag)) score += 1;
  }
  return score;
}

// query shape: { description, name, stage, stageOther, help, helpOther, platform }
// Returns the narrowed candidate list to actually send to a provider.
export function filterCandidates(query, skills, limit = DEFAULT_LIMIT) {
  const platformFiltered = query.platform
    ? skills.filter((skill) => matchesPlatform(skill, query.platform))
    : skills;

  if (platformFiltered.length === 0) return [];
  if (platformFiltered.length <= limit) return platformFiltered;

  const help = query.help || [];
  const descriptionTokens = tokenize(query.description);

  let scored;
  if (help.length > 0) {
    scored = platformFiltered.map((skill) => ({
      skill,
      score: categoryScore(skill, help),
    }));
  } else {
    scored = platformFiltered.map((skill) => ({
      skill,
      score: keywordScore(skill, descriptionTokens),
    }));
  }

  const anySignal = scored.some((item) => item.score > 0);
  if (!anySignal) {
    // No local signal at all -- let Groq see everything that survived the
    // platform filter rather than guessing at an arbitrary slice. Only
    // once even that doesn't fit does a curated-order slice happen, as a
    // last resort worth monitoring if it starts happening often.
    return platformFiltered.length <= limit
      ? platformFiltered
      : platformFiltered.slice(0, limit);
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.skill);
}
