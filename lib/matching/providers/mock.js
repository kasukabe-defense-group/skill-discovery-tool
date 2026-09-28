import { MatchProviderError } from "../errors.js";

// Canned provider used to build and test loading/error states before any
// real provider key exists. Behavior is controlled by MOCK_MATCH_MODE:
//   "success" (default) - returns the first couple of skills after a delay
//   "empty"              - returns no matches (exercises the no-match state)
//   "error"              - throws, exercising each error code in turn
//   "slow"               - long delay, to see the loading state clearly
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function match(query, skills) {
  const mode = process.env.MOCK_MATCH_MODE || "success";

  if (mode === "error") {
    await delay(400);
    const code = query?.errorCode || "unknown";
    throw new MatchProviderError(code, `Mock provider forced a "${code}" error.`);
  }

  if (mode === "slow") {
    await delay(4000);
  } else {
    await delay(800);
  }

  if (mode === "empty") {
    return { matches: [] };
  }

  const picked = skills.slice(0, Math.min(2, skills.length));
  return {
    matches: picked.map((skill, index) => ({
      slug: skill.slug,
      reason:
        index === 0
          ? `Mock match: looked like the closest fit for "${query.description || "your idea"}".`
          : "Mock match: a plausible second option, for testing multi-result layout.",
    })),
  };
}
