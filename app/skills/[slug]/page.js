import { notFound } from "next/navigation";
import skills from "../../../data/skills.json";
import BackButton from "../../components/BackButton";
import SkillDetailContent from "../../components/SkillDetailContent";

export function generateStaticParams() {
  return skills.map((skill) => ({ slug: skill.slug }));
}

export function generateMetadata({ params }) {
  const skill = skills.find((item) => item.slug === params.slug);
  return { title: skill ? `${skill.name} — Skill Discovery Tool` : "Skill not found" };
}

export default function SkillDetailPage({ params }) {
  const skill = skills.find((item) => item.slug === params.slug);
  if (!skill) {
    notFound();
  }

  return (
    <main className="page">
      <BackButton>&larr; Back to results</BackButton>
      <SkillDetailContent skill={skill} />
    </main>
  );
}
