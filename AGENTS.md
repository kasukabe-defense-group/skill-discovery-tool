# AGENTS.md

Shared context for any AI agent working in this repo, Claude, Cursor,
or otherwise. Read this before making product or architecture
decisions. If something here seems outdated or contradicts what
you're about to do, ask the human rather than assuming, that's how
this team prefers to work.

## What this is

Someone types what they're building. We show them existing skills and
tools that could help, from any AI platform, not just Claude. We do
not write new skills for anyone, that's a different idea, deliberately
saved for later, not cancelled.

## The core decision: recommend, don't generate

Two product directions were seriously considered. This is the one we
chose, and why, so it doesn't get re-litigated from scratch by whoever
opens this repo next.

- **What we're building**: suggest existing, real skills for what
  someone's making. No new content gets written by us, either a skill
  fits or it doesn't.
- **The other idea, saved for later**: help write a brand-new skill,
  from scratch or by combining pieces of existing ones. Not cancelled,
  just sequenced after this, because it needs everything this needs
  plus generation, verification, and more places to go wrong.
- **Why this one first**: checked directly, nobody's built "describe
  your idea in plain text, get matched to real existing skills, across
  any platform" yet. The other idea already exists in simpler form,
  Anthropic ships its own skill-creator.

## Scope: multi-platform, intentionally

Not Claude-only. People use different agents, so the dataset spans
skills and tools from multiple AI platforms, not a single one. This
makes curation harder, formats and conventions differ across
platforms, but it's a deliberate choice, not an oversight.

## Where we are, phase-wise

**Phase 1a, build first**: text box for the idea, a detail page per
skill using real skills already gathered, no ranking or matching yet,
a static page on how to write a good skill file, a message for when
daily free usage runs out.

**Phase 1b, added once 1a works**: real matching, plus short
pre-written explanations under each result, not personalized ones yet.

**Matching logic**: two options were weighed, plain keyword matching
(free, instant, no external calls, misses paraphrasing) versus
meaning-based matching (a precomputed "fingerprint" per skill, done
once ahead of time, then one small lookup per search using an outside
free service, better recall, needs an external dependency).
Recommendation on record: use meaning-based matching as the real
answer, keep keyword matching as the fallback for when the free
service's daily limit is hit, not as a parallel feature. The specific
outside service hasn't been named yet, confirm before building against
one.

**Saved for later, not cancelled**: personalized AI-written
explanations, helping someone build a custom skill, detecting project
stage automatically, reading uploaded project files, thumbs up/down
feedback, per-user search limiting, visual polish beyond the one
planned animation.

## Team

Three roles: finding and vetting skills for the dataset, visual
design, backend work. As of this writing, which of the three people
covers which role by name hasn't been finalized, don't assume.

## How to contribute

See `CONTRIBUTING.md` for the actual git workflow. Short version:
`main` is protected, everything comes in through a pull request, no
approval required to merge, so branch before touching anything.

## Still genuinely open, don't assume answers here

- What the site shows when nothing in the dataset matches someone's
  idea.
- What order skills display in during phase 1a, since there's no
  ranking yet.
- Who's sourcing the non-Claude parts of the dataset, given different
  platforms use different formats.
- Whether skills get hosted on this site or linked out to their
  source, and whether redistribution is actually allowed per skill.
- Whether the free-text project description a user types gets stored
  or logged, and if so, what for.
- The project's actual name, still pending a team vote.
