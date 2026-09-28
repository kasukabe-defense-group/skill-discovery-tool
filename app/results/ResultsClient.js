"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SkillCard from "../components/SkillCard";

const ERROR_COPY = {
  rate_limited:
    "We've hit today's shared limit for matching. Try again later, or browse all skills below.",
  auth_error:
    "Matching is temporarily unavailable (a configuration issue on our end). Try again shortly, or browse all skills below.",
  invalid_response:
    "The matching service gave us something we couldn't read. Try again, or browse all skills below.",
  network_error:
    "Couldn't reach the matching service. Check your connection and try again.",
  unknown: "Something went wrong trying to match your idea. Try again in a moment.",
};

const RETRY_COOLDOWN_MS = 5000;

export default function ResultsClient({ query }) {
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [results, setResults] = useState([]);
  const [errorCode, setErrorCode] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  async function runMatch() {
    setStatus("loading");
    setErrorCode(null);
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrorCode(body?.error?.code || "unknown");
        setStatus("error");
        return;
      }
      setResults(body.results || []);
      setStatus("success");
    } catch (err) {
      setErrorCode("network_error");
      setStatus("error");
    } finally {
      setCooldownUntil(Date.now() + RETRY_COOLDOWN_MS);
    }
  }

  useEffect(() => {
    runMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const canRetry = cooldownRemaining === 0;

  if (status === "loading") {
    return <div className="empty-state">Looking for skills that fit&hellip;</div>;
  }

  if (status === "error") {
    return (
      <div className="empty-state">
        {ERROR_COPY[errorCode] || ERROR_COPY.unknown}
        <br />
        <button
          type="button"
          className="primary"
          style={{ marginTop: 14 }}
          disabled={!canRetry}
          onClick={runMatch}
        >
          {canRetry ? "Try again" : `Try again in ${cooldownRemaining}s`}
        </button>
        <div style={{ marginTop: 10 }}>
          <Link href="/results">Browse all skills instead</Link>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        {query.platform
          ? `No skills for ${query.platform} yet — try another platform or clear the filter.`
          : "Nothing matches yet. We don't have a skill for that in our list right now."}
        <br />
        <Link href="/how-to-write-a-good-skill">
          See how to write a good skill file
        </Link>{" "}
        instead.
      </div>
    );
  }

  return (
    <>
      {results.map((skill) => (
        <SkillCard key={skill.slug} skill={skill} reason={skill.reason} />
      ))}
    </>
  );
}
