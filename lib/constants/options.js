export const HELP_OPTIONS = [
  { value: "design", label: "Design" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "content", label: "Content" },
  { value: "testing", label: "Testing" },
  { value: "deployment", label: "Deployment" },
  { value: "other", label: "Other" },
];

// Curated subset of the open platform vocabulary used in data/skills.json's
// `platform` arrays -- not exhaustive (skills can list real platforms not
// in this list, e.g. "Devin CLI"), just the common ones worth their own
// filter chip. Values here must match skill.platform entries verbatim,
// since matching is a plain string .includes() check.
export const PLATFORM_OPTIONS = [
  "Claude Code",
  "Claude.ai / Desktop",
  "Cursor",
  "Codex",
  "Gemini CLI",
  "Windsurf",
  "GitHub Copilot",
];
