import { MatchProviderError } from "../errors.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// gpt-oss-20b is one of the few Groq-hosted models that supports strict
// json_schema mode (constrained decoding -> guaranteed schema match, not
// best-effort). Confirmed against Groq's structured-outputs docs as of
// 2026-09-28: strict mode is limited to openai/gpt-oss-20b,
// openai/gpt-oss-120b, and qwen/qwen3.8-27b. 20b is the default here for
// speed/cost on a ranking task over ~50-100 short skill entries; override
// with GROQ_MODEL to try 120b for harder cases.
const DEFAULT_MODEL = "openai/gpt-oss-20b";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The exact slug of a skill from the provided list.",
          },
          reason: {
            type: "string",
            description:
              "One short sentence, specific to this query, explaining why this skill helps.",
          },
        },
        required: ["slug", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["matches"],
  additionalProperties: false,
};

function buildSkillsForPrompt(skills) {
  // platform is deliberately excluded here -- the platform hard filter
  // already happened locally (lib/matching/preFilter.js) before any of
  // this reaches Groq, so ranking never needs it. Detail-only fields
  // (whatItDoes, bestThing, howToInstall, sourceUrl, author, sourceNote,
  // needsVerification) are excluded too, to keep the request small as the
  // dataset grows.
  return skills.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    category: skill.category,
    shortDescription: skill.shortDescription,
    whenToHelp: skill.whenToHelp,
    tags: skill.tags,
  }));
}

function buildUserContent(query, skills) {
  return JSON.stringify({
    personBuilding: {
      whatTheyAreBuilding: query.description || null,
      productName: query.name || null,
      stage: query.stage || [],
      stageOther: query.stageOther || null,
      kindOfHelpWanted: query.help || [],
      helpOther: query.helpOther || null,
    },
    availableSkills: buildSkillsForPrompt(skills),
  });
}

const SYSTEM_PROMPT = `You match a person's product idea to existing AI skills from a fixed list.

Rules:
- Only return skills whose "slug" appears in the provided availableSkills list. Never invent a slug.
- Order matches from most to least relevant.
- If nothing in the list is a genuine fit, return an empty matches array. Do not force a weak match just to return something.
- Each reason must be one short sentence, specific to what this particular person is building, not a generic restatement of the skill's description.`;

export async function match(query, skills) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new MatchProviderError(
      "auth_error",
      "GROQ_API_KEY is not set in the environment."
    );
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(query, skills) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "skill_matches",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });
  } catch (err) {
    throw new MatchProviderError(
      "network_error",
      `Groq request failed before getting a response: ${err.message}`
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new MatchProviderError("rate_limited", "Groq rate limit or quota hit.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new MatchProviderError("auth_error", "Groq rejected the API key.");
    }
    const bodyText = await response.text().catch(() => "");
    throw new MatchProviderError(
      "unknown",
      `Groq returned ${response.status}: ${bodyText.slice(0, 300)}`
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new MatchProviderError("invalid_response", "Groq response was not valid JSON.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new MatchProviderError(
      "invalid_response",
      "Groq response had no message content."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new MatchProviderError(
      "invalid_response",
      "Groq's message content was not valid JSON despite strict schema mode."
    );
  }

  if (!Array.isArray(parsed.matches)) {
    throw new MatchProviderError(
      "invalid_response",
      "Groq's parsed response did not include a matches array."
    );
  }

  return { matches: parsed.matches };
}
