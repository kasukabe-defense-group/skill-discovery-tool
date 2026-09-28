"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HELP_OPTIONS, PLATFORM_OPTIONS } from "../lib/constants/options.js";

const STAGE_OPTIONS = [
  { value: "not-started", label: "Haven't started" },
  { value: "planning", label: "Planning or designing" },
  { value: "writing-code", label: "Writing code" },
  { value: "testing-polishing", label: "Built, testing or polishing" },
  { value: "live", label: "Live or deployed" },
  { value: "other", label: "Other" },
];

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

const SUBMIT_COOLDOWN_MS = 5000;

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState([]);
  const [stageOther, setStageOther] = useState("");
  const [help, setHelp] = useState([]);
  const [helpOther, setHelpOther] = useState("");
  const [platform, setPlatform] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), SUBMIT_COOLDOWN_MS);
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (description) params.set("description", description);
    if (stages.length > 0) params.set("stage", stages.join(","));
    if (stages.includes("other") && stageOther) {
      params.set("stageOther", stageOther);
    }
    if (help.length > 0) params.set("help", help.join(","));
    if (help.includes("other") && helpOther) {
      params.set("helpOther", helpOther);
    }
    if (platform) params.set("platform", platform);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <main className="page">
      <h1>What are you building?</h1>
      <p className="subtitle">
        Tell us about it, and we&apos;ll show you real skills that could
        help. A &quot;skill&quot; here is a reusable set of instructions for
        an AI tool &mdash; not code you have to write yourself.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="description">
          What are you building?
          <div className="hint">The only field you need to fill in.</div>
        </label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. A website where people can generate names for a new business"
        />

        <label htmlFor="name">
          Product name
          <div className="hint">Optional.</div>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Name Genius"
        />

        <label>
          Where are you right now?
          <div className="hint">
            Optional. Pick as many as apply &mdash; being in two of these at
            once is normal.
          </div>
        </label>
        <div className="chip-group">
          {STAGE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`chip${stages.includes(option.value) ? " selected" : ""}`}
              onClick={() => setStages((current) => toggleValue(current, option.value))}
            >
              {option.label}
            </button>
          ))}
        </div>
        {stages.includes("other") && (
          <input
            type="text"
            value={stageOther}
            onChange={(event) => setStageOther(event.target.value)}
            placeholder="Tell us where you're at"
            style={{ marginTop: 10 }}
          />
        )}

        <label>
          What kind of help do you want?
          <div className="hint">
            Optional. Pick as many as apply &mdash; this narrows the list.
          </div>
        </label>
        <div className="chip-group">
          {HELP_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`chip${help.includes(option.value) ? " selected" : ""}`}
              onClick={() => setHelp((current) => toggleValue(current, option.value))}
            >
              {option.label}
            </button>
          ))}
        </div>
        {help.includes("other") && (
          <input
            type="text"
            value={helpOther}
            onChange={(event) => setHelpOther(event.target.value)}
            placeholder="Tell us what kind of help you're looking for"
            style={{ marginTop: 10 }}
          />
        )}

        <label>
          Which tool are you using?
          <div className="hint">
            Optional. Pick one to only see skills that actually work there
            &mdash; skip it and we&apos;ll show everything, labeled by
            platform.
          </div>
        </label>
        <div className="chip-group">
          {PLATFORM_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={`chip${platform === option ? " selected" : ""}`}
              onClick={() =>
                setPlatform((current) => (current === option ? "" : option))
              }
            >
              {option}
            </button>
          ))}
        </div>

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Just a moment…" : "Show me skills"}
        </button>
      </form>
    </main>
  );
}
