import { NextResponse } from "next/server";
import skills from "../../../data/skills.json";
import { matchSkills } from "../../../lib/matching/matchSkills.js";
import { MatchProviderError } from "../../../lib/matching/errors.js";

const STATUS_BY_CODE = {
  rate_limited: 429,
  auth_error: 502,
  invalid_response: 502,
  network_error: 502,
  unknown: 500,
};

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.query !== "object") {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Missing query." } },
      { status: 400 }
    );
  }

  try {
    const { matches } = await matchSkills(body.query, skills);
    const bySlug = new Map(skills.map((skill) => [skill.slug, skill]));
    const results = matches
      .map((m) => {
        const skill = bySlug.get(m.slug);
        return skill ? { ...skill, reason: m.reason } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof MatchProviderError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: STATUS_BY_CODE[err.code] || 500 }
      );
    }
    return NextResponse.json(
      { error: { code: "unknown", message: "Unexpected error." } },
      { status: 500 }
    );
  }
}
