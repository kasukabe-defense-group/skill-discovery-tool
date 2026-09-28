import { Suspense } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import ResultsClient from "./ResultsClient";
import SkillCard from "../components/SkillCard";
import SkillModalHost from "../components/SkillModalHost";
import PlatformControl from "../components/PlatformControl";
import { matchesPlatform } from "../../lib/matching/preFilter.js";

export const metadata = {
  title: "Results — Skill Discovery Tool",
};

function splitParam(value) {
  return value
    ? value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
    : [];
}

export default function ResultsPage({ searchParams }) {
  const help = splitParam(searchParams.help);
  const stage = splitParam(searchParams.stage);
  const description = searchParams.description || "";
  const name = searchParams.name || "";
  const stageOther = searchParams.stageOther || "";
  const helpOther = searchParams.helpOther || "";
  const platform = searchParams.platform || "";

  const query = { description, name, stage, stageOther, help, helpOther, platform };
  const hasQuery = Boolean(description);

  const browseAllSkills = platform
    ? skills.filter((skill) => matchesPlatform(skill, platform))
    : skills;

  return (
    <main className="page">
      <Link className="back-link" href="/">
        &larr; Start over
      </Link>
      <h1>{name ? `Skills for ${name}` : "Skills that match what you're building"}</h1>
      {description && (
        <p className="subtitle">Based on: &quot;{description}&quot;</p>
      )}
      {stageOther && (
        <p className="subtitle">Where you&apos;re at: &quot;{stageOther}&quot;</p>
      )}
      {helpOther && (
        <p className="subtitle">
          What you&apos;re looking for: &quot;{helpOther}&quot;
        </p>
      )}

      <Suspense fallback={null}>
        <PlatformControl />
      </Suspense>

      {hasQuery ? (
        <ResultsClient query={query} />
      ) : browseAllSkills.length === 0 ? (
        <div className="empty-state">
          No skills for {platform} yet — try another platform or clear the
          filter.
        </div>
      ) : (
        browseAllSkills.map((skill) => <SkillCard key={skill.slug} skill={skill} />)
      )}

      <Suspense fallback={null}>
        <SkillModalHost />
      </Suspense>
    </main>
  );
}
