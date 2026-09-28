import { MatchProviderError } from "./errors.js";
import { filterCandidates } from "./preFilter.js";
import * as mockProvider from "./providers/mock.js";
import * as groqProvider from "./providers/groq.js";

const PROVIDERS = {
  mock: mockProvider,
  groq: groqProvider,
};

// query shape: { description, name, stage: string[], stageOther, help: string[], helpOther, platform }
// Returns: { matches: [{ slug, reason }] }, ordered most to least relevant.
// Never leaves the browser's typed description anywhere except this one
// outbound call to whichever provider is active — no server-side logging
// of it, by design (decided 2026-09-28, since this is the first step
// where anything leaves the browser at all).
export async function matchSkills(query, skills) {
  const providerName = process.env.MATCHING_PROVIDER || "mock";
  const provider = PROVIDERS[providerName];

  if (!provider) {
    throw new MatchProviderError(
      "unknown",
      `Unknown MATCHING_PROVIDER "${providerName}". Expected one of: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }

  const candidateLimit = Number(process.env.MATCH_CANDIDATE_LIMIT) || undefined;
  const candidates = filterCandidates(query, skills, candidateLimit);

  if (candidates.length === 0) {
    return { matches: [] };
  }

  const result = await provider.match(query, candidates);

  // Defensive validation, independent of which provider produced the
  // result: a hallucinated or malformed slug from any provider (most
  // likely a non-strict-mode model) should never reach the frontend.
  // Checked against the candidate set actually offered to the provider,
  // not the full dataset — a real slug the provider was never shown
  // slipping through would be just as wrong as an invented one.
  const validSlugs = new Set(candidates.map((skill) => skill.slug));
  const matches = (result.matches || []).filter(
    (item) => item && typeof item.slug === "string" && validSlugs.has(item.slug)
  );

  return { matches };
}
