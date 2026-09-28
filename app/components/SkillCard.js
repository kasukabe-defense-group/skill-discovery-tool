"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PlatformBadge from "./PlatformBadge";

export default function SkillCard({ skill, reason }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function openModal() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("skill", skill.slug);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className="skill-card"
      onClick={openModal}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openModal();
      }}
    >
      <div className="meta-row">
        <span className="category-badge">{skill.category}</span>
        <PlatformBadge platform={skill.platform} />
        {skill.needsVerification && (
          <span className="verify-badge">Not independently verified</span>
        )}
      </div>
      <h3>{skill.name}</h3>
      <p>{skill.shortDescription}</p>
      {reason && <p>{reason}</p>}
      <div className="tag-list">
        {(skill.tags || []).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
