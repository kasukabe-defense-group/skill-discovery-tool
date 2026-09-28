"use client";

import { useSearchParams } from "next/navigation";
import skills from "../../data/skills.json";
import SkillModal from "./SkillModal";

export default function SkillModalHost() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("skill");
  if (!slug) return null;

  const skill = skills.find((item) => item.slug === slug);
  if (!skill) return null;

  return <SkillModal skill={skill} />;
}
